export interface GradeResult {
  is_correct: boolean | null;
  graded_against: "official" | "ai_unverified" | null;
}

/**
 * Grades an attempt. The official key always wins; the AI answer is used only when no key exists
 * and the result is marked unverified so the UI can say so.
 */
export function gradeAttempt(
  selected: string | null | undefined,
  official: string | null | undefined,
  aiAnswer: string | null | undefined,
): GradeResult {
  if (!selected) return { is_correct: null, graded_against: null };
  if (official) return { is_correct: selected === official, graded_against: "official" };
  if (aiAnswer) return { is_correct: selected === aiAnswer, graded_against: "ai_unverified" };
  return { is_correct: null, graded_against: null };
}

export function answerStatus(
  official: string | null | undefined,
  aiAnswer: string,
): "official_key_agrees" | "official_key_disagrees" | "ai_inferred_unverified" {
  if (!official) return "ai_inferred_unverified";
  return official === aiAnswer ? "official_key_agrees" : "official_key_disagrees";
}
