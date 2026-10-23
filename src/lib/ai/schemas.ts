import { z } from "zod";
import { QUESTION_TASKS, TOPIC_SLUGS } from "@/lib/taxonomy";

/**
 * Model-facing schemas. These are sent to the LLM as the structured-output JSON schema and
 * then re-validated server-side (see validate.ts) before anything is shown or saved.
 * Keep constraints simple here: structured-output JSON schema supports a subset of keywords,
 * so business rules (label coverage, counts) live in validate.ts.
 */

const Label = z.string().describe("Option letter, e.g. \"C\"");

export const KeyClueSchema = z.object({
  clue: z.string().describe("Exact finding from the stem, quoted or closely paraphrased"),
  significance: z.string().describe("How this finding changes the differential"),
  weight: z
    .enum(["decisive", "supporting", "distractor"])
    .describe("decisive = discriminates between top candidates; distractor = incidental or misleading"),
});

export const ReasoningStepSchema = z.object({
  step: z.number().int().describe("1..6"),
  title: z.string(),
  content: z.string(),
});

export const DifferentialSchema = z.object({
  candidate: z.string(),
  supporting: z.string().describe("Findings in THIS stem that support it"),
  against: z.string().describe("Findings in THIS stem that weaken it, or expected findings that are absent"),
  verdict: z.enum(["best", "plausible", "unlikely"]),
});

export const OptionExplanationSchema = z.object({
  label: Label,
  is_correct: z.boolean(),
  meaning: z.string().describe("What this option means, in one or two sentences"),
  why_plausible: z.string().describe("Why a student might initially pick it, given this stem"),
  why_wrong_here: z
    .string()
    .describe("For incorrect options: why it is wrong in THIS question. For the correct option: why it is right."),
  when_correct: z.string().describe("The clinical scenario in which this option would be the right answer"),
  distinguishing_clue: z.string().describe("The single clue that separates this option from the correct answer"),
  exam_tip: z.string(),
});

export const UncertaintyFlagSchema = z.object({
  kind: z.enum([
    "ambiguous_stem",
    "multiple_plausible_answers",
    "possibly_outdated",
    "insufficient_information",
    "possible_answer_key_error",
    "region_dependent_practice",
    "other",
  ]),
  detail: z.string(),
});

export const AnalysisSchema = z.object({
  topic_slug: z.enum(TOPIC_SLUGS).describe("Primary system or discipline being tested"),
  subtopic: z.string().describe("Specific concept, e.g. \"Primary hyperparathyroidism\""),
  question_task: z.enum(QUESTION_TASKS),
  difficulty: z.enum(["easy", "medium", "hard"]),
  answer: z.object({
    option: Label,
    confidence: z.enum(["low", "moderate", "high"]),
    confidence_rationale: z.string(),
    concept_tested: z.string(),
    justification: z.string().describe("Clinical or scientific justification"),
    why_best: z.string().describe("Why this beats the closest competing option"),
  }),
  key_clues: z.array(KeyClueSchema),
  clinical_reasoning: z
    .array(ReasoningStepSchema)
    .describe(
      "Exactly six steps: 1 identify the task, 2 extract clues, 3 build the differential, 4 apply reasoning, 5 select the answer, 6 generalize",
    ),
  differential_diagnosis: z.array(DifferentialSchema),
  option_explanations: z.array(OptionExplanationSchema).describe("One entry for EVERY option, in label order"),
  high_yield_takeaways: z.array(z.string()),
  exam_strategy: z.object({
    pattern_recognition: z.string(),
    stem_decoding: z.string().describe("Which sentences carry signal and which are noise"),
    elimination_sequence: z.array(z.string()).describe("Ordered steps to eliminate options"),
    time_management: z.string(),
  }),
  exam_traps: z.array(
    z.object({
      trap: z.string(),
      how_to_avoid: z.string(),
    }),
  ),
  mnemonics: z.array(
    z.object({
      mnemonic: z.string(),
      expansion: z.string(),
      caveat: z.string().describe("Exceptions; state that it is a memory aid, not a diagnostic rule"),
    }),
  ),
  visual_suggestions: z.array(
    z.object({
      kind: z.enum([
        "anatomy",
        "pathophysiology_flowchart",
        "mechanism",
        "diagnostic_algorithm",
        "histology",
        "ecg",
        "lab_pattern",
        "imaging",
        "comparison_chart",
        "treatment_tree",
      ]),
      title: z.string(),
      description: z.string(),
    }),
  ),
  guideline_dependence: z.object({
    depends_on_guidelines: z.boolean(),
    note: z.string().describe("Which recommendation is time- or region-sensitive; do not cite a version you are unsure of"),
  }),
  official_answer_comment: z
    .string()
    .describe("If an official answer was supplied: agreement or reasoned disagreement. Otherwise empty string."),
  uncertainty_flags: z.array(UncertaintyFlagSchema),
  learning_summary: z.string().describe("3-5 sentence summary the student can save as a note"),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

export const FlashcardDraftSchema = z.object({
  card_type: z.enum(["basic", "clinical", "differential", "cloze"]),
  front: z.string().describe("Question side. Cloze cards use ____ for each blank."),
  back: z.string().describe("Concise answer"),
  explanation: z.string().describe("One or two sentences of why"),
  tags: z.array(z.string()),
});
export type FlashcardDraft = z.infer<typeof FlashcardDraftSchema>;

export const FlashcardSetSchema = z.object({
  cards: z.array(FlashcardDraftSchema).describe("3 to 8 cards, each testing a different fact"),
});
export type FlashcardSet = z.infer<typeof FlashcardSetSchema>;

/** What is stored in ai_analyses.result: the validated model output plus server-owned fields. */
export type StoredAnalysis = Analysis & {
  answer_status: "official_key_agrees" | "official_key_disagrees" | "ai_inferred_unverified";
  references: { title: string; source_id: string }[]; // only from curated retrieval (Phase 3)
  validation_notes: string[];
  generated_by: { provider: string; model: string; prompt_version: string; fixture: boolean };
};
