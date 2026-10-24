import { AlertTriangle, ArrowLeft, Bot, Repeat, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteQuestion, setOfficialAnswer, setReviewStatus } from "@/app/(app)/questions/actions";
import { CardItem, type CardRow } from "@/components/flashcards/card-item";
import { NoteCard } from "@/components/notes/note-card";
import { NoteForm } from "@/components/notes/note-form";
import { AnswerTab, OptionsTab, ReasoningTab, StrategyTab, VisualTab } from "@/components/question/analysis-sections";
import { RegenerateButton } from "@/components/question/regenerate-button";
import { ReportIssue } from "@/components/question/report-issue";
import { LongVideosTab, ReelTab } from "@/components/question/video-tabs";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import type { StoredAnalysis } from "@/lib/ai/schemas";
import { getTopics } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { cn, formatDate } from "@/lib/utils";

export const maxDuration = 300;

export async function generateMetadata() {
  return { title: "Question" };
}

export default async function QuestionPage({ params, searchParams }: PageProps<"/questions/[id]">) {
  const { id } = await params;
  const { tab, practiced } = await searchParams;
  const { supabase } = await requireUser();

  const { data: q } = await supabase
    .from("questions")
    .select("*, answer_choices(label, text, position), exam_profiles(name), medical_topics(name)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const [{ data: analysisRow }, { data: attempts }, { data: cards }, { data: notes }, { data: jobs }, { data: decks }, topics] = await Promise.all([
    supabase.from("ai_analyses").select("id, version, result, created_at").eq("question_id", id).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("question_attempts").select("*").eq("question_id", id).order("created_at", { ascending: false }),
    supabase
      .from("flashcards")
      .select("*, review_schedules(due, state, reps, lapses)")
      .eq("question_id", id)
      .order("created_at"),
    supabase.from("notes").select("*").eq("question_id", id).order("origin").order("created_at", { ascending: false }),
    supabase.from("ai_generation_jobs").select("job_type, status, error, created_at").eq("question_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("flashcard_decks").select("id, name, is_default").order("name"),
    getTopics(supabase),
  ]);

  const options = [...q.answer_choices].sort((a, b) => a.position - b.position);
  const analysis = analysisRow?.result as unknown as StoredAnalysis | undefined;
  const firstAttempt = attempts?.[attempts.length - 1];
  const latestAttempt = attempts?.[0];
  const lastJob = (t: string) => jobs?.find((j) => j.job_type === t);
  const analysisJob = lastJob("analysis");
  const flashJob = lastJob("flashcards");
  const cardRows: CardRow[] = (cards ?? []).map((c) => ({ ...c, schedule: c.review_schedules }));

  const marker = (label: string) => {
    const tags: React.ReactNode[] = [];
    if (latestAttempt?.selected_label === label) tags.push(<Badge key="you" variant="accent">You</Badge>);
    if (q.official_answer_label === label) tags.push(<Badge key="off" variant="success">Official</Badge>);
    if (analysis?.answer.option === label) tags.push(<Badge key="ai" variant="ai">AI</Badge>);
    return tags;
  };

  const notAnalyzed = (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertTriangle />
        <div>
          <p className="font-medium">The explanation has not been generated yet.</p>
          {analysisJob?.status === "failed" && <p className="mt-1">{analysisJob.error}</p>}
          <p className="mt-1">Your question and answer are saved. You can retry now.</p>
        </div>
      </Alert>
      <RegenerateButton questionId={id} kind="analysis" label="Generate explanation" />
    </div>
  );

  const flashTab = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {cardRows.length} card{cardRows.length === 1 ? "" : "s"} from this question.{" "}
          <Link href="/flashcards/review" className="text-primary underline">Review due cards</Link>
        </p>
        {analysis && <RegenerateButton questionId={id} kind="flashcards" label={cardRows.length ? "Generate more cards" : "Generate flashcards"} />}
      </div>
      {flashJob?.status === "failed" && (
        <Alert variant="destructive">
          <AlertTriangle />
          <p>Flashcard generation failed: {flashJob.error}</p>
        </Alert>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {cardRows.map((c) => (
          <CardItem key={c.id} card={c} decks={decks ?? []} topics={topics} />
        ))}
      </div>
    </div>
  );

  const notesTab = (
    <div className="space-y-4">
      {(notes ?? []).map((n) => (
        <NoteCard key={n.id} note={n} topics={topics} />
      ))}
      <Card>
        <CardHeader>
          <CardTitle>Add a note</CardTitle>
        </CardHeader>
        <CardContent>
          <NoteForm questionId={id} topics={topics} values={{ topic_id: q.topic_id }} compact />
        </CardContent>
      </Card>
    </div>
  );

  const items = analysis
    ? [
        { id: "answer", label: "Answer", content: <AnswerTab a={analysis} options={options} official={q.official_answer_label} /> },
        { id: "reasoning", label: "Clinical Reasoning", content: <ReasoningTab a={analysis} /> },
        { id: "options", label: "Wrong Options", content: <OptionsTab a={analysis} options={options} selected={latestAttempt?.selected_label ?? null} /> },
        { id: "visual", label: "Visual Learning", content: <VisualTab a={analysis} /> },
        { id: "strategy", label: "Exam Strategy", content: <StrategyTab a={analysis} /> },
        {
          id: "reel",
          label: "Reel",
          content: <ReelTab a={analysis} questionId={id} answerText={options.find((o) => o.label === analysis.answer.option)?.text} />,
        },
        { id: "videos", label: "Long Videos", content: <LongVideosTab a={analysis} questionId={id} /> },
        {
          id: "cases",
          label: "Related Cases",
          disabled: true,
          badge: <span className="rounded bg-muted px-1 text-[10px] uppercase">Soon</span>,
          content: null,
        },
        { id: "flashcards", label: "Flashcards", badge: <Badge variant="secondary">{cardRows.length}</Badge>, content: flashTab },
        { id: "notes", label: "Notes", badge: <Badge variant="secondary">{notes?.length ?? 0}</Badge>, content: notesTab },
      ]
    : [
        { id: "answer", label: "Answer", content: notAnalyzed },
        { id: "notes", label: "Notes", content: notesTab },
      ];

  return (
    <>
      <Link href="/questions" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" data-chrome>
        <ArrowLeft className="size-4" /> Question bank
      </Link>
      {practiced && latestAttempt && (
        <Alert variant={latestAttempt.is_correct ? "success" : "destructive"} className="mb-4">
          <p>
            {latestAttempt.is_correct ? "Correct." : "Not quite."} You chose {latestAttempt.selected_label}.
            {latestAttempt.graded_against === "ai_unverified" && " (Graded against the AI-inferred answer, which is unverified.)"}
          </p>
        </Alert>
      )}
      {/* Desktop: question and management on the left, explanation tabs on the right. Mobile: question, tabs, management. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-rows-[auto_1fr]">
        <div className="space-y-4 xl:col-start-1 xl:row-start-1">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{q.exam_profiles?.name}</Badge>
                {q.medical_topics && (
                  <Badge variant="outline">
                    {q.topic_source === "ai" && <Bot className="size-3" aria-label="Classified by AI" />}
                    {q.medical_topics.name}
                  </Badge>
                )}
                {q.difficulty && <Badge variant="outline">{q.difficulty}</Badge>}
                {q.review_status === "flagged" && <Badge variant="warning">Flagged</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">{q.stem}</p>
              <ul className="space-y-1.5">
                {options.map((o) => (
                  <li
                    key={o.label}
                    className={cn(
                      "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                      analysis && (q.official_answer_label ?? analysis.answer.option) === o.label && "border-success/60 bg-success-soft/50",
                    )}
                  >
                    <span className="font-semibold">{o.label}.</span>
                    <span className="flex-1">{o.text}</span>
                    <span className="flex gap-1">{marker(o.label)}</span>
                  </li>
                ))}
              </ul>
              {q.source_note && <p className="text-xs text-muted-foreground">Source: {q.source_note}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 xl:col-start-2 xl:row-span-2 xl:row-start-1">
          <Tabs items={items} initial={typeof tab === "string" ? tab : undefined} />
        </div>

        <div className="space-y-4 xl:col-start-1 xl:row-start-2">

          <Card>
            <CardHeader>
              <CardTitle>Your attempts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!attempts?.length || !attempts.some((a) => a.selected_label) ? (
                <p className="text-muted-foreground">You did not commit to an answer before the explanation.</p>
              ) : (
                <ul className="space-y-1">
                  {attempts
                    .filter((a) => a.selected_label)
                    .map((a) => (
                      <li key={a.id} className="flex items-center gap-2">
                        <Badge variant={a.is_correct === null ? "secondary" : a.is_correct ? "success" : "destructive"}>
                          {a.is_correct === null ? "Ungraded" : a.is_correct ? "Correct" : "Incorrect"}
                        </Badge>
                        <span>
                          {a.selected_label}
                          {a.confidence && ` · ${a.confidence} confidence`}
                          {a.mode === "practice" && " · practice"}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                      </li>
                    ))}
                </ul>
              )}
              {firstAttempt?.graded_against === "ai_unverified" && (
                <p className="text-xs text-muted-foreground">Graded against the AI-inferred answer because no official key was provided.</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={`/questions/${id}/practice`} className={buttonVariants({ size: "sm" })}>
                  <Repeat /> Practice again
                </Link>
                {analysis && <RegenerateButton questionId={id} kind="analysis" label="Regenerate explanation" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-5 text-sm">
              <form action={setOfficialAnswer} className="flex items-center gap-2">
                <input type="hidden" name="question_id" value={id} />
                <label htmlFor="official" className="shrink-0">Official answer</label>
                <Select id="official" name="official_answer" defaultValue={q.official_answer_label ?? ""}>
                  <option value="">Not provided</option>
                  {options.map((o) => (
                    <option key={o.label} value={o.label}>{o.label}</option>
                  ))}
                </Select>
                <Button type="submit" size="sm" variant="outline">Save</Button>
              </form>
              <form action={setReviewStatus} className="flex items-center gap-2">
                <input type="hidden" name="question_id" value={id} />
                <label htmlFor="rs" className="shrink-0">Review status</label>
                <Select id="rs" name="review_status" defaultValue={q.review_status}>
                  <option value="new">New</option>
                  <option value="learning">Learning</option>
                  <option value="mastered">Mastered</option>
                  <option value="flagged">Flagged</option>
                </Select>
                <Button type="submit" size="sm" variant="outline">Save</Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Changing the official answer affects grading of future attempts. Regenerate the explanation to compare it with the new key.
              </p>
              <ReportIssue questionId={id} analysisId={analysisRow?.id} />
              <form action={deleteQuestion}>
                <input type="hidden" name="question_id" value={id} />
                <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                  <Trash2 /> Delete question
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Added {formatDate(q.created_at)}
                {analysisRow && ` · explanation v${analysisRow.version} from ${formatDate(analysisRow.created_at)}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
