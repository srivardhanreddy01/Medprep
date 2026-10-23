import { Library, Plus, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Input, Select } from "@/components/ui/input";
import { getExamProfiles, getTopics } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "My Question Bank" };

const PAGE = 50;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function QuestionsPage({ searchParams }: PageProps<"/questions">) {
  const sp = await searchParams;
  const f = {
    q: str(sp.q).slice(0, 200),
    topic: str(sp.topic),
    exam: str(sp.exam),
    result: str(sp.result),
    difficulty: str(sp.difficulty),
    status: str(sp.status),
    from: str(sp.from),
    to: str(sp.to),
    page: Math.max(0, Number(str(sp.page)) || 0),
  };
  const { supabase } = await requireUser();
  const [topics, exams] = await Promise.all([getTopics(supabase), getExamProfiles(supabase)]);

  let query = supabase
    .from("questions")
    .select(
      "id, stem, created_at, difficulty, review_status, official_answer_label, topic_id, medical_topics(name), exam_profiles(name), question_attempts(is_correct, created_at), ai_analyses(ai_answer_label, version), flashcards(count)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(f.page * PAGE, f.page * PAGE + PAGE - 1);
  if (f.q) query = query.textSearch("search", f.q, { type: "websearch", config: "english" });
  if (/^\d+$/.test(f.topic)) query = query.eq("topic_id", Number(f.topic));
  if (f.exam) query = query.eq("exam_profile_id", f.exam);
  if (["easy", "medium", "hard"].includes(f.difficulty)) query = query.eq("difficulty", f.difficulty as "easy");
  if (["new", "learning", "mastered", "flagged"].includes(f.status)) query = query.eq("review_status", f.status);
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.from)) query = query.gte("created_at", f.from);
  if (/^\d{4}-\d{2}-\d{2}$/.test(f.to)) query = query.lt("created_at", new Date(Date.parse(f.to) + 86_400_000).toISOString());

  const { data, count, error } = await query;
  const rows = (data ?? [])
    .map((q) => {
      const graded = [...q.question_attempts].filter((a) => a.is_correct !== null).sort((a, b) => b.created_at.localeCompare(a.created_at));
      const last = graded[0];
      const accuracy = graded.length ? Math.round((100 * graded.filter((a) => a.is_correct).length) / graded.length) : null;
      return { ...q, last, accuracy, analyzed: q.ai_analyses.length > 0, cards: q.flashcards[0]?.count ?? 0 };
    })
    .filter((q) => {
      if (f.result === "correct") return q.last?.is_correct === true;
      if (f.result === "incorrect") return q.last?.is_correct === false;
      if (f.result === "unattempted") return !q.last;
      return true;
    });
  const total = count ?? 0;
  const hasFilters = Object.entries(f).some(([k, v]) => k !== "page" && v);

  return (
    <>
      <PageHeader
        title="My Question Bank"
        description={`${total} question${total === 1 ? "" : "s"} in your private library.`}
        actions={
          <Link href="/analyze" className={buttonVariants()}>
            <Plus /> Analyze a question
          </Link>
        }
      />
      <form className="mb-6 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8" role="search">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={f.q} placeholder="Search question text" aria-label="Search questions" className="pl-8" />
        </div>
        <Select name="topic" defaultValue={f.topic} aria-label="Subject">
          <option value="">All subjects</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
        <Select name="exam" defaultValue={f.exam} aria-label="Exam">
          <option value="">All exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </Select>
        <Select name="result" defaultValue={f.result} aria-label="Result">
          <option value="">Any result</option>
          <option value="correct">Last attempt correct</option>
          <option value="incorrect">Last attempt incorrect</option>
          <option value="unattempted">Not attempted</option>
        </Select>
        <Select name="difficulty" defaultValue={f.difficulty} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
        <Select name="status" defaultValue={f.status} aria-label="Review status">
          <option value="">Any status</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="mastered">Mastered</option>
          <option value="flagged">Flagged</option>
        </Select>
        <div className="flex gap-2">
          <Input type="date" name="from" defaultValue={f.from} aria-label="Added from" />
          <Input type="date" name="to" defaultValue={f.to} aria-label="Added to" />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-8">
          <Button type="submit" size="sm">Apply filters</Button>
          {hasFilters && (
            <Link href="/questions" className={buttonVariants({ size: "sm", variant: "ghost" })}>Clear</Link>
          )}
        </div>
      </form>

      {error && <p className="text-sm text-destructive">Search failed: {error.message}</p>}
      {rows.length === 0 ? (
        <EmptyState icon={Library} title={hasFilters ? "No questions match these filters" : "Your question bank is empty"}>
          {hasFilters ? "Try removing a filter." : <>Analyze your first question and it will be saved here with its explanation, flashcards, and notes.</>}
        </EmptyState>
      ) : (
        <Card className="divide-y overflow-hidden">
          {rows.map((q) => (
            <Link key={q.id} href={`/questions/${q.id}`} className="block p-4 transition-colors hover:bg-muted/50">
              <p className="line-clamp-2 text-sm">{q.stem}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <Badge variant="secondary">{q.exam_profiles?.name}</Badge>
                {q.medical_topics && <Badge variant="outline">{q.medical_topics.name}</Badge>}
                {q.difficulty && <Badge variant="outline">{q.difficulty}</Badge>}
                {q.last ? (
                  <Badge variant={q.last.is_correct ? "success" : "destructive"}>{q.last.is_correct ? "Correct" : "Incorrect"}</Badge>
                ) : (
                  <Badge variant="secondary">Not attempted</Badge>
                )}
                {q.accuracy !== null && <span className="text-muted-foreground">{q.accuracy}% across attempts</span>}
                {!q.analyzed && <Badge variant="warning">Needs explanation</Badge>}
                {q.review_status !== "new" && <Badge variant={q.review_status === "flagged" ? "warning" : "accent"}>{q.review_status}</Badge>}
                <span className="text-muted-foreground">{q.cards} cards</span>
                <span className="ml-auto text-muted-foreground">{formatDate(q.created_at)}</span>
              </div>
            </Link>
          ))}
        </Card>
      )}
      {total > PAGE && (
        <nav className="mt-4 flex justify-between text-sm" aria-label="Pagination">
          {f.page > 0 ? (
            <Link className="text-primary underline" href={{ query: { ...sp, page: f.page - 1 } }}>Previous</Link>
          ) : (
            <span />
          )}
          {(f.page + 1) * PAGE < total && (
            <Link className="text-primary underline" href={{ query: { ...sp, page: f.page + 1 } }}>Next</Link>
          )}
        </nav>
      )}
    </>
  );
}
