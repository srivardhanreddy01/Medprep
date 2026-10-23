"use client";
import { AlertTriangle, FlaskConical, Loader2, Plus, ShieldAlert, Trash2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitQuestion, type SubmitState } from "@/app/(app)/analyze/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { IDENTIFIER_LABELS, screenForIdentifiers } from "@/lib/questions/identifiers";
import { parseQuestionText } from "@/lib/questions/parse";
import { OPTION_LABELS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { SampleQuestion } from "@/samples/questions";

interface Option {
  label: string;
  text: string;
}

const relabel = (opts: Option[]) => opts.map((o, i) => ({ ...o, label: OPTION_LABELS[i] }));

function PendingOverlay() {
  const { pending } = useFormStatus();
  return pending ? <PendingSteps /> : null;
}

function PendingSteps() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 12000);
    return () => clearInterval(t);
  }, []);
  const steps = ["Saving your question and answer", "Reasoning through the vignette", "Explaining every option", "Writing flashcards"];
  return (
    <div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-sm" aria-live="polite">
      {steps.map((s, i) => (
        <div key={s} className={cn("flex items-center gap-2", i > step && "text-muted-foreground")}>
          {i < step ? <span className="size-4 text-success">✓</span> : i === step ? <Loader2 className="size-4 animate-spin" /> : <span className="size-4" />}
          {s}
        </div>
      ))}
      <p className="pt-1 text-xs text-muted-foreground">Detailed analysis can take a minute or two.</p>
    </div>
  );
}

function AnalyzeButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={disabled || pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
      {pending ? "Analyzing…" : "Analyze Question"}
    </Button>
  );
}

export function AnalyzerForm({
  exams,
  topics,
  defaultExam,
  samples,
}: {
  exams: { id: string; name: string }[];
  topics: { id: number; name: string }[];
  defaultExam: string;
  samples: SampleQuestion[];
}) {
  const [state, action] = useActionState<SubmitState, FormData>(submitQuestion, undefined);
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState<Option[]>(relabel([{ label: "", text: "" }, { label: "", text: "" }, { label: "", text: "" }, { label: "", text: "" }, { label: "", text: "" }]));
  const [exam, setExam] = useState(defaultExam);
  const [topic, setTopic] = useState("auto");
  const [official, setOfficial] = useState("");
  const [selected, setSelected] = useState("");
  const [confidence, setConfidence] = useState("");
  const [force, setForce] = useState(false);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const formRef = useRef<HTMLFormElement>(null);

  const filled = options.filter((o) => o.text.trim());
  const findings = useMemo(() => screenForIdentifiers(`${stem}\n${options.map((o) => o.text).join("\n")}`), [stem, options]);
  const blocking = findings.filter((f) => f.severity === "block");
  const warnings = findings.filter((f) => f.severity === "warn");

  // Auto-split when a whole question (stem + options) is pasted into the stem box.
  const splitFrom = (text: string) => {
    const p = parseQuestionText(text);
    if (p.options.length >= 2) {
      setStem(p.stem);
      setOptions(p.options);
      if (p.answerHint) setOfficial(p.answerHint);
      setSelected("");
      return true;
    }
    return false;
  };

  const loadSample = (id: string) => {
    const s = samples.find((x) => x.id === id);
    if (!s) return;
    setStem(s.stem);
    setOptions(s.options);
    setExam(s.exam);
    setTopic("auto");
    setOfficial("");
    setSelected("");
    setConfidence("");
    startedAt.current = Date.now();
  };

  // Once the student commits, the time-on-question is captured.
  const [timeSpent, setTimeSpent] = useState(0);
  const choose = (label: string) => {
    setSelected(label);
    setTimeSpent(Math.round((Date.now() - startedAt.current) / 1000));
  };

  return (
    <form ref={formRef} action={action} className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <input type="hidden" name="options" value={JSON.stringify(filled.map((o, i) => ({ label: OPTION_LABELS[i], text: o.text })))} />
      <input type="hidden" name="force" value={force ? "1" : "0"} />
      <input type="hidden" name="time_spent_seconds" value={timeSpent || ""} />

      {/* Left: question input */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Question</CardTitle>
              <CardDescription>Paste the full question here; answer choices are split out automatically.</CardDescription>
            </div>
            <Select aria-label="Load a sample question" className="w-44 shrink-0" value="" onChange={(e) => loadSample(e.target.value)}>
              <option value="">Load sample…</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="stem">Question stem</Label>
              <Textarea
                id="stem"
                name="stem"
                rows={12}
                value={stem}
                onChange={(e) => setStem(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!stem.trim() && splitFrom(text)) e.preventDefault();
                }}
                placeholder="A 58-year-old woman comes to the clinic because of…"
                maxLength={12000}
                required
                className="font-[450]"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button type="button" className="underline" onClick={() => splitFrom(stem) || undefined}>
                  Split answer choices out of the stem
                </button>
                <span>{stem.length.toLocaleString()} / 12,000</span>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Answer choices</legend>
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold">{OPTION_LABELS[i]}</span>
                  <Input
                    aria-label={`Choice ${OPTION_LABELS[i]}`}
                    value={o.text}
                    maxLength={1000}
                    onChange={(e) => setOptions(relabel(options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x))))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove choice ${OPTION_LABELS[i]}`}
                    disabled={options.length <= 2}
                    onClick={() => setOptions(relabel(options.filter((_, j) => j !== i)))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {options.length < 10 && (
                <Button variant="outline" size="sm" onClick={() => setOptions(relabel([...options, { label: "", text: "" }]))}>
                  <Plus /> Add choice
                </Button>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="exam_profile_id">Exam</Label>
                <Select id="exam_profile_id" name="exam_profile_id" value={exam} onChange={(e) => setExam(e.target.value)}>
                  {exams.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topic_id">Subject</Label>
                <Select id="topic_id" name="topic_id" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  <option value="auto">Classify automatically</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source_note">Source (optional)</Label>
              <Input id="source_note" name="source_note" maxLength={500} placeholder="e.g. Self-written, lecture quiz week 4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right: independent attempt + submit */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Commit to an answer first</CardTitle>
            <CardDescription>Optional, but answering before you see the explanation is what makes the learning stick.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div role="radiogroup" aria-label="Your answer" className="space-y-1.5">
              {filled.length === 0 && <p className="text-sm text-muted-foreground">Add answer choices to select one.</p>}
              {filled.map((o, i) => {
                const label = OPTION_LABELS[i];
                return (
                  <label
                    key={label}
                    className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                  >
                    <input
                      type="radio"
                      name="selected_label"
                      value={label}
                      checked={selected === label}
                      onChange={() => choose(label)}
                      className="mt-0.5 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="font-semibold">{label}.</span> {o.text}
                    </span>
                  </label>
                );
              })}
              {selected && (
                <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setSelected("")}>
                  Clear my answer
                </button>
              )}
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">How confident are you?</legend>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((c) => (
                  <label key={c} className="flex cursor-pointer items-center justify-center rounded-md border py-1.5 text-sm capitalize has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                    <input type="radio" name="confidence" value={c} checked={confidence === c} onChange={() => setConfidence(c)} className="sr-only" />
                    {c}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="official_answer">Official answer key (optional)</Label>
              <Select id="official_answer" name="official_answer" value={official} onChange={(e) => setOfficial(e.target.value)}>
                <option value="">Not provided</option>
                {filled.map((_, i) => (
                  <option key={OPTION_LABELS[i]} value={OPTION_LABELS[i]}>
                    {OPTION_LABELS[i]}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                Without a key, the AI&apos;s answer is shown as AI-inferred and unverified. The AI reasons independently either way.
              </p>
            </div>
          </CardContent>
        </Card>

        {blocking.length > 0 && (
          <Alert variant="destructive">
            <ShieldAlert />
            <div>
              <p className="font-medium">Remove patient identifiers</p>
              <ul className="mt-1 list-disc pl-4">
                {blocking.map((f, i) => (
                  <li key={i}>
                    {IDENTIFIER_LABELS[f.kind]}: <code>{f.match}</code>
                  </li>
                ))}
              </ul>
            </div>
          </Alert>
        )}
        {warnings.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle />
            <div className="space-y-2">
              <p>
                Possible identifier: {warnings.map((f) => `${IDENTIFIER_LABELS[f.kind]} (“${f.match}”)`).join(", ")}.
              </p>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="confirm_identifiers" className="accent-[var(--primary)]" />
                This is fictional or de-identified.
              </label>
            </div>
          </Alert>
        )}

        {state?.error && (
          <Alert variant={state.similar ? "warning" : "destructive"}>
            <AlertTriangle />
            <div className="space-y-2">
              <p>{state.error}</p>
              {state.blocked && (
                <ul className="list-disc pl-4">
                  {state.blocked.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {state.duplicateId && (
                <Link className="underline" href={`/questions/${state.duplicateId}`}>
                  Open the saved question
                </Link>
              )}
              {state.similar && (
                <>
                  <ul className="space-y-1">
                    {state.similar.map((s) => (
                      <li key={s.id}>
                        <Link className="underline" href={`/questions/${s.id}`}>
                          {s.stem.slice(0, 110)}…
                        </Link>{" "}
                        <span className="text-xs text-muted-foreground">({Math.round(s.similarity * 100)}% similar)</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForce(true);
                      setTimeout(() => formRef.current?.requestSubmit(), 0);
                    }}
                  >
                    It&apos;s different, analyze anyway
                  </Button>
                </>
              )}
            </div>
          </Alert>
        )}

        <PendingOverlay />
        <AnalyzeButton disabled={blocking.length > 0 || filled.length < 2 || stem.trim().length < 20} />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          For education only. Only paste questions you have the right to use; your library is private.
        </p>
      </div>
    </form>
  );
}
