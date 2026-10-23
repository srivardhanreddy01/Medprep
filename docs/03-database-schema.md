# 3. Database Schema

Source of truth: `supabase/migrations/`. Generated TypeScript types: `src/lib/supabase/database.types.ts`
(`npm run db:types`).

## 3.1 Entity map

```
auth.users ─┬─ profiles (1:1)              target exam, exam date, time zone, onboarded_at
            ├─ study_preferences (1:1)     daily minutes, study days, FSRS retention target, new-card limit, reminder consent
            ├─ questions ─┬─ answer_choices (1:n, label A–J)
            │             ├─ question_attempts (append-only; initial + practice)
            │             ├─ ai_analyses (versioned; validated JSON result)
            │             ├─ ai_generation_jobs (analysis / flashcards / case / tutor; status + tokens)
            │             ├─ notes (via question_id) and note_links (many-to-many)
            │             └─ clinical_cases ── case_attempts            (Phase 2)
            ├─ flashcard_decks ── flashcards ─┬─ review_schedules (1:1 current FSRS state)
            │                                 └─ flashcard_reviews (append-only review log)
            ├─ notes (hierarchical via parent_id; origin user|ai; type note|pearl|mnemonic|summary|highlight)
            ├─ study_sessions, notifications, user_feedback
reference:  exam_profiles, medical_topics (18 systems/disciplines), medical_references (Phase 3, curated only)
```

## 3.2 Table notes

| Table | Key columns | Notes |
|---|---|---|
| `questions` | `stem`, `exam_profile_id`, `topic_id`, `topic_source`, `official_answer_label`, `difficulty`, `review_status`, `content_hash`, `search` | `unique(user_id, content_hash)` prevents exact duplicates; `pg_trgm` index powers near-duplicate detection; `search` is a generated `tsvector` |
| `answer_choices` | `label`, `text`, `position` | `unique(question_id, label)`; ownership via parent question in RLS |
| `question_attempts` | `selected_label`, `confidence`, `mode`, `time_spent_seconds`, `is_correct`, `graded_against` | Insert-only; one RLS update path that only fills in an ungraded result |
| `ai_analyses` | `version`, `provider`, `model`, `prompt_version`, `ai_answer_label`, `ai_confidence`, `agrees_with_official`, `result` | Regenerating creates a new version; previous versions remain |
| `ai_generation_jobs` | `job_type`, `status`, `error`, `input_tokens`, `output_tokens` | Used for per-section retry, rate limiting, and cost tracking |
| `flashcards` | `card_type`, `front`, `back`, `explanation`, `tags[]`, `personal_note`, `origin`, `suspended` | `unique(user_id, front_normalized)` blocks duplicate cards; full-text `search` |
| `review_schedules` | FSRS `due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `learning_steps`, `reps`, `lapses`, `state`, `last_review` | Mirrors ts-fsrs `Card`; `updated_at` used for optimistic concurrency on review |
| `flashcard_reviews` | `rating`, `state_before`, `due_before`, `stability_after`, `difficulty_after`, `scheduled_days`, `next_due`, `retrievability_before`, `duration_ms` | Full history for FSRS parameter optimization later |
| `notes` | `title`, `body`, `note_type`, `origin`, `topic_id`, `parent_id`, `tags[]`, `pinned` | AI notes are read-only in the app; students can copy them into their own note |
| `user_feedback` | `kind`, `section`, `message`, `status`, `reviewer_note` | Expert review queue (Phase 3 UI) |

## 3.3 Security model

* RLS enabled on every table. Owned tables: `user_id = auth.uid()` for all operations.
* Append-only tables (`question_attempts`, `ai_analyses`, `flashcard_reviews`, `case_attempts`,
  `user_feedback`) have no update/delete policy (one exception above for grading).
* `assert_same_owner` trigger stops a user from attaching rows to another user's question or deck
  even if they guess its UUID.
* Analytics functions are `security invoker`, so they run under the caller's RLS.
* `handle_new_user` (security definer) creates profile, preferences, and the default deck.
* Verified by `tests/rls.integration.test.ts` against a real Supabase instance.

## 3.4 Analytics functions

| Function | Returns |
|---|---|
| `daily_activity(p_days, p_tz)` | per local day: questions analyzed, attempts, correct, graded, reviews |
| `topic_performance()` | per topic: graded attempts, correct, accuracy, question count |
| `activity_days(p_tz, p_days)` | distinct active days for the streak |
| `find_similar_questions(p_stem, p_limit)` | trigram near-duplicates above 0.6 similarity |
