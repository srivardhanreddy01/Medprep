-- MedPrep initial schema: reference data, user-owned learning data, RLS, analytics functions.
-- Every user-owned table carries user_id and is isolated by row-level security.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Reference data (read-only for students)
-- ---------------------------------------------------------------------------

create table public.exam_profiles (
  id text primary key,                       -- slug, e.g. 'usmle-step1'
  name text not null,
  region text not null,
  description text not null,
  scope_notes text not null,                 -- injected into prompts to adapt depth/scope
  question_style text not null,
  sort_order int not null default 0
);

create table public.medical_topics (
  id serial primary key,
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('system', 'discipline')),
  parent_id int references public.medical_topics(id) on delete set null,
  sort_order int not null default 0
);

-- Phase 3: curated, licensed references used for retrieval. Never populated by the model.
create table public.medical_references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  publisher text,
  url text,
  license text not null,
  guideline_version text,
  published_on date,
  reviewed_on date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  target_exam_id text references public.exam_profiles(id),
  exam_date date,
  timezone text not null default 'UTC',
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.study_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_minutes int not null default 120 check (daily_minutes between 10 and 960),
  study_days smallint[] not null default '{1,2,3,4,5,6,0}',  -- 0 = Sunday
  desired_retention numeric(3,2) not null default 0.90 check (desired_retention between 0.70 and 0.97),
  max_new_cards_per_day int not null default 30 check (max_new_cards_per_day between 0 and 500),
  email_reminders boolean not null default false,
  browser_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Create profile + preferences rows when a user signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  insert into public.study_preferences (user_id) values (new.id);
  insert into public.flashcard_decks (user_id, name, description, is_default)
  values (new.id, 'My Cards', 'Default deck for generated and new cards', true);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exam_profile_id text not null references public.exam_profiles(id),
  topic_id int references public.medical_topics(id),
  topic_source text not null default 'user' check (topic_source in ('user', 'ai')),
  stem text not null check (char_length(stem) between 20 and 12000),
  official_answer_label text check (official_answer_label ~ '^[A-J]$'),
  source_note text check (char_length(source_note) <= 500),
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  review_status text not null default 'new' check (review_status in ('new', 'learning', 'mastered', 'flagged')),
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('english', stem || ' ' || coalesce(source_note, ''))) stored,
  unique (user_id, content_hash)
);
create index questions_user_created_idx on public.questions (user_id, created_at desc);
create index questions_search_idx on public.questions using gin (search);
create index questions_stem_trgm_idx on public.questions using gin (stem extensions.gin_trgm_ops);

create table public.answer_choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  label text not null check (label ~ '^[A-J]$'),
  text text not null check (char_length(text) between 1 and 1000),
  position smallint not null,
  unique (question_id, label)
);

-- Append-only: every attempt is a new row.
create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_label text check (selected_label ~ '^[A-J]$'),
  confidence text check (confidence in ('low', 'medium', 'high')),
  mode text not null default 'initial' check (mode in ('initial', 'practice')),
  time_spent_seconds int check (time_spent_seconds between 0 and 86400),
  is_correct boolean,                              -- null until an answer key (official or AI) exists
  graded_against text check (graded_against in ('official', 'ai_unverified')),
  created_at timestamptz not null default now()
);
create index question_attempts_user_idx on public.question_attempts (user_id, created_at desc);
create index question_attempts_question_idx on public.question_attempts (question_id, created_at desc);

-- Versioned AI analyses (history preserved). result holds the validated JSON.
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  version int not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  ai_answer_label text check (ai_answer_label ~ '^[A-J]$'),
  ai_confidence text check (ai_confidence in ('low', 'moderate', 'high')),
  question_task text,
  agrees_with_official boolean,
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (question_id, version)
);
create index ai_analyses_question_idx on public.ai_analyses (question_id, version desc);

create table public.ai_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  job_type text not null check (job_type in ('analysis', 'flashcards', 'case', 'tutor')),
  status text not null default 'running' check (status in ('queued', 'running', 'succeeded', 'failed')),
  provider text,
  model text,
  error text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index ai_jobs_user_created_idx on public.ai_generation_jobs (user_id, created_at desc);
create index ai_jobs_question_idx on public.ai_generation_jobs (question_id, job_type, created_at desc);

-- ---------------------------------------------------------------------------
-- Clinical cases (Phase 2 feature; schema ready)
-- ---------------------------------------------------------------------------

create table public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_question_id uuid references public.questions(id) on delete set null,
  topic_id int references public.medical_topics(id),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table public.case_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  case_id uuid not null references public.clinical_cases(id) on delete cascade,
  selected_label text,
  is_correct boolean,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Flashcards + FSRS
-- ---------------------------------------------------------------------------

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 500),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create unique index flashcard_decks_one_default on public.flashcard_decks (user_id) where is_default;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  topic_id int references public.medical_topics(id),
  card_type text not null check (card_type in ('basic', 'clinical', 'differential', 'cloze', 'image')),
  front text not null check (char_length(front) between 1 and 2000),
  back text not null check (char_length(back) between 1 and 4000),
  explanation text check (char_length(explanation) <= 4000),
  tags text[] not null default '{}',
  personal_note text check (char_length(personal_note) <= 4000),
  origin text not null default 'user' check (origin in ('ai', 'user')),
  suspended boolean not null default false,
  front_normalized text generated always as (lower(regexp_replace(front, '\s+', ' ', 'g'))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    to_tsvector('english', front || ' ' || back || ' ' || coalesce(explanation, '') || ' ' || coalesce(personal_note, ''))
  ) stored
);
create index flashcards_user_deck_idx on public.flashcards (user_id, deck_id);
create index flashcards_search_idx on public.flashcards using gin (search);
create index flashcards_tags_idx on public.flashcards using gin (tags);
create unique index flashcards_user_front_unique on public.flashcards (user_id, front_normalized);

-- Current FSRS state per card (1:1). Mirrors ts-fsrs Card.
create table public.review_schedules (
  flashcard_id uuid primary key references public.flashcards(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  elapsed_days int not null default 0,
  scheduled_days int not null default 0,
  learning_steps int not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  state smallint not null default 0 check (state between 0 and 3),  -- New, Learning, Review, Relearning
  last_review timestamptz,
  updated_at timestamptz not null default now()
);
create index review_schedules_user_due_idx on public.review_schedules (user_id, due);

-- Append-only review history (FSRS ReviewLog + context).
create table public.flashcard_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),          -- Again, Hard, Good, Easy
  state_before smallint not null,
  due_before timestamptz not null,
  stability_after double precision not null,
  difficulty_after double precision not null,
  scheduled_days int not null,
  next_due timestamptz not null,
  retrievability_before double precision,                          -- FSRS estimate at review time
  duration_ms int check (duration_ms between 0 and 3600000),
  reviewed_at timestamptz not null default now()
);
create index flashcard_reviews_user_time_idx on public.flashcard_reviews (user_id, reviewed_at desc);
create index flashcard_reviews_card_idx on public.flashcard_reviews (flashcard_id, reviewed_at desc);

-- ---------------------------------------------------------------------------
-- Notes / notebook
-- ---------------------------------------------------------------------------

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  topic_id int references public.medical_topics(id),
  parent_id uuid references public.notes(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 20000),
  note_type text not null default 'note' check (note_type in ('note', 'pearl', 'mnemonic', 'summary', 'highlight')),
  origin text not null default 'user' check (origin in ('user', 'ai')),
  tags text[] not null default '{}',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('english', title || ' ' || body)) stored
);
create index notes_user_topic_idx on public.notes (user_id, topic_id);
create index notes_question_idx on public.notes (question_id);
create index notes_search_idx on public.notes using gin (search);

create table public.note_links (
  note_id uuid not null references public.notes(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (note_id, question_id)
);

-- ---------------------------------------------------------------------------
-- Activity, notifications, feedback
-- ---------------------------------------------------------------------------

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('analyze', 'review', 'practice', 'notes')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  items_completed int not null default 0
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'browser')),
  kind text not null,
  title text not null,
  body text,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz
);

create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_id uuid references public.questions(id) on delete set null,
  analysis_id uuid references public.ai_analyses(id) on delete set null,
  section text,
  kind text not null check (kind in ('incorrect', 'unclear', 'outdated', 'ambiguous_question', 'other')),
  message text not null check (char_length(message) between 3 and 4000),
  status text not null default 'open' check (status in ('open', 'triaged', 'resolved', 'rejected')),
  reviewer_note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger prefs_touch before update on public.study_preferences for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger flashcards_touch before update on public.flashcards for each row execute function public.touch_updated_at();
create trigger schedules_touch before update on public.review_schedules for each row execute function public.touch_updated_at();
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.exam_profiles enable row level security;
alter table public.medical_topics enable row level security;
alter table public.medical_references enable row level security;
create policy "reference data readable" on public.exam_profiles for select to authenticated, anon using (true);
create policy "topics readable" on public.medical_topics for select to authenticated, anon using (true);
create policy "references readable" on public.medical_references for select to authenticated using (true);

alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter table public.study_preferences enable row level security;
create policy "own prefs read" on public.study_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy "own prefs update" on public.study_preferences for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Full CRUD on owned rows.
do $$
declare t text;
begin
  foreach t in array array[
    'questions', 'flashcard_decks', 'flashcards', 'review_schedules', 'notes', 'note_links',
    'study_sessions', 'clinical_cases', 'notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Append-only owned rows: select + insert only (history is never rewritten).
do $$
declare t text;
begin
  foreach t in array array['question_attempts', 'ai_analyses', 'flashcard_reviews', 'case_attempts', 'user_feedback'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Grading an attempt once the answer key is known is the only permitted attempt update,
-- and only while it is still ungraded.
create policy "grade own ungraded attempt" on public.question_attempts for update to authenticated
  using (user_id = (select auth.uid()) and is_correct is null)
  with check (user_id = (select auth.uid()));

alter table public.ai_generation_jobs enable row level security;
create policy "own jobs select" on public.ai_generation_jobs for select to authenticated using (user_id = (select auth.uid()));
create policy "own jobs insert" on public.ai_generation_jobs for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own jobs update" on public.ai_generation_jobs for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Answer choices: ownership through the parent question.
alter table public.answer_choices enable row level security;
create policy "choices via question" on public.answer_choices for all to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and q.user_id = (select auth.uid())))
  with check (exists (select 1 from public.questions q where q.id = question_id and q.user_id = (select auth.uid())));

-- Integrity: a child row may only point at parents owned by the same user.
create function public.assert_same_owner() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_table_name = 'flashcards' then
    if not exists (select 1 from public.flashcard_decks d where d.id = new.deck_id and d.user_id = new.user_id) then
      raise exception 'deck does not belong to user';
    end if;
  end if;
  if new.question_id is not null and not exists (
    select 1 from public.questions q where q.id = new.question_id and q.user_id = new.user_id
  ) then
    raise exception 'question does not belong to user';
  end if;
  return new;
end;
$$;
create trigger flashcards_owner before insert or update on public.flashcards for each row execute function public.assert_same_owner();
create trigger notes_owner before insert or update on public.notes for each row execute function public.assert_same_owner();
create trigger attempts_owner before insert on public.question_attempts for each row execute function public.assert_same_owner();
create trigger analyses_owner before insert on public.ai_analyses for each row execute function public.assert_same_owner();

-- ---------------------------------------------------------------------------
-- Analytics functions (security invoker → RLS applies)
-- ---------------------------------------------------------------------------

create function public.find_similar_questions(p_stem text, p_limit int default 3)
returns table (id uuid, stem text, similarity real, created_at timestamptz)
language sql stable security invoker set search_path = public, extensions as $$
  select q.id, left(q.stem, 240), similarity(q.stem, p_stem), q.created_at
  from public.questions q
  where q.user_id = auth.uid() and similarity(q.stem, p_stem) > 0.6
  order by similarity(q.stem, p_stem) desc
  limit p_limit;
$$;

-- Daily activity for the last p_days days in the user's timezone.
create function public.daily_activity(p_days int default 30, p_tz text default 'UTC')
returns table (day date, analyzed int, attempts int, correct int, graded int, reviews int)
language sql stable security invoker set search_path = public as $$
  with days as (
    select generate_series((now() at time zone p_tz)::date - (p_days - 1), (now() at time zone p_tz)::date, '1 day')::date as day
  ),
  a as (
    select (created_at at time zone p_tz)::date d, count(*) n,
           count(*) filter (where is_correct) c, count(*) filter (where is_correct is not null) g
    from question_attempts where user_id = auth.uid() and created_at > now() - make_interval(days => p_days + 1)
    group by 1
  ),
  q as (
    select (created_at at time zone p_tz)::date d, count(distinct question_id) n
    from ai_analyses where user_id = auth.uid() and created_at > now() - make_interval(days => p_days + 1)
    group by 1
  ),
  r as (
    select (reviewed_at at time zone p_tz)::date d, count(*) n
    from flashcard_reviews where user_id = auth.uid() and reviewed_at > now() - make_interval(days => p_days + 1)
    group by 1
  )
  select days.day, coalesce(q.n, 0)::int, coalesce(a.n, 0)::int, coalesce(a.c, 0)::int, coalesce(a.g, 0)::int, coalesce(r.n, 0)::int
  from days left join a on a.d = days.day left join q on q.d = days.day left join r on r.d = days.day
  order by days.day;
$$;

-- Accuracy per topic over graded attempts.
create function public.topic_performance()
returns table (topic_id int, topic_name text, attempts int, correct int, accuracy numeric, questions int)
language sql stable security invoker set search_path = public as $$
  select t.id, t.name,
         count(a.id) filter (where a.is_correct is not null)::int,
         count(a.id) filter (where a.is_correct)::int,
         round(100.0 * count(a.id) filter (where a.is_correct) / nullif(count(a.id) filter (where a.is_correct is not null), 0), 1),
         count(distinct q.id)::int
  from questions q
  join medical_topics t on t.id = q.topic_id
  left join question_attempts a on a.question_id = q.id
  where q.user_id = auth.uid()
  group by t.id, t.name
  order by t.name;
$$;

-- Distinct activity days (attempts, reviews, analyses, notes) for streak computation.
create function public.activity_days(p_tz text default 'UTC', p_days int default 400)
returns table (day date)
language sql stable security invoker set search_path = public as $$
  select distinct d from (
    select (created_at at time zone p_tz)::date d from question_attempts where user_id = auth.uid() and created_at > now() - make_interval(days => p_days)
    union all
    select (reviewed_at at time zone p_tz)::date from flashcard_reviews where user_id = auth.uid() and reviewed_at > now() - make_interval(days => p_days)
    union all
    select (created_at at time zone p_tz)::date from notes where user_id = auth.uid() and origin = 'user' and created_at > now() - make_interval(days => p_days)
  ) s order by d desc;
$$;

grant execute on function public.find_similar_questions(text, int) to authenticated;
grant execute on function public.daily_activity(int, text) to authenticated;
grant execute on function public.topic_performance() to authenticated;
grant execute on function public.activity_days(text, int) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
