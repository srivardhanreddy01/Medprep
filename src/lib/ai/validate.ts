import type { Analysis, FlashcardDraft } from "./schemas";
import { AnalysisSchema, FlashcardSetSchema } from "./schemas";

export type ValidationResult<T> =
  | { ok: true; data: T; notes: string[] }
  | { ok: false; issues: string[] };

export interface QuestionForValidation {
  labels: string[];
  officialAnswer?: string | null;
}

/**
 * Validates the model's analysis against the actual question. Hard failures are returned as
 * issues (and fed back to the model for one repair attempt); soft problems are repaired in place
 * and recorded as notes.
 */
export function validateAnalysis(raw: unknown, q: QuestionForValidation): ValidationResult<Analysis> {
  const parsed = AnalysisSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const data = structuredClone(parsed.data);
  const issues: string[] = [];
  const notes: string[] = [];
  const labels = new Set(q.labels);

  data.answer.option = data.answer.option.trim().toUpperCase();
  if (!labels.has(data.answer.option)) {
    issues.push(`answer.option "${data.answer.option}" is not one of the options ${[...labels].join(", ")}`);
  }

  const seen = new Set<string>();
  const explanations = [];
  for (const e of data.option_explanations) {
    const label = e.label.trim().toUpperCase();
    if (!labels.has(label)) {
      notes.push(`Dropped explanation for unknown option ${label}`);
      continue;
    }
    if (seen.has(label)) {
      notes.push(`Dropped duplicate explanation for option ${label}`);
      continue;
    }
    seen.add(label);
    explanations.push({ ...e, label, is_correct: label === data.answer.option });
  }
  const missing = q.labels.filter((l) => !seen.has(l));
  if (missing.length) issues.push(`option_explanations is missing options ${missing.join(", ")}`);
  explanations.sort((a, b) => a.label.localeCompare(b.label));
  data.option_explanations = explanations;

  const steps = [...data.clinical_reasoning].sort((a, b) => a.step - b.step);
  if (steps.length < 6) issues.push(`clinical_reasoning must have 6 steps, got ${steps.length}`);
  data.clinical_reasoning = steps.slice(0, 6).map((s, i) => ({ ...s, step: i + 1 }));

  if (data.key_clues.length === 0) issues.push("key_clues is empty");
  if (data.differential_diagnosis.length < 2) issues.push("differential_diagnosis needs at least 2 candidates");
  if (data.differential_diagnosis.length > 4) {
    data.differential_diagnosis = data.differential_diagnosis.slice(0, 4);
    notes.push("Trimmed differential to 4 candidates");
  }

  if (q.officialAnswer && data.answer.option !== q.officialAnswer) {
    const flagged = data.uncertainty_flags.some((f) => f.kind === "possible_answer_key_error");
    if (!flagged) {
      data.uncertainty_flags.push({
        kind: "possible_answer_key_error",
        detail: `The AI's independent answer (${data.answer.option}) differs from the official answer (${q.officialAnswer}). Review both lines of reasoning.`,
      });
    }
  }

  // A low-confidence answer must be surfaced as uncertainty.
  if (data.answer.confidence === "low" && data.uncertainty_flags.length === 0) {
    data.uncertainty_flags.push({ kind: "other", detail: "The AI reports low confidence in this answer." });
  }

  if (issues.length) return { ok: false, issues };
  return { ok: true, data, notes };
}

export function normalizeFront(front: string): string {
  return front.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Validates and deduplicates flashcards (within the set and against existing fronts). */
export function validateFlashcards(
  raw: unknown,
  existingFronts: Iterable<string>,
): ValidationResult<FlashcardDraft[]> {
  const parsed = FlashcardSetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  const existing = new Set([...existingFronts].map(normalizeFront));
  const notes: string[] = [];
  const out: FlashcardDraft[] = [];
  for (const c of parsed.data.cards) {
    const front = c.front.trim();
    const back = c.back.trim();
    if (front.length < 5 || back.length < 1) {
      notes.push("Dropped an empty card");
      continue;
    }
    if (front.length > 2000 || back.length > 4000) {
      notes.push("Dropped an oversized card");
      continue;
    }
    const key = normalizeFront(front);
    if (existing.has(key)) {
      notes.push(`Skipped duplicate card: ${front.slice(0, 60)}`);
      continue;
    }
    existing.add(key);
    out.push({
      ...c,
      front,
      back,
      tags: [...new Set(c.tags.map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))].slice(0, 8),
    });
  }
  if (out.length > 8) {
    notes.push(`Kept the first 8 of ${out.length} cards`);
    out.length = 8;
  }
  if (out.length === 0) return { ok: false, issues: ["No usable, non-duplicate flashcards were generated"] };
  return { ok: true, data: out, notes };
}
