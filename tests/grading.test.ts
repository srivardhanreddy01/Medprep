import { describe, expect, it } from "vitest";
import { answerStatus, gradeAttempt } from "@/lib/questions/grading";

describe("gradeAttempt", () => {
  it("prefers the official key over the AI answer", () => {
    expect(gradeAttempt("B", "B", "C")).toEqual({ is_correct: true, graded_against: "official" });
    expect(gradeAttempt("C", "B", "C")).toEqual({ is_correct: false, graded_against: "official" });
  });
  it("falls back to the AI answer, marked unverified", () => {
    expect(gradeAttempt("C", null, "C")).toEqual({ is_correct: true, graded_against: "ai_unverified" });
  });
  it("leaves ungraded when nothing to grade against or no selection", () => {
    expect(gradeAttempt("A", null, null)).toEqual({ is_correct: null, graded_against: null });
    expect(gradeAttempt(null, "A", "A")).toEqual({ is_correct: null, graded_against: null });
  });
  it("reports answer status", () => {
    expect(answerStatus(null, "A")).toBe("ai_inferred_unverified");
    expect(answerStatus("A", "A")).toBe("official_key_agrees");
    expect(answerStatus("B", "A")).toBe("official_key_disagrees");
  });
});
