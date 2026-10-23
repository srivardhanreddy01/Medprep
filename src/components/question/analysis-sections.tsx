import { AlertTriangle, BadgeCheck, BookOpen, Bot, CircleHelp, Lightbulb, Scale, ShieldQuestion, Target, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoredAnalysis } from "@/lib/ai/schemas";
import { QUESTION_TASK_LABELS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

type Options = { label: string; text: string }[];

const FLAG_LABELS: Record<string, string> = {
  ambiguous_stem: "Ambiguous stem",
  multiple_plausible_answers: "More than one plausible answer",
  possibly_outdated: "Possibly outdated",
  insufficient_information: "Insufficient information",
  possible_answer_key_error: "Possible answer-key error",
  region_dependent_practice: "Practice differs by region",
  other: "Note",
};

export function AnswerStatusBanner({ a, official }: { a: StoredAnalysis; official: string | null }) {
  if (a.answer_status === "official_key_agrees")
    return (
      <Alert variant="success">
        <BadgeCheck />
        <p>
          <strong>Matches the official answer ({official}).</strong> The AI reasoned independently and reached the same option.
        </p>
      </Alert>
    );
  if (a.answer_status === "official_key_disagrees")
    return (
      <Alert variant="warning">
        <AlertTriangle />
        <p>
          <strong>The AI&apos;s answer ({a.answer.option}) differs from the official answer ({official}).</strong> Treat the official key as the
          reference for grading and read both lines of reasoning carefully. One of them may rest on an outdated guideline or an ambiguity.
        </p>
      </Alert>
    );
  return (
    <Alert variant="ai">
      <Bot />
      <p>
        <strong>AI-inferred answer, not officially verified.</strong> No answer key was provided. Add the official answer if you have it.
      </p>
    </Alert>
  );
}

export function UncertaintyFlags({ a }: { a: StoredAnalysis }) {
  if (!a.uncertainty_flags.length) return null;
  return (
    <Alert variant="warning">
      <ShieldQuestion />
      <div>
        <p className="font-medium">Uncertainty flags</p>
        <ul className="mt-1 space-y-1">
          {a.uncertainty_flags.map((f, i) => (
            <li key={i}>
              <strong>{FLAG_LABELS[f.kind] ?? f.kind}:</strong> {f.detail}
            </li>
          ))}
        </ul>
      </div>
    </Alert>
  );
}

export function AnswerTab({ a, options, official }: { a: StoredAnalysis; options: Options; official: string | null }) {
  const text = options.find((o) => o.label === a.answer.option)?.text;
  const conf = { low: "destructive", moderate: "warning", high: "success" } as const;
  return (
    <div className="space-y-4">
      {a.generated_by.fixture && (
        <Alert variant="warning">
          <AlertTriangle />
          <p>This explanation came from the test fixture provider, not a live AI model.</p>
        </Alert>
      )}
      <AnswerStatusBanner a={a} official={official} />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{QUESTION_TASK_LABELS[a.question_task]}</Badge>
            <Badge variant={conf[a.answer.confidence]}>Confidence: {a.answer.confidence}</Badge>
            <Badge variant="outline">{a.subtopic}</Badge>
          </div>
          <CardTitle className="pt-2 text-lg">
            {a.answer.option}. {text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed">
          <Section icon={Target} title="Concept being tested">{a.answer.concept_tested}</Section>
          <Section icon={BookOpen} title="Justification">{a.answer.justification}</Section>
          <Section icon={Scale} title="Why this beats the alternatives">{a.answer.why_best}</Section>
          <p className="text-xs text-muted-foreground">Why this confidence: {a.answer.confidence_rationale}</p>
        </CardContent>
      </Card>
      <UncertaintyFlags a={a} />
      {a.official_answer_comment && (
        <Card>
          <CardHeader>
            <CardTitle>On the official answer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{a.official_answer_comment}</CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>High-yield takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {a.high_yield_takeaways.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Evidence and references</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {a.guideline_dependence.depends_on_guidelines && (
            <p>
              <strong className="text-foreground">Guideline-dependent:</strong> {a.guideline_dependence.note}
            </p>
          )}
          {a.references.length ? (
            <ul className="list-disc pl-5">
              {a.references.map((r) => (
                <li key={r.source_id}>{r.title}</li>
              ))}
            </ul>
          ) : (
            <p>
              No curated reference was retrieved for this explanation. MedPrep never shows AI-invented citations; verify key facts in a current
              textbook or guideline.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof Target; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 flex items-center gap-2 font-medium">
        <Icon className="size-4 text-primary" aria-hidden /> {title}
      </h4>
      <p className="text-foreground/90">{children}</p>
    </div>
  );
}

export function ReasoningTab({ a }: { a: StoredAnalysis }) {
  const weight = { decisive: "success", supporting: "accent", distractor: "secondary" } as const;
  return (
    <div className="space-y-6">
      <ol className="relative space-y-4 border-l-2 border-primary/30 pl-6">
        {a.clinical_reasoning.map((s) => (
          <li key={s.step} className="relative">
            <span className="absolute -left-[35px] grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {s.step}
            </span>
            <h4 className="font-medium">{s.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{s.content}</p>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>Key clues</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y text-sm">
            {a.key_clues.map((c, i) => (
              <li key={i} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-3">
                <Badge variant={weight[c.weight]} className="w-fit capitalize">
                  {c.weight}
                </Badge>
                <div>
                  <p className="font-medium">{c.clue}</p>
                  <p className="text-muted-foreground">{c.significance}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-semibold">Differential</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {a.differential_diagnosis.map((d, i) => (
            <Card key={i} className={cn(d.verdict === "best" && "border-success/50")}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{d.candidate}</CardTitle>
                  <Badge variant={d.verdict === "best" ? "success" : d.verdict === "plausible" ? "warning" : "secondary"}>{d.verdict}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-success">For: </span>
                  {d.supporting}
                </p>
                <p>
                  <span className="font-medium text-destructive">Against: </span>
                  {d.against}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OptionsTab({ a, options, selected }: { a: StoredAnalysis; options: Options; selected: string | null }) {
  const text = (l: string) => options.find((o) => o.label === l)?.text ?? "";
  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Comparison of answer options</caption>
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2">Option</th>
              <th scope="col" className="px-3 py-2">In this question</th>
              <th scope="col" className="px-3 py-2">Would be correct when</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {a.option_explanations.map((e) => (
              <tr key={e.label} className={cn(e.is_correct && "bg-success-soft/60")}>
                <th scope="row" className="px-3 py-2 align-top font-semibold">
                  {e.label}
                  <span className="block font-normal text-muted-foreground">{text(e.label)}</span>
                </th>
                <td className="px-3 py-2 align-top">{e.is_correct ? <strong>Correct. </strong> : null}{e.distinguishing_clue}</td>
                <td className="px-3 py-2 align-top">{e.when_correct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3">
        {a.option_explanations.map((e) => (
          <details key={e.label} open={!e.is_correct && e.label === selected} className={cn("group rounded-lg border bg-card", e.is_correct && "border-success/50")}>
            <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
              {e.is_correct ? <BadgeCheck className="size-5 text-success" aria-label="Correct" /> : <XCircle className="size-5 text-destructive" aria-label="Incorrect" />}
              <span className="flex-1 font-medium">
                {e.label}. {text(e.label)}
              </span>
              {e.label === selected && <Badge variant="accent">Your answer</Badge>}
              <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
            </summary>
            <dl className="grid gap-3 border-t p-4 text-sm sm:grid-cols-2">
              <Item term="What it means">{e.meaning}</Item>
              <Item term="Why it seems plausible">{e.why_plausible}</Item>
              <Item term={e.is_correct ? "Why it is correct here" : "Why it is wrong here"}>{e.why_wrong_here}</Item>
              <Item term="When it would be correct">{e.when_correct}</Item>
              <Item term="Distinguishing clue">{e.distinguishing_clue}</Item>
              <Item term="Exam tip">
                <span className="flex gap-1.5">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  {e.exam_tip}
                </span>
              </Item>
            </dl>
          </details>
        ))}
      </div>
    </div>
  );
}

function Item({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{term}</dt>
      <dd className="mt-0.5 leading-relaxed">{children}</dd>
    </div>
  );
}

const VISUAL_LABELS: Record<string, string> = {
  anatomy: "Anatomical diagram",
  pathophysiology_flowchart: "Pathophysiology flowchart",
  mechanism: "Mechanism illustration",
  diagnostic_algorithm: "Diagnostic algorithm",
  histology: "Histology",
  ecg: "ECG explanation",
  lab_pattern: "Laboratory pattern",
  imaging: "Imaging example",
  comparison_chart: "Comparison chart",
  treatment_tree: "Treatment decision tree",
};

export function VisualTab({ a }: { a: StoredAnalysis }) {
  return (
    <div className="space-y-4">
      <Alert variant="info">
        <CircleHelp />
        <p>
          These are suggested visuals for this concept. Rendered diagrams and verified image examples arrive in Phase 2. Any AI illustration will be
          labeled as an illustration and never presented as a real patient image.
        </p>
      </Alert>
      {a.visual_suggestions.length === 0 && <p className="text-sm text-muted-foreground">No visuals suggested for this question.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {a.visual_suggestions.map((v, i) => (
          <Card key={i}>
            <CardHeader>
              <Badge variant="outline" className="w-fit">{VISUAL_LABELS[v.kind] ?? v.kind}</Badge>
              <CardTitle className="pt-1">{v.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{v.description}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function StrategyTab({ a }: { a: StoredAnalysis }) {
  const s = a.exam_strategy;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>How to think on exam day</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <Item term="Pattern recognition">{s.pattern_recognition}</Item>
          <Item term="Decoding the stem">{s.stem_decoding}</Item>
          <Item term="Elimination sequence">
            <ol className="list-decimal space-y-1 pl-5">
              {s.elimination_sequence.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
          </Item>
          <Item term="Time management">{s.time_management}</Item>
        </CardContent>
      </Card>
      {a.exam_traps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common traps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {a.exam_traps.map((t, i) => (
                <li key={i}>
                  <p className="font-medium">{t.trap}</p>
                  <p className="text-muted-foreground">{t.how_to_avoid}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      {a.mnemonics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mnemonics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {a.mnemonics.map((m, i) => (
              <div key={i} className="rounded-md bg-muted/60 p-3">
                <p className="font-semibold">{m.mnemonic}</p>
                <p>{m.expansion}</p>
                <p className="mt-1 text-xs text-muted-foreground">Memory aid, not a diagnostic rule. {m.caveat}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
