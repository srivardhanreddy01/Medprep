/**
 * Deterministic daily study planner. Builds an ordered task list that fits the student's available
 * minutes, prioritizing (1) overdue reviews, (2) reviews due today, (3) re-practice of missed
 * questions in weak topics, (4) new cards, (5) new question analysis. Time estimates are
 * conservative defaults and are labeled as estimates in the UI.
 */

export const MINUTES = {
  review: 0.3, // ~18 s per card
  newCard: 0.6,
  practiceQuestion: 2.5,
  analyzeQuestion: 8,
};

export interface PlanInput {
  dailyMinutes: number;
  overdueReviews: number;
  dueTodayReviews: number;
  newCardsAvailable: number;
  maxNewCards: number;
  weakTopics: { topicId: number; name: string; accuracy: number; missedQuestions: number }[];
  daysUntilExam: number | null;
  isStudyDay: boolean;
}

export interface PlanTask {
  kind: "overdue_reviews" | "due_reviews" | "practice_weak" | "new_cards" | "analyze_new" | "rest";
  title: string;
  detail: string;
  count: number;
  minutes: number;
  href: string;
}

export function buildStudyPlan(input: PlanInput): { tasks: PlanTask[]; totalMinutes: number; budget: number } {
  const tasks: PlanTask[] = [];
  const budget = input.isStudyDay ? input.dailyMinutes : Math.min(20, input.dailyMinutes);
  let left = budget;

  const take = (perItem: number, available: number) => {
    const n = Math.min(available, Math.floor(left / perItem));
    left -= n * perItem;
    return n;
  };

  // Overdue reviews are always listed in full, even past the budget: skipping them erodes retention.
  if (input.overdueReviews > 0) {
    const minutes = input.overdueReviews * MINUTES.review;
    left -= minutes;
    tasks.push({
      kind: "overdue_reviews",
      title: "Clear overdue flashcards",
      detail: "Overdue cards have the lowest predicted recall. Do these first.",
      count: input.overdueReviews,
      minutes,
      href: "/flashcards/review",
    });
  }

  if (input.dueTodayReviews > 0 && left > 0) {
    const n = take(MINUTES.review, input.dueTodayReviews);
    if (n > 0)
      tasks.push({
        kind: "due_reviews",
        title: "Review cards due today",
        detail: "Scheduled by FSRS for your retention target.",
        count: n,
        minutes: n * MINUTES.review,
        href: "/flashcards/review",
      });
  }

  if (!input.isStudyDay) {
    if (tasks.length === 0) {
      tasks.push({ kind: "rest", title: "Rest day", detail: "No reviews are due. Enjoy the break.", count: 0, minutes: 0, href: "/dashboard" });
    }
    return finish(tasks, budget);
  }

  // Closer to the exam, shift time from new material to practice of weak areas.
  const practiceShare = input.daysUntilExam !== null && input.daysUntilExam <= 30 ? 0.6 : 0.4;
  const practiceBudget = Math.max(0, left * practiceShare);
  for (const topic of input.weakTopics.slice(0, 2)) {
    if (left <= 0 || topic.missedQuestions === 0) continue;
    const maxByShare = Math.floor(practiceBudget / 2 / MINUTES.practiceQuestion);
    const n = Math.min(topic.missedQuestions, Math.max(1, maxByShare), Math.floor(left / MINUTES.practiceQuestion));
    if (n <= 0) continue;
    left -= n * MINUTES.practiceQuestion;
    tasks.push({
      kind: "practice_weak",
      title: `Re-practice missed ${topic.name} questions`,
      detail: `Current measured accuracy ${Math.round(topic.accuracy)}%.`,
      count: n,
      minutes: n * MINUTES.practiceQuestion,
      href: `/questions?topic=${topic.topicId}&result=incorrect`,
    });
  }

  const newCards = take(MINUTES.newCard, Math.min(input.newCardsAvailable, input.maxNewCards));
  if (newCards > 0)
    tasks.push({
      kind: "new_cards",
      title: "Learn new flashcards",
      detail: "First reviews of cards generated from your questions.",
      count: newCards,
      minutes: newCards * MINUTES.newCard,
      href: "/flashcards/review",
    });

  const analyze = Math.floor(left / MINUTES.analyzeQuestion);
  if (analyze > 0)
    tasks.push({
      kind: "analyze_new",
      title: "Analyze new questions",
      detail: "Work through questions from your question bank and turn each into flashcards and notes.",
      count: analyze,
      minutes: analyze * MINUTES.analyzeQuestion,
      href: "/analyze",
    });

  return finish(tasks, budget);
}

function finish(tasks: PlanTask[], budget: number) {
  const totalMinutes = Math.round(tasks.reduce((s, t) => s + t.minutes, 0));
  return { tasks: tasks.map((t) => ({ ...t, minutes: Math.max(1, Math.round(t.minutes)) })), totalMinutes, budget };
}

/** Consecutive-day streak ending today or yesterday, from distinct activity days (YYYY-MM-DD, any order). */
export function computeStreak(days: string[], today: string): number {
  const set = new Set(days);
  const d = new Date(`${today}T00:00:00Z`);
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1);
  let streak = 0;
  while (set.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((Date.parse(`${toIsoDate}T00:00:00Z`) - Date.parse(`${fromIsoDate}T00:00:00Z`)) / 86_400_000);
}
