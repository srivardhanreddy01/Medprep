import { describe, expect, it } from "vitest";
import { parseQuestionPaste } from "./parse";

describe("parseQuestionPaste", () => {
  it("extracts a standard multi-line question paste", () => {
    const input = `A patient develops a sudden severe headache. What is the best initial test?
A. Oxygen
B. Lumbar puncture
C. CT scan of the head
D. Sumatriptan
Your answer: B
Incorrect. Correct answer is C
Explanation:
Sudden thunderclap headache raises concern for subarachnoid hemorrhage.
Educational objective: Noncontrast CT head is the initial test.
QID1851`;
    const result = parseQuestionPaste(input, "uworld", "step2_ck");
    expect(result.qid).toBe("1851");
    expect(result.studentAnswer).toBe("B");
    expect(result.correctAnswer).toBe("C");
    expect(result.choices).toHaveLength(4);
    expect(result.explanation).toContain("subarachnoid hemorrhage");
    expect(result.educationalObjective).toContain("Noncontrast CT");
    expect(result.warnings).toEqual([]);
  });

  it("flags missing answer and explanation instead of inventing them", () => {
    const result = parseQuestionPaste("A patient has a headache.", "other", "step1");
    expect(result.correctAnswer).toBeNull();
    expect(result.explanation).toBeNull();
    expect(result.warnings).toContain("Correct answer not detected");
  });
});
