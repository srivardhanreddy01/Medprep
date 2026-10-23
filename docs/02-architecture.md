# 2. Application Architecture

```
Browser (React 19, Tailwind, Recharts)
   │  server actions / route handlers (cookies carry Supabase session)
   ▼
Next.js 16 App Router (Node runtime, Vercel)
   ├─ src/proxy.ts                 refreshes Supabase session, guards /app routes
   ├─ src/app/(app)/…              authenticated pages (server components)
   ├─ src/app/**/actions.ts        server actions: validate (Zod) → Supabase (RLS) → revalidate
   ├─ src/lib/ai/                  provider abstraction, prompts, schemas, analysis pipeline
   ├─ src/lib/srs/                 FSRS wrapper (ts-fsrs)
   ├─ src/lib/questions/           parser, identifier screen, hashing, grading
   └─ src/lib/plan/                deterministic daily study planner
   ▼
Supabase
   ├─ Auth (email/password, email confirmation optional)
   ├─ Postgres 15+ with RLS, pg_trgm, tsvector search, SQL functions for analytics
   └─ Storage (Phase 2: screenshots, diagrams)
   ▼
LLM provider (configurable, default Anthropic Claude via official SDK, structured JSON outputs)
```

## 2.1 Key decisions

| Decision | Rationale |
|---|---|
| Next.js server actions instead of a separate API | One deployable; typed end-to-end; FastAPI only becomes justified for heavy RAG/OCR pipelines in Phase 3 |
| All DB access with the **user's** Supabase session (anon key + JWT) | RLS is the security boundary; the service-role key is never needed at runtime |
| AI calls only on the server | Keys never reach the browser; outputs validated before persistence |
| Two AI jobs per question: `analysis` and `flashcards` | Partial failure keeps the analysis; each job regenerates independently (R10) |
| Zod schema is the single source of truth | Used for model structured output **and** for post-validation + consistency checks |
| FSRS via `ts-fsrs` | Documented, maintained FSRS implementation; we store full card state + review log so parameters can be optimized per user later |
| Analytics in SQL functions (`security invoker`) | Runs under RLS, avoids shipping raw rows to the server |

## 2.2 Request flow — "Analyze Question"

1. Client parses paste → editable stem/options (`parseQuestionText`).
2. Server action `submitQuestion`:
   * Zod-validates input (length limits, 2–10 options, unique labels).
   * `screenForIdentifiers` → blocks on hard identifiers.
   * Per-user rate limit (count of `ai_generation_jobs` in last hour).
   * Computes `content_hash`; exact duplicate → returns link to existing question.
   * Inserts `questions`, `answer_choices`, and the student's `question_attempts` row.
3. `runAnalysis(questionId)`: creates `ai_generation_jobs` row (running) → provider
   `generateStructured(AnalysisSchema)` → `validateAnalysis` (labels match, every option explained,
   confidence sane) → inserts `ai_analyses` (versioned) → updates job → grades the attempt
   (against official key if present, else against AI answer marked *unverified*) → stores the AI
   learning summary as an AI note.
4. `runFlashcards(questionId)`: separate job; dedupes against the user's existing fronts; inserts
   cards + initial FSRS schedule rows.
5. Redirect to `/questions/[id]`, which renders tabs from the stored analysis.

## 2.3 Provider abstraction

```ts
interface LLMProvider {
  name: string;
  model: string;
  generateStructured<T>(req: {
    system: string; prompt: string; schema: z.ZodType<T>; schemaName: string; maxTokens?: number;
  }): Promise<{ data: T; usage?: { inputTokens: number; outputTokens: number } }>;
}
```

`getProvider()` reads `LLM_PROVIDER` (`anthropic` | `fixture`). `fixture` is a deterministic
provider used **only** by automated tests and local development without a key; it refuses to run
when `NODE_ENV=production` and every fixture output is labeled "test fixture" in the UI.
Adding OpenAI, Gemini or a self-hosted model means implementing one class.

## 2.4 Security

* RLS: `user_id = auth.uid()` for select/insert/update/delete on every user table. Child tables
  (`answer_choices`) check ownership through the parent. Reference tables (`exam_profiles`,
  `medical_topics`) are read-only to `authenticated`.
* Append-only tables (`question_attempts`, `flashcard_reviews`, `ai_analyses`) have no update policy.
* Proxy redirects unauthenticated users; server components re-check with `auth.getUser()`.
* Input limits: stem ≤ 12 000 chars, option ≤ 1 000 chars, note ≤ 20 000 chars.
* Secure headers in `next.config.ts` (CSP-lite, frame-ancestors none, referrer policy).

## 2.5 Scheduling jobs

Reviews are computed on read (`due <= now()`), so no cron is needed for correctness. Phase 2
reminders use a Supabase scheduled function or Vercel Cron that inserts `notifications` rows for
users who opted in.

## 2.6 Directory layout

```
docs/                         planning documents (this folder)
supabase/migrations/          SQL schema, RLS, functions, seed of reference data
src/app/                      routes (auth, (app) group, api)
src/components/ui/            shadcn-style primitives (Button, Card, Tabs, …)
src/components/…              feature components (analyzer, flashcards, charts)
src/lib/                      domain logic (pure, unit-tested) + Supabase clients
src/samples/                  fictional educational sample questions
tests/                        Vitest unit tests + integration test against local Supabase
```
