import { ArrowRight, BookOpen, HeartHandshake, BarChart3, BrainCircuit, CalendarClock, Flame, Layers, ListChecks, ScanSearch, Target, TrendingDown } from "lucide-react";
import Link from "next/link";
import { AccuracyTrendChart, QuestionActivityChart, RecallRateChart, SubjectAccuracyChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildStudyPlan } from "@/lib/plan/study-plan";
import { getDashboardData } from "@/lib/stats/dashboard";
import { requireUser } from "@/lib/supabase/server";
import { cn, pct } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  kind = "measured",
  href,
}: {
  icon: typeof Target;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  kind?: "measured" | "estimated";
  href?: string;
}) {
  const body = (
    <Card className={cn("h-full p-4", href && "transition-colors hover:bg-muted/40")}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Icon className="size-4 text-primary" aria-hidden /> {label}
        </span>
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide", kind === "estimated" ? "bg-ai-soft text-ai" : "bg-muted")}>{kind}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const d = await getDashboardData(supabase, user.id, 30);
  const m = d.measured;

  const plan = buildStudyPlan({
    dailyMinutes: d.prefs.daily_minutes,
    overdueReviews: m.overdue,
    dueTodayReviews: m.dueToday,
    newCardsAvailable: m.newCards,
    maxNewCards: d.prefs.max_new_cards_per_day,
    weakTopics: d.weakTopics.map((t) => ({ topicId: t.topicId, name: t.name, accuracy: t.accuracy ?? 0, missedQuestions: Math.min(t.questions, t.attempts - t.correct) })),
    daysUntilExam: d.daysUntilExam,
    isStudyDay: d.isStudyDay,
  });
  const weakest = d.weakTopics.slice(0, 3);
  const isEmpty = m.questionsAnalyzed === 0;

  return (
    <>
      <PageHeader
        title="Today"
        description={d.examName ? `Preparing for ${d.examName}` : undefined}
        actions={
          <Link href="/analyze" className={buttonVariants()}>
            <ScanSearch /> Analyze a question
          </Link>
        }
      />

      <section aria-label="Study areas" className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Learn & Practice", detail: "Analyze and practice questions", href: "/analyze", icon: BookOpen },
          { title: "Review & Recall", detail: "Review scheduled flashcards", href: "/flashcards/review", icon: Layers },
          { title: "Exams & Progress", detail: "Track performance and exam readiness", href: "/analytics", icon: BarChart3 },
          { title: "Mentor & Well-being", detail: "Study support and healthy habits", href: "/mentor", icon: HeartHandshake },
        ].map((area) => (
          <Link key={area.href} href={area.href} className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40">
            <area.icon className="mb-2 size-5 text-primary" aria-hidden />
            <h2 className="font-semibold">{area.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{area.detail}</p>
          </Link>
        ))}
      </section>

      {isEmpty && (
        <Card className="mb-6 border-primary/40 bg-primary-soft/40">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center">
            <BrainCircuit className="size-8 text-primary" aria-hidden />
            <div className="flex-1">
              <p className="font-medium">Start with one question</p>
              <p className="text-sm text-muted-foreground">
                Paste a question (or load a sample), commit to an answer, and MedPrep will build the explanation, flashcards, and your first reviews.
              </p>
            </div>
            <Link href="/analyze" className={buttonVariants()}>
              Analyze your first question <ArrowRight />
            </Link>
          </CardContent>
        </Card>
      )}

      <section aria-label="Overview" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={ScanSearch} label="Questions analyzed" value={m.questionsAnalyzed} href="/questions" />
        <Stat icon={ListChecks} label="Questions practiced" value={m.questionsPracticed} hint="Answers you committed to" />
        <Stat icon={Target} label="Accuracy" value={pct(m.accuracy)} hint={`${m.gradedAttempts} graded attempts`} />
        <Stat
          icon={Layers}
          label="Flashcards due today"
          value={m.dueToday + m.overdue}
          hint={m.overdue ? `${m.overdue} overdue · ${m.reviewedToday} done today` : `${m.reviewedToday} done today`}
          href="/flashcards/review"
        />
        <Stat icon={Flame} label="Study streak" value={`${m.streak} day${m.streak === 1 ? "" : "s"}`} />
        <Stat
          icon={BrainCircuit}
          label="Knowledge retention"
          kind="estimated"
          value={pct(d.estimated.retention)}
          hint={d.estimated.cardsEstimated ? `FSRS recall probability across ${d.estimated.cardsEstimated} cards` : "Review cards to estimate"}
        />
        <Stat
          icon={TrendingDown}
          label="Weakest subjects"
          value={<span className="text-base">{weakest.length ? weakest.map((w) => w.name).join(", ") : "—"}</span>}
          hint={weakest.length ? "Lowest measured accuracy (2+ attempts)" : "Needs more graded attempts"}
        />
        <Stat
          icon={CalendarClock}
          label="Days until exam"
          value={d.daysUntilExam === null ? "—" : Math.max(0, d.daysUntilExam)}
          hint={d.examDate ? new Date(`${d.examDate}T12:00:00Z`).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" }) : <Link href="/settings" className="underline">Set your exam date</Link>}
        />
      </section>
      <p className="mt-2 text-xs text-muted-foreground">
        Measured values are counts of your saved activity. Estimates come from the FSRS memory model. Neither predicts an exam score.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 lg:row-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s study plan</CardTitle>
            <CardDescription>
              {plan.totalMinutes} of {plan.budget} minutes planned{!d.isStudyDay && " · rest day"}. Times are estimates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {plan.tasks.map((t, i) => (
                <li key={t.kind + i}>
                  <Link href={t.href} className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium">
                        {t.title}
                        {t.count > 0 && <span className="text-muted-foreground"> · {t.count}</span>}
                      </span>
                      <span className="block text-xs text-muted-foreground">{t.detail}</span>
                    </span>
                    <Badge variant="secondary">~{t.minutes} min</Badge>
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Question activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionActivityChart data={d.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accuracy trend</CardTitle>
            <CardDescription>7-day rolling, graded attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <AccuracyTrendChart data={d.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Flashcard recall</CardTitle>
            <CardDescription>Share of reviews not rated Again (measured)</CardDescription>
          </CardHeader>
          <CardContent>
            <RecallRateChart data={d.daily} target={Number(d.prefs.desired_retention)} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-end justify-between">
            <div>
              <CardTitle>Subject performance</CardTitle>
              <CardDescription>Accuracy by subject, weakest first</CardDescription>
            </div>
            <Link href="/analytics" className="text-sm text-primary underline">All analytics</Link>
          </CardHeader>
          <CardContent>
            <SubjectAccuracyChart data={d.topics} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
