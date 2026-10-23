import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Study Calendar" };

function localDate(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { month } = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("timezone, exam_date").eq("id", user.id).single();
  const tz = profile?.timezone ?? "UTC";
  const today = localDate(new Date(), tz);
  const ym = typeof month === "string" && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7);
  const first = new Date(`${ym}-01T00:00:00Z`);
  const next = new Date(first);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const prev = new Date(first);
  prev.setUTCMonth(prev.getUTCMonth() - 1);
  // Pad the query a day each side for time-zone shifts.
  const qFrom = new Date(first.getTime() - 86_400_000).toISOString();
  const qTo = new Date(next.getTime() + 86_400_000).toISOString();

  const [{ data: scheduled }, { data: done }, { data: overdueRows }] = await Promise.all([
    supabase.from("review_schedules").select("due, flashcards!inner(suspended)").neq("state", 0).eq("flashcards.suspended", false).gte("due", qFrom).lt("due", qTo).limit(20000),
    supabase.from("flashcard_reviews").select("reviewed_at").gte("reviewed_at", qFrom).lt("reviewed_at", qTo).limit(20000),
    supabase.from("review_schedules").select("due, flashcards!inner(suspended)").neq("state", 0).eq("flashcards.suspended", false).lt("due", new Date().toISOString()).limit(20000),
  ]);

  const dueBy = new Map<string, number>();
  for (const s of scheduled ?? []) {
    const k = localDate(new Date(s.due), tz);
    dueBy.set(k, (dueBy.get(k) ?? 0) + 1);
  }
  const doneBy = new Map<string, number>();
  for (const r of done ?? []) {
    const k = localDate(new Date(r.reviewed_at), tz);
    doneBy.set(k, (doneBy.get(k) ?? 0) + 1);
  }
  const overdue = (overdueRows ?? []).filter((r) => localDate(new Date(r.due), tz) < today).length;
  const dueToday = (overdueRows ?? []).filter((r) => localDate(new Date(r.due), tz) === today).length;

  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (const d = new Date(first); d < next; d.setUTCDate(d.getUTCDate() + 1)) cells.push(d.toISOString().slice(0, 10));
  const upcoming = [...dueBy.entries()].filter(([k]) => k > today).sort().slice(0, 7);
  const label = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHeader
        title="Study Calendar"
        description="Reviews scheduled by FSRS and reviews you completed."
        actions={
          <Link href="/flashcards/review" className={buttonVariants()}>
            <Play /> Review now ({dueToday + overdue})
          </Link>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Due today</p>
          <p className="text-2xl font-semibold tabular-nums">{dueToday}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Overdue</p>
          <p className={cn("text-2xl font-semibold tabular-nums", overdue > 0 && "text-destructive")}>{overdue}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Completed today</p>
          <p className="text-2xl font-semibold tabular-nums">{doneBy.get(today) ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Next 7 days</p>
          <p className="text-2xl font-semibold tabular-nums">{upcoming.reduce((s, [, n]) => s + n, 0)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{label}</CardTitle>
            <div className="flex gap-1">
              <Link aria-label="Previous month" href={`/calendar?month=${prev.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <ChevronLeft />
              </Link>
              <Link aria-label="Next month" href={`/calendar?month=${next.toISOString().slice(0, 7)}`} className={buttonVariants({ variant: "ghost", size: "icon" })}>
                <ChevronRight />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const due = dueBy.get(day) ?? 0;
                const completed = doneBy.get(day) ?? 0;
                const isToday = day === today;
                const past = day < today;
                const isExam = profile?.exam_date === day;
                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-20 rounded-md border p-1.5 text-left text-xs",
                      isToday && "border-primary ring-1 ring-primary",
                      isExam && "bg-accent-soft",
                    )}
                  >
                    <div className="flex justify-between">
                      <span className={cn("font-medium", isToday && "text-primary")}>{Number(day.slice(8))}</span>
                      {isExam && <span className="font-semibold text-accent">Exam</span>}
                    </div>
                    {completed > 0 && <p className="mt-1 text-success">✓ {completed} done</p>}
                    {due > 0 && (
                      <p className={cn("mt-0.5", past ? "text-destructive" : "text-muted-foreground")}>
                        {past ? `${due} overdue` : `${due} due`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled later this month.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {upcoming.map(([day, n]) => (
                  <li key={day} className="flex justify-between">
                    <span>{new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })}</span>
                    <span className="tabular-nums text-muted-foreground">{n} cards</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted-foreground">New cards are introduced on top of these, up to your daily new-card limit.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
