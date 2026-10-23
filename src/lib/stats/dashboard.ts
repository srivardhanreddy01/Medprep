import "server-only";
import { computeStreak, daysBetween } from "@/lib/plan/study-plan";
import { retrievability, type ScheduleRow } from "@/lib/srs/fsrs";
import type { ServerSupabase } from "@/lib/supabase/server";

export interface DailyPoint {
  day: string;
  analyzed: number;
  attempts: number;
  correct: number;
  graded: number;
  reviews: number;
  recalled: number;
}

function localDate(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Start of "today" in the user's time zone, as a UTC instant. */
function startOfLocalDay(now: Date, tz: string) {
  const today = localDate(now, tz);
  const guess = new Date(`${today}T00:00:00Z`);
  const offsetMin = (Date.parse(new Date(guess).toLocaleString("en-US", { timeZone: tz })) - Date.parse(guess.toLocaleString("en-US", { timeZone: "UTC" }))) / 60000;
  return new Date(guess.getTime() - offsetMin * 60000);
}

/**
 * Everything the dashboard and analytics pages show, computed from saved rows under RLS.
 * "measured" values are counts of the student's own activity; "estimated" values come from FSRS.
 */
export async function getDashboardData(supabase: ServerSupabase, userId: string, days = 30) {
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("timezone, exam_date, target_exam_id, exam_profiles(name)").eq("id", userId).single(),
    supabase.from("study_preferences").select("*").eq("user_id", userId).single(),
  ]);
  const tz = profile?.timezone ?? "UTC";
  const now = new Date();
  const today = localDate(now, tz);
  const dayStart = startOfLocalDay(now, tz);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();

  const [analyzed, practiced, graded, correct, daily, topics, activity, schedules, reviews, newCards] = await Promise.all([
    supabase.from("ai_analyses").select("id", { count: "exact", head: true }).eq("version", 1),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).not("selected_label", "is", null),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).not("is_correct", "is", null),
    supabase.from("question_attempts").select("id", { count: "exact", head: true }).eq("is_correct", true),
    supabase.rpc("daily_activity", { p_days: days, p_tz: tz }),
    supabase.rpc("topic_performance"),
    supabase.rpc("activity_days", { p_tz: tz }),
    supabase
      .from("review_schedules")
      .select("due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review, flashcards!inner(suspended, topic_id)")
      .eq("flashcards.suspended", false)
      .limit(10000),
    supabase.from("flashcard_reviews").select("rating, reviewed_at").gte("reviewed_at", since).limit(20000),
    supabase.from("review_schedules").select("flashcard_id, flashcards!inner(suspended)", { count: "exact", head: true }).eq("state", 0).eq("flashcards.suspended", false),
  ]);

  const retention = Number(prefs?.desired_retention ?? 0.9);
  let overdue = 0;
  let dueToday = 0;
  const rs: number[] = [];
  const forecast = new Map<string, number>();
  for (const s of schedules.data ?? []) {
    const due = new Date(s.due);
    if (s.state !== 0) {
      if (due < dayStart) overdue++;
      else if (due < dayEnd) dueToday++;
      const r = retrievability(s as ScheduleRow, now, retention);
      if (r !== null) rs.push(r);
      if (due >= dayStart) {
        const k = localDate(due, tz);
        forecast.set(k, (forecast.get(k) ?? 0) + 1);
      }
    }
  }

  const reviewsByDay = new Map<string, { n: number; recalled: number }>();
  let reviewedToday = 0;
  for (const r of reviews.data ?? []) {
    const k = localDate(new Date(r.reviewed_at), tz);
    const v = reviewsByDay.get(k) ?? { n: 0, recalled: 0 };
    v.n++;
    if (r.rating > 1) v.recalled++;
    reviewsByDay.set(k, v);
    if (k === today) reviewedToday++;
  }

  const dailyPoints: DailyPoint[] = (daily.data ?? []).map((d) => ({
    day: d.day,
    analyzed: d.analyzed,
    attempts: d.attempts,
    correct: d.correct,
    graded: d.graded,
    reviews: d.reviews,
    recalled: reviewsByDay.get(d.day)?.recalled ?? 0,
  }));

  const topicRows = (topics.data ?? []).map((t) => ({
    topicId: t.topic_id,
    name: t.topic_name,
    attempts: t.attempts,
    correct: t.correct,
    accuracy: t.accuracy === null ? null : Number(t.accuracy),
    questions: t.questions,
  }));
  // Weak subjects need enough graded attempts to mean anything.
  const weakTopics = topicRows
    .filter((t) => t.attempts >= 2 && t.accuracy !== null && t.accuracy < 70)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));

  const examDate = profile?.exam_date ?? null;
  const totalReviews = [...reviewsByDay.values()].reduce((s, v) => s + v.n, 0);
  const totalRecalled = [...reviewsByDay.values()].reduce((s, v) => s + v.recalled, 0);

  return {
    tz,
    today,
    examName: profile?.exam_profiles?.name ?? null,
    examDate,
    daysUntilExam: examDate ? daysBetween(today, examDate) : null,
    prefs: prefs!,
    measured: {
      questionsAnalyzed: analyzed.count ?? 0,
      questionsPracticed: practiced.count ?? 0,
      gradedAttempts: graded.count ?? 0,
      accuracy: graded.count ? (100 * (correct.count ?? 0)) / graded.count : null,
      dueToday,
      overdue,
      newCards: newCards.count ?? 0,
      reviewedToday,
      streak: computeStreak((activity.data ?? []).map((d) => d.day), today),
      recallRate30d: totalReviews ? (100 * totalRecalled) / totalReviews : null,
      reviews30d: totalReviews,
    },
    estimated: {
      retention: rs.length ? (100 * rs.reduce((a, b) => a + b, 0)) / rs.length : null,
      cardsEstimated: rs.length,
    },
    daily: dailyPoints,
    topics: topicRows,
    weakTopics,
    activityDays: (activity.data ?? []).map((d) => d.day),
    forecast: [...forecast.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(0, 30),
    isStudyDay: (prefs?.study_days ?? []).includes(new Date(`${today}T12:00:00Z`).getUTCDay()),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
