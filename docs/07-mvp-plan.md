# 7. MVP Implementation Plan and Status

## Phase 1 — Functional MVP (this build)

| Area | Status | Where |
|---|---|---|
| Registration, login, logout, email confirmation route | Done | `src/app/(auth)`, `src/app/auth/confirm`, `src/proxy.ts` |
| Onboarding (exam, date, schedule, retention) | Done | `src/app/onboarding`, `src/components/settings` |
| Question input, auto-split paste, 2–10 options, samples | Done | `src/components/analyzer`, `src/lib/questions/parse.ts`, `src/samples` |
| Identifier screening (block + warn) | Done | `src/lib/questions/identifiers.ts` |
| Independent attempt + confidence before AI | Done | `src/app/(app)/analyze/actions.ts` |
| Structured AI analysis with validation + repair | Done | `src/lib/ai` |
| Wrong-option cards + comparison table | Done | `src/components/question/analysis-sections.tsx` |
| Answer integrity (official vs AI-inferred) | Done | grading + banners |
| Partial-failure handling and per-section regenerate | Done | `ai_generation_jobs`, `RegenerateButton` |
| Question library, filters, full-text search, duplicate detection | Done | `/questions`, `find_similar_questions` |
| Flashcard generation, CRUD, decks, tags, search, notes, suspend, Anki export | Done | `/flashcards`, `/api/export/flashcards` |
| FSRS review with interval preview, review log | Done | `src/lib/srs/fsrs.ts`, `/flashcards/review` |
| Study calendar | Done | `/calendar` |
| Notes per question + Notebook (18 systems, hierarchy, tags, search, AI vs mine) | Done | `/notebook` |
| Dashboard (8 cards, 4 charts, today's plan) + analytics page | Done | `/dashboard`, `/analytics`, `src/lib/stats` |
| Report incorrect explanation | Done | `user_feedback` |
| Practice again | Done | `/questions/[id]/practice` |
| Tests | Done | 46 Vitest (unit + RLS integration), 6 Playwright end-to-end |

Not in Phase 1 by design: screenshot OCR upload (Phase 2, needs Storage + vision call), reminder
delivery (preference is stored now), expert review UI (data model in place).

## Phase 2 — Enhanced learning

1. Socratic tutor: `tutor` jobs, conversation table, assistance levels, reveal-anytime.
2. Clinical case generator using `clinical_cases` / `case_attempts`, three difficulty levels.
3. Visual learning: render `visual_suggestions` as Mermaid/SVG diagrams labeled "illustration";
   verified image library via Storage with licence metadata.
4. Adaptive engine: `concept_mastery` table (encounters, errors, confusion pairs); comparison lessons.
5. Screenshot upload → OCR → student confirms parsed text.
6. Reminders: scheduled function writing `notifications`, email via Resend/Postmark, Web Push.

## Phase 3 — Advanced platform

RAG over licensed references (`medical_references` + pgvector) with citations; expert review
workspace for `user_feedback`; clinician-reviewed benchmark eval in CI; practice-exam mode;
study groups; more exam profiles; FSRS parameter optimization per user from `flashcard_reviews`.
