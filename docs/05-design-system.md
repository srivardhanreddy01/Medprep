# 5. Design System

Tokens live in `src/app/globals.css` as CSS variables, exposed to Tailwind v4 via `@theme inline`.
Components in `src/components/ui/` follow shadcn/ui conventions (`cva` variants + `cn`), and
`components.json` is configured so more shadcn components can be added with the CLI.

## 5.1 Color

| Token | Use |
|---|---|
| `background`, `card`, `muted`, `border`, `input` | Soft neutral surfaces with a slight cool tint |
| `foreground`, `muted-foreground` | Text (AA contrast on all surfaces) |
| `primary` (teal), `accent` (clinical blue) | Actions, active navigation, links |
| `success`, `warning`, `destructive` | Correct / caution / incorrect. Always paired with a word or icon |
| `ai` (violet) | Anything AI-generated: AI notes, AI answer marker, estimated metrics |
| `chart-1…5` | Categorical chart slots in fixed order (validated palette; separate light and dark steps) |

Every token is redefined under `.dark`. The theme is chosen by the user (sidebar toggle) or
follows the OS preference, applied before first paint.

## 5.2 Typography and shape

Geist Sans (UI) and Geist Mono. Page titles 24px semibold; card titles 16px semibold; body 14px
with relaxed line height for vignettes. Radius 12px on cards, 10px on inputs and buttons.

## 5.3 Components

Button (default, secondary, outline, ghost, destructive, link), Card, Input/Textarea/Select/Label,
Badge (default, secondary, outline, success, warning, destructive, accent, ai), Alert (info, warning,
destructive, success, ai), Tabs (WAI-ARIA tabs with arrow-key focus and `?tab=` URL sync),
SubmitButton (pending state), EmptyState, flip card.

## 5.4 Charts

Recharts with thin marks, 4px rounded bar ends, 2px lines, recessive grid, tooltips on every chart,
a legend only when there are two or more series, one y-axis per chart, and empty states that say
what to do. Analytics includes a table view of subject performance.

## 5.5 Accessibility

Visible focus rings, labeled form controls, `aria-current` on navigation, keyboard review shortcuts,
color never the only signal (badges carry words), `prefers-reduced-motion` disables animation,
mobile layouts stack with a drawer navigation.

## 5.6 Content conventions

* "AI-inferred, not officially verified" whenever no answer key exists.
* "Measured" vs "Estimated" badges on dashboard metrics.
* Mnemonics always carry "Memory aid, not a diagnostic rule".
* Any future AI illustration is labeled as an illustration.
