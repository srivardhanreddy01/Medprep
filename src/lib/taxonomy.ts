// Mirrors supabase/migrations/*_reference_data.sql. Keep in sync.

export const TOPIC_SLUGS = [
  "cardiovascular",
  "respiratory",
  "renal",
  "gastrointestinal",
  "neurology",
  "endocrinology",
  "hematology-oncology",
  "infectious-disease",
  "immunology",
  "musculoskeletal",
  "reproductive",
  "psychiatry",
  "biostatistics",
  "ethics",
  "pharmacology",
  "pathology",
  "anatomy",
  "physiology",
] as const;
export type TopicSlug = (typeof TOPIC_SLUGS)[number];

export const EXAM_IDS = [
  "usmle-step1",
  "usmle-step2ck",
  "usmle-step3",
  "comlex",
  "plab-ukmla",
  "neet-pg",
  "ini-cet",
  "other",
] as const;
export type ExamId = (typeof EXAM_IDS)[number];

export const QUESTION_TASKS = [
  "diagnosis",
  "pathophysiology",
  "next_best_step",
  "treatment",
  "mechanism_of_action",
  "adverse_effect",
  "risk_factor",
  "lab_interpretation",
  "anatomy_physiology",
  "prognosis_complication",
  "other",
] as const;
export type QuestionTask = (typeof QUESTION_TASKS)[number];

export const QUESTION_TASK_LABELS: Record<QuestionTask, string> = {
  diagnosis: "Diagnosis",
  pathophysiology: "Pathophysiology",
  next_best_step: "Next best step",
  treatment: "Most appropriate treatment",
  mechanism_of_action: "Mechanism of action",
  adverse_effect: "Adverse effect",
  risk_factor: "Risk factor",
  lab_interpretation: "Laboratory interpretation",
  anatomy_physiology: "Anatomy or physiology",
  prognosis_complication: "Prognosis or complication",
  other: "Other",
};

export const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;
export type OptionLabel = (typeof OPTION_LABELS)[number];
