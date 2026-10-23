# 1. Product Requirements Document — MedPrep Reasoning Tutor

## 1.1 Vision

A personal AI medical tutor that turns every multiple-choice question a student meets into
(a) a clinical-reasoning lesson, (b) a reusable learning asset in their library, and (c) a future
memory review. The product teaches *how to think*, not just *which letter is right*.

## 1.2 Users

| Persona | Need |
|---|---|
| US MD/DO student (USMLE Step 1, Step 2 CK, Step 3, COMLEX) | Understand why distractors are wrong; retain high-yield facts until exam day |
| IMG preparing for USMLE / PLAB / UKMLA | Exam-specific scope and style; efficient daily plan |
| Indian PG aspirant (NEET PG, INI-CET) | Fast recall-heavy explanations, large flashcard volume |

## 1.3 Principles

1. **Answer integrity.** An official key and the AI's reasoned answer are stored and shown separately.
   With no key, the UI says "AI-inferred, not officially verified". Ambiguous, outdated or
   multi-answer questions are flagged.
2. **No invented evidence.** The model is instructed never to fabricate guidelines, studies or
   citations; references are only shown when they come from a curated source (Phase 3 retrieval).
   In Phase 1 the references list is expected to be empty and the UI says so.
3. **Measured vs estimated.** Every dashboard number is labeled as *measured* (counts of saved
   activity) or *estimated* (e.g. FSRS retrievability). No score prediction.
4. **Education only.** Not for diagnosis or treatment. A disclaimer is shown on sign-up, analyzer
   and in the footer. Submissions are screened for patient identifiers.
5. **History is preserved.** Attempts, analyses and reviews are append-only.

## 1.4 Phase 1 scope (this build)

| # | Requirement | Acceptance |
|---|---|---|
| R1 | Email/password registration, login, logout | Student can sign up, sign in, sign out; session persists |
| R2 | Onboarding: target exam, exam date, daily minutes, retention target | Saved to `profiles` / `study_preferences`; editable in Settings |
| R3 | Question input: stem + options (A–J), or one paste that is auto-split | Parser separates stem and options; student can correct before submitting |
| R4 | Exam + subject selection (or "auto-classify") | Stored on question; AI classification fills topic when "auto" |
| R5 | Independent attempt + confidence before analysis | Attempt is stored *before* the AI runs |
| R6 | Optional official answer | Stored separately; agreement with AI shown |
| R7 | Identifier screen | Emails, phone numbers, MRN/SSN-style numbers block submission; dates/names warn |
| R8 | Structured AI analysis (answer, 6-step reasoning, differential, per-option cards, traps, mnemonics, takeaways, uncertainty flags) | Output validated with Zod and consistency checks before saving |
| R9 | Wrong-option explanations: meaning, why plausible, why wrong here, when correct, distinguishing clue, tip | One card per option, plus comparison table |
| R10 | Partial failure handling | Question saved even if AI fails; analysis and flashcards regenerate independently |
| R11 | Question library with filters (subject, exam, result, difficulty, review status, date) and full-text search | Postgres `tsvector` search; duplicate detection on submit |
| R12 | Flashcards: 3–8 generated per question (basic, clinical, differential, cloze), deduplicated | Saved to default deck; editable, deletable, taggable, notes, custom decks, search |
| R13 | Spaced repetition with FSRS (ts-fsrs, FSRS-6 default weights) | Again/Hard/Good/Easy; next due date shown per button; review log stored |
| R14 | Study calendar: due today, overdue, upcoming, completed | Driven by real schedule + review log |
| R15 | Notes per question and a Notebook organized by 18 systems/disciplines, hierarchical, tagged, searchable | AI summary notes visually distinct from student notes |
| R16 | Dashboard: 8 overview cards, activity/accuracy/subject/review charts, today's plan | Computed from saved rows only |
| R17 | Report an incorrect explanation | Stored in `user_feedback` with status for expert triage |
| R18 | Practice an existing question again (hidden answer) | New attempt row; counts toward "questions practiced" |
| R19 | Export flashcards (Anki-compatible TSV) | Download from Flashcards page |

## 1.5 Phase 2 / 3 (designed, not built)

Phase 2: Socratic tutor ("Teach Me to Think"), clinical case generator (3 levels), visual learning
engine, adaptive concept mastery with confusion-pair lessons, advanced analytics, image cards,
reminders (email/browser). Phase 3: licensed reference retrieval (RAG) with citations, expert
review workflow UI, practice-exam mode, study groups, more exam profiles, integrations.
Schema tables for cases, notifications, references and feedback exist already so these phases add
features without destructive migrations.

## 1.6 Non-functional requirements

* Security: Supabase Auth, RLS on every user-owned table, server-only LLM keys, input size limits,
  rate limit on analysis per user per hour.
* Privacy: no identifiable patient data; question content is private to the owner.
* Copyright: library is private; no redistribution. Users confirm they have the right to use pasted
  content.
* Accessibility: WCAG 2.2 AA contrast, keyboard navigation, focus rings, `aria-*` on tabs and flip
  cards, reduced-motion support.
* Performance: dashboard queries via SQL functions; analysis call ≤ 5 min with progress UI.

## 1.7 Success metrics

Activation (first analysis within 24 h of sign-up), D7 retention, reviews completed / due,
share of analyses reported as incorrect (quality guardrail), median time-to-analysis.
