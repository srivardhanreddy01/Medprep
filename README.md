# MedPrep — AI-powered medical exam reasoning trainer

Paste a practice question, commit to an answer, and get a structured explanation: the answer with
calibrated confidence, six-step clinical reasoning, a card for every wrong option, exam strategy,
flashcards scheduled with FSRS, and notes organised into a medical notebook. Built for USMLE,
COMLEX, PLAB/UKMLA, NEET PG, INI-CET, and similar exams.

> Educational use only. Not medical advice. Do not enter identifiable patient information.

## Quick start

```bash
npm install
cp .env.example .env.local
npx supabase start          # copy the API URL + anon key into .env.local
# add ANTHROPIC_API_KEY, or set LLM_PROVIDER=fixture + ALLOW_FIXTURE_PROVIDER=true to try it offline
npm run dev
```

Full instructions, tests, and deployment: [docs/08-setup-and-deployment.md](docs/08-setup-and-deployment.md).

## Stack

Next.js 16 (App Router, server actions) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style
components · Supabase (Postgres, Auth, RLS) · Anthropic Claude via a provider abstraction ·
Zod-validated structured output · ts-fsrs · Recharts · Vitest · Playwright.

## Documentation

1. [Product requirements](docs/01-product-requirements.md)
2. [Architecture](docs/02-architecture.md)
3. [Database schema](docs/03-database-schema.md)
4. [Navigation and wireframes](docs/04-navigation-and-wireframes.md)
5. [Design system](docs/05-design-system.md)
6. [AI prompts and schemas](docs/06-ai-prompts-and-schemas.md)
7. [MVP plan and status](docs/07-mvp-plan.md)
8. [Setup, testing, deployment](docs/08-setup-and-deployment.md)

## Integrity rules built in

* The official answer key and the AI's answer are stored and shown separately; without a key the
  answer is labelled "AI-inferred, not officially verified".
* No invented citations: references only come from a curated table (empty in Phase 1).
* Identifier screening blocks emails, phone numbers, record numbers, and similar before saving.
* Dashboard metrics are labelled measured or estimated. No score prediction.
* Sample questions are original and fictional. Do not paste proprietary question-bank content you
  are not licensed to store.
