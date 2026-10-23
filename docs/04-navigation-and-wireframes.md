# 4. Page Navigation and Wireframes

## 4.1 Sitemap

```
/                     Landing (public)
/login, /signup       Auth (public)            /auth/confirm   email link handler
/disclaimer           Educational-use disclaimer (public)
/onboarding           Exam, date, schedule, retention (first sign-in)
── authenticated shell (sidebar on desktop, drawer on mobile) ──
/dashboard            Overview cards, today's plan, charts
/analyze              Analyze a Question
/questions            My Question Bank (filters + full-text search)
/questions/[id]       Question + tabbed explanation
/questions/[id]/practice   Re-attempt with hidden answer
/flashcards           Decks, search, create/edit, export
/flashcards/review    FSRS review session
/calendar             Due today / overdue / upcoming / completed
/cases                Clinical Cases (Phase 2 placeholder)
/notebook             My Medical Notebook
/analytics            Performance Analytics
/tutor                AI Tutor (Phase 2 placeholder)
/settings             Profile, exam, schedule, retention, reminders, data export
/api/export/*         Anki TSV + full JSON export
```

## 4.2 Wireframes

**Analyze a Question (desktop)**
```
┌ Sidebar ┐┌──────────────── Question ───────────────┐┌──── Commit to an answer ────┐
│ nav     ││ [Load sample ▾]                          ││ ( ) A …   (•) C …          │
│         ││ Question stem  [ large textarea ]        ││ Confidence [Low|Med|High]   │
│         ││ Answer choices A [____] 🗑  … [+ Add]    ││ Official key [Not provided▾]│
│         ││ Exam [▾]   Subject [Classify auto ▾]     ││ ⚠ identifier warnings       │
│         ││ Source [____]                            ││ [ Analyze Question ]        │
└─────────┘└──────────────────────────────────────────┘└─────────────────────────────┘
```

**Question detail (desktop)**: left column = stem, choices with You / AI / Official markers,
attempt history, practice again, regenerate, official key, review status, report issue.
Right column = tabs: Answer · Clinical Reasoning · Wrong Options · Visual Learning · Exam Strategy ·
Related Cases (Phase 2) · Flashcards · Notes. Mobile order: question, tabs, management card.

**Dashboard**
```
[Analyzed][Practiced][Accuracy][Due today]
[Streak  ][Retention*][Weakest ][Days to exam]      * = estimated badge
┌ Today's plan ┐┌ Question activity (30d) ─────────┐
│ 1 Overdue    ││                                   │
│ 2 Due today  │└───────────────────────────────────┘
│ 3 Weak topic │┌ Accuracy trend ┐┌ Flashcard recall ┐
│ 4 New cards  │└────────────────┘└──────────────────┘
└──────────────┘┌ Subject performance ─────────────────┐
```

**Review**: progress bar → flip card (front / back with explanation and personal note) →
Again / Hard / Good / Easy with the next interval under each button. Keyboard: Space flips, 1–4 rate.

## 4.3 Focus mode

"Focus mode" in the sidebar hides navigation and the footer; an "Exit focus mode" pill stays
in the corner. The setting persists per browser.
