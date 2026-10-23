import { ConsistencyHeatmap, ForecastChart, QuestionActivityChart, ReviewActivityChart, WeakTopicChart, WeeklyImprovementChart } from "@/components/charts/charts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/stats/dashboard";
import { requireUser } from "@/lib/supabase/server";
import { pct } from "@/lib/utils";

export const metadata = { title: "Performance Analytics" };

export default async function AnalyticsPage() {
  const { supabase, user } = await requireUser();
  const d = await getDashboardData(supabase, user.id, 112);
  const m = d.measured;

  // Weekly accuracy (weeks start Sunday).
  const weeks = new Map<string, { correct: number; graded: number }>();
  for (const p of d.daily) {
    const dt = new Date(`${p.day}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - dt.getUTCDay());
    const k = dt.toISOString().slice(0, 10);
    const w = weeks.get(k) ?? { correct: 0, graded: 0 };
    w.correct += p.correct;
    w.graded += p.graded;
    weeks.set(k, w);
  }
  const weekly = [...weeks.entries()].map(([week, w]) => ({ week, graded: w.graded, accuracy: w.graded ? (100 * w.correct) / w.graded : null }));
  const counts = new Map(d.daily.map((p) => [p.day, p.attempts + p.reviews + p.analyzed]));
  const last30 = d.daily.slice(-30);
  const activeDays30 = last30.filter((p) => p.attempts + p.reviews + p.analyzed > 0).length;

  return (
    <>
      <PageHeader title="Performance Analytics" description="Every number here is computed from your saved activity." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Study consistency</CardTitle>
            <CardDescription>
              Active on {activeDays30} of the last 30 days · current streak {m.streak}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsistencyHeatmap days={d.activityDays} counts={counts} today={d.today} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Review completion</CardTitle>
            <CardDescription>Today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const total = m.reviewedToday + m.dueToday + m.overdue;
              const done = total ? (100 * m.reviewedToday) / total : 0;
              return (
                <>
                  <p className="text-3xl font-semibold tabular-nums">
                    {m.reviewedToday} <span className="text-base font-normal text-muted-foreground">of {total} reviewed</span>
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(done)} aria-valuemin={0} aria-valuemax={100} aria-label="Reviews completed today">
                    <div className="h-full rounded-full bg-[var(--chart-1)]" style={{ width: `${done}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {m.overdue} overdue · {m.dueToday} still due today · 30-day recall rate {pct(m.recallRate30d)} over {m.reviews30d} reviews
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Improvement over time</CardTitle>
            <CardDescription>Weekly accuracy on graded attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyImprovementChart data={weekly} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weak-topic distribution</CardTitle>
            <CardDescription>Incorrect attempts by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <WeakTopicChart data={d.topics.map((t) => ({ name: t.name, incorrect: t.attempts - t.correct }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily question activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionActivityChart data={last30} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Flashcard reviews</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewActivityChart data={last30} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming review load</CardTitle>
            <CardDescription>Cards scheduled per day by FSRS</CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastChart data={d.forecast.map(([day, count]) => ({ day, count }))} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Table view of measured performance</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2">Subject</th>
                  <th className="py-2 text-right">Questions</th>
                  <th className="py-2 text-right">Graded attempts</th>
                  <th className="py-2 text-right">Correct</th>
                  <th className="py-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {d.topics.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">No questions yet.</td>
                  </tr>
                )}
                {d.topics.map((t) => (
                  <tr key={t.topicId}>
                    <td className="py-2">{t.name}</td>
                    <td className="py-2 text-right tabular-nums">{t.questions}</td>
                    <td className="py-2 text-right tabular-nums">{t.attempts}</td>
                    <td className="py-2 text-right tabular-nums">{t.correct}</td>
                    <td className="py-2 text-right tabular-nums">{pct(t.accuracy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              Performance on your own and AI-generated questions does not predict licensing exam scores.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
