import { describe, expect, it } from "vitest";
import { buildStudyPlan, computeStreak, daysBetween } from "@/lib/plan/study-plan";

const base = {
  dailyMinutes: 60,
  overdueReviews: 0,
  dueTodayReviews: 0,
  newCardsAvailable: 0,
  maxNewCards: 20,
  weakTopics: [],
  daysUntilExam: null,
  isStudyDay: true,
};

describe("buildStudyPlan", () => {
  it("puts overdue reviews first and keeps them even past the budget", () => {
    const p = buildStudyPlan({ ...base, dailyMinutes: 10, overdueReviews: 100, dueTodayReviews: 10 });
    expect(p.tasks[0].kind).toBe("overdue_reviews");
    expect(p.tasks[0].count).toBe(100);
    expect(p.tasks.find((t) => t.kind === "due_reviews")).toBeUndefined();
  });
  it("fits tasks into the budget", () => {
    const p = buildStudyPlan({
      ...base,
      dueTodayReviews: 40,
      newCardsAvailable: 50,
      weakTopics: [{ topicId: 1, name: "Renal", accuracy: 40, missedQuestions: 6 }],
    });
    expect(p.totalMinutes).toBeLessThanOrEqual(61);
    expect(p.tasks.map((t) => t.kind)).toEqual(["due_reviews", "practice_weak", "new_cards", "analyze_new"]);
  });
  it("respects the new-card limit", () => {
    const p = buildStudyPlan({ ...base, newCardsAvailable: 500, maxNewCards: 5 });
    expect(p.tasks.find((t) => t.kind === "new_cards")?.count).toBe(5);
  });
  it("only schedules reviews on non-study days", () => {
    const p = buildStudyPlan({ ...base, isStudyDay: false, dueTodayReviews: 10, newCardsAvailable: 10 });
    expect(p.tasks.map((t) => t.kind)).toEqual(["due_reviews"]);
  });
});

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-03-10", "2026-03-09", "2026-03-08", "2026-03-05"], "2026-03-10")).toBe(3);
  });
  it("keeps the streak alive if today has no activity yet", () => {
    expect(computeStreak(["2026-03-09", "2026-03-08"], "2026-03-10")).toBe(2);
  });
  it("returns 0 when the last activity was two days ago", () => {
    expect(computeStreak(["2026-03-08"], "2026-03-10")).toBe(0);
  });
  it("computes days between dates", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
  });
});
