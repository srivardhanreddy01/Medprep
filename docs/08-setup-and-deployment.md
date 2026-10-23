# 8. Setup, Testing and Deployment

## 8.1 Prerequisites

Node.js 20.9+ (22 recommended), npm, Docker (for local Supabase), and the Supabase CLI (`npx supabase` works).

## 8.2 Run locally

```bash
npm install
cp .env.example .env.local
npx supabase start            # prints the local API URL and anon key
```

Put the printed values into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
```

`supabase start` applies `supabase/migrations/` automatically (schema, RLS, exam profiles, topics).
Then `npm run dev` and open http://localhost:3000.

Local email confirmation is disabled in `supabase/config.toml`, so sign-up logs you straight in.

**No API key yet?** Set `LLM_PROVIDER=fixture` and `ALLOW_FIXTURE_PROVIDER=true`. The app then uses a
deterministic test provider: the hypercalcemia sample gets a full hand-written explanation, and other
questions get a clearly labelled placeholder. Never use it for real study.

## 8.3 Environment variables

| Variable | Required | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Same page (anon / publishable key) |
| `NEXT_PUBLIC_SITE_URL` | yes in production | Your deployed URL, used in confirmation emails |
| `ANTHROPIC_API_KEY` | yes (unless fixture) | console.anthropic.com → API keys. Server-only |
| `LLM_PROVIDER` | no | `anthropic` (default) or `fixture` |
| `LLM_MODEL` | no | default `claude-opus-5-5` |
| `LLM_EFFORT` | no | default `high` |
| `AI_JOBS_PER_HOUR` | no | default 30 per user |

The service-role key is never needed by the app.

## 8.4 Tests

```bash
npm run typecheck
npm run lint
npm test                      # unit tests (parsing, identifiers, grading, FSRS, plan, validation)

# RLS isolation tests against a running Supabase (local is fine):
SUPABASE_TEST_URL=http://127.0.0.1:54321 SUPABASE_TEST_ANON_KEY=<anon key> npm test

# End-to-end acceptance (app running on :3000 with the fixture provider):
npm run build && npm start &
npm run test:e2e              # set PW_CHROMIUM_PATH to use a preinstalled Chromium
```

The e2e suite walks the acceptance criteria: sign up and onboard, identifier blocking, paste →
attempt → analysis with every tab, duplicate detection, flashcard review with FSRS, dashboard,
notebook, practice, and persistence after signing out and back in.

## 8.5 Deploy (Supabase Cloud + Vercel)

1. Create a Supabase project. Link and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
2. Supabase → Authentication → URL configuration: set **Site URL** to your app URL and add
   `https://<your-domain>/auth/confirm` to redirect URLs. Keep email confirmation on.
3. Optional: edit the "Confirm signup" email template to link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/onboarding`.
4. Import the repo into Vercel and add the environment variables from 8.3 (do **not** set
   `LLM_PROVIDER=fixture` in production).
5. Analysis can take up to a few minutes at high effort. The analyze and question routes set
   `maxDuration = 300`; on Vercel this needs Fluid compute (default for new projects) or a plan that
   allows 300s functions. Lower `LLM_EFFORT` to `medium` if you need faster responses.
6. Deploy. Sign up, complete onboarding, and analyze one sample question to confirm.

Other hosts work too (`npm run build && npm start` on any Node 20+ server).

## 8.6 Operations

* AI cost and failures: `ai_generation_jobs` records status, errors, and token usage per job.
* Reported explanations: `user_feedback` (status `open`).
* Backups: Supabase daily backups; users can export everything from Settings.
* Regenerate DB types after changing migrations: `npm run db:types`.
