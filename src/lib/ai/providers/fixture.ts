import type { Analysis, FlashcardSet } from "../schemas";
import type { LLMProvider, StructuredRequest, StructuredResponse } from "./types";

/**
 * Deterministic provider for automated tests and keyless local development.
 * It never runs in production (see getProvider). Output for the hypercalcemia sample question is
 * hand-authored teaching content; for any other question it returns a clearly labeled placeholder.
 */
export class FixtureProvider implements LLMProvider {
  readonly name = "fixture";
  readonly model = "fixture-v1";
  readonly isFixture = true;

  async generateStructured<T>(req: StructuredRequest<T>): Promise<StructuredResponse> {
    const options = parseOptions(req.prompt);
    const isHypercalcemia = /PTH 98 pg\/mL/.test(req.prompt);
    const data =
      req.schemaName === "flashcards"
        ? isHypercalcemia
          ? HYPERCALCEMIA_CARDS
          : genericCards(req.prompt)
        : isHypercalcemia
          ? HYPERCALCEMIA_ANALYSIS
          : genericAnalysis(options, officialFrom(req.prompt));
    return { data: structuredClone(data), model: this.model, usage: { inputTokens: 0, outputTokens: 0 } };
  }
}

function parseOptions(prompt: string): { label: string; text: string }[] {
  const block = prompt.match(/<options>\n([\s\S]*?)\n<\/options>/)?.[1] ?? "";
  return block
    .split("\n")
    .map((l) => l.match(/^([A-J])\. (.*)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ label: m[1], text: m[2] }));
}

function officialFrom(prompt: string): string | null {
  return prompt.match(/official answer key: ([A-J])\./)?.[1] ?? null;
}

function genericAnalysis(options: { label: string; text: string }[], official: string | null): Analysis {
  const answer = official ?? options[0]?.label ?? "A";
  const note = "Test fixture output. Configure an LLM provider for a real explanation.";
  return {
    topic_slug: "pathology",
    subtopic: "Fixture placeholder",
    question_task: "other",
    difficulty: "medium",
    answer: {
      option: answer,
      confidence: "low",
      confidence_rationale: note,
      concept_tested: note,
      justification: note,
      why_best: note,
    },
    key_clues: [{ clue: "Fixture", significance: note, weight: "supporting" }],
    clinical_reasoning: [1, 2, 3, 4, 5, 6].map((step) => ({ step, title: `Step ${step}`, content: note })),
    differential_diagnosis: options.slice(0, 2).map((o, i) => ({
      candidate: o.text,
      supporting: note,
      against: note,
      verdict: i === 0 ? "best" : "plausible",
    })),
    option_explanations: options.map((o) => ({
      label: o.label,
      is_correct: o.label === answer,
      meaning: note,
      why_plausible: note,
      why_wrong_here: note,
      when_correct: note,
      distinguishing_clue: note,
      exam_tip: note,
    })),
    high_yield_takeaways: [note],
    exam_strategy: { pattern_recognition: note, stem_decoding: note, elimination_sequence: [note], time_management: note },
    exam_traps: [],
    mnemonics: [],
    visual_suggestions: [],
    guideline_dependence: { depends_on_guidelines: false, note: "" },
    official_answer_comment: official ? note : "",
    uncertainty_flags: [{ kind: "other", detail: note }],
    learning_summary: note,
  };
}

function genericCards(prompt: string): FlashcardSet {
  const concept = prompt.match(/Concept tested: (.*)/)?.[1]?.slice(0, 80) ?? "this concept";
  const seed = prompt.length;
  return {
    cards: [
      {
        card_type: "basic",
        front: `Fixture card ${seed}-1: What concept does this question test?`,
        back: concept,
        explanation: "Test fixture card.",
        tags: ["fixture"],
      },
      {
        card_type: "basic",
        front: `Fixture card ${seed}-2: What is the decisive clue?`,
        back: "See the analysis.",
        explanation: "Test fixture card.",
        tags: ["fixture"],
      },
      {
        card_type: "cloze",
        front: `Fixture card ${seed}-3: The answer to this question is ____.`,
        back: "See the analysis.",
        explanation: "Test fixture card.",
        tags: ["fixture"],
      },
    ],
  };
}

const HYPERCALCEMIA_ANALYSIS: Analysis = {
  topic_slug: "endocrinology",
  subtopic: "Primary hyperparathyroidism",
  question_task: "diagnosis",
  difficulty: "easy",
  answer: {
    option: "B",
    confidence: "high",
    confidence_rationale:
      "Hypercalcemia with an inappropriately elevated PTH, low phosphorus, and high urine calcium has one leading explanation; no competing option fits all four findings.",
    concept_tested: "PTH-dependent versus PTH-independent hypercalcemia",
    justification:
      "PTH is elevated despite hypercalcemia, so the parathyroid glands are not suppressed: the hypercalcemia is PTH-dependent. PTH lowers phosphate reabsorption in the proximal tubule (low phosphorus) and the filtered calcium load exceeds distal reabsorption (hypercalciuria, kidney stones). Bone resorption explains the bone pain, and hypercalcemia explains constipation and fatigue.",
    why_best:
      "Familial hypocalciuric hypercalcemia is the only other PTH-dependent option, but it causes low urine calcium and is usually asymptomatic. This patient has high urine calcium and a kidney stone.",
  },
  key_clues: [
    {
      clue: "Intact PTH 98 pg/mL with calcium 11.6 mg/dL",
      significance: "PTH should be suppressed by hypercalcemia. A high or even high-normal PTH means PTH-dependent hypercalcemia.",
      weight: "decisive",
    },
    {
      clue: "24-hour urine calcium 340 mg (elevated)",
      significance: "Separates primary hyperparathyroidism (high urine calcium) from familial hypocalciuric hypercalcemia (low).",
      weight: "decisive",
    },
    {
      clue: "Serum phosphorus 2.2 mg/dL",
      significance: "PTH is phosphaturic. Vitamin D excess tends to raise phosphorus.",
      weight: "supporting",
    },
    {
      clue: "Kidney stone, bone pain, constipation, fatigue",
      significance: "Classic 'stones, bones, groans, and moans' pattern of chronic hypercalcemia.",
      weight: "supporting",
    },
    {
      clue: "Normal albumin",
      significance: "Confirms the calcium elevation is real; no albumin correction needed.",
      weight: "supporting",
    },
    {
      clue: "Blood pressure 138/84 mm Hg",
      significance: "Incidental for this question.",
      weight: "distractor",
    },
  ],
  clinical_reasoning: [
    {
      step: 1,
      title: "Identify the task",
      content: "The question asks for the most likely diagnosis behind hypercalcemia.",
    },
    {
      step: 2,
      title: "Extract the clues",
      content:
        "Calcium 11.6 mg/dL with normal albumin, PTH 98 pg/mL (elevated), phosphorus low, urine calcium high, and a 6-month course with a kidney stone. No medications or supplements.",
    },
    {
      step: 3,
      title: "Build the differential",
      content:
        "First split hypercalcemia by PTH. PTH-dependent: primary hyperparathyroidism, familial hypocalciuric hypercalcemia (FHH), tertiary hyperparathyroidism, lithium. PTH-independent (PTH suppressed): malignancy (PTHrP, osteolysis), vitamin D excess, granulomatous disease, thiazides, milk-alkali.",
    },
    {
      step: 4,
      title: "Apply clinical reasoning",
      content:
        "PTH is elevated, which removes every PTH-independent cause (A, D, E). Between primary hyperparathyroidism and FHH, urine calcium decides: FHH has a low calcium-to-creatinine clearance ratio (typically < 0.01), whereas this patient is hypercalciuric and has formed a stone.",
    },
    {
      step: 5,
      title: "Select the answer",
      content:
        "Primary hyperparathyroidism (B). The decisive pair is elevated PTH plus elevated urine calcium in a symptomatic middle-aged woman.",
    },
    {
      step: 6,
      title: "Generalize the learning",
      content:
        "For any hypercalcemia question, look at PTH first. If PTH is suppressed, look for PTHrP or vitamin D metabolites (25-OH for intake, 1,25-OH for granulomas or lymphoma). If PTH is up or inappropriately normal, check urine calcium to rule out FHH before calling it primary hyperparathyroidism.",
    },
  ],
  differential_diagnosis: [
    {
      candidate: "Primary hyperparathyroidism",
      supporting: "Elevated PTH despite hypercalcemia, low phosphorus, hypercalciuria, kidney stone, bone pain",
      against: "Nothing in the stem argues against it",
      verdict: "best",
    },
    {
      candidate: "Familial hypocalciuric hypercalcemia",
      supporting: "PTH can be normal or mildly elevated with hypercalcemia",
      against: "Urine calcium is high and the patient is symptomatic with a stone; FHH has low urine calcium and is usually asymptomatic",
      verdict: "plausible",
    },
    {
      candidate: "Humoral hypercalcemia of malignancy",
      supporting: "Common cause of hypercalcemia in older adults; low phosphorus can occur with PTHrP",
      against: "PTH would be suppressed; the 6-month indolent course and normal examination do not suggest malignancy",
      verdict: "unlikely",
    },
  ],
  option_explanations: [
    {
      label: "A",
      is_correct: false,
      meaning: "Hypercalcemia caused by tumor secretion of PTH-related peptide (for example squamous cell lung cancer or renal cell carcinoma).",
      why_plausible: "It is the most common cause of hypercalcemia in hospitalized patients, and PTHrP also lowers phosphorus.",
      why_wrong_here:
        "PTHrP is not detected by the intact PTH assay and the high calcium suppresses the parathyroids, so intact PTH would be low. Here PTH is 98 pg/mL.",
      when_correct: "Hypercalcemia with suppressed PTH and elevated PTHrP, usually with rapid onset and a known or evident malignancy.",
      distinguishing_clue: "PTH level: suppressed in malignancy, elevated here.",
      exam_tip: "Malignancy-associated hypercalcemia is usually severe, fast, and found in sick patients; primary hyperparathyroidism is usually mild and chronic.",
    },
    {
      label: "B",
      is_correct: true,
      meaning: "Autonomous PTH secretion, most often from a single parathyroid adenoma.",
      why_plausible: "It is the most common cause of hypercalcemia in outpatients.",
      why_wrong_here:
        "This is correct: hypercalcemia with elevated PTH, low phosphorus, hypercalciuria, and a kidney stone is the classic pattern.",
      when_correct: "Hypercalcemia with high or inappropriately normal PTH and normal or high urine calcium.",
      distinguishing_clue: "Elevated PTH together with elevated urine calcium.",
      exam_tip: "An 'inappropriately normal' PTH in a hypercalcemic patient still counts as PTH-dependent.",
    },
    {
      label: "C",
      is_correct: false,
      meaning: "Autosomal dominant inactivating mutation of the calcium-sensing receptor (CASR) that raises the calcium set point.",
      why_plausible: "It also presents with hypercalcemia and a normal or mildly elevated PTH.",
      why_wrong_here: "FHH causes low urine calcium because the renal tubule reabsorbs calcium avidly. This patient has high urine calcium and a stone.",
      when_correct: "Asymptomatic mild hypercalcemia with low urine calcium (calcium/creatinine clearance ratio < 0.01) and a family history.",
      distinguishing_clue: "24-hour urine calcium: low in FHH, high in primary hyperparathyroidism.",
      exam_tip: "Always check urine calcium before referring for parathyroidectomy; surgery does not help FHH.",
    },
    {
      label: "D",
      is_correct: false,
      meaning: "Excess vitamin D intake raising intestinal calcium and phosphate absorption.",
      why_plausible: "It causes hypercalcemia and hypercalciuria.",
      why_wrong_here: "Vitamin D excess suppresses PTH and tends to raise phosphorus. This patient takes no supplements, PTH is high, and phosphorus is low.",
      when_correct: "Hypercalcemia with suppressed PTH, high 25-hydroxyvitamin D, and a history of high-dose supplement use.",
      distinguishing_clue: "Suppressed PTH and high phosphorus.",
      exam_tip: "Look for supplement history in the stem; it is usually stated when vitamin D intoxication is the answer.",
    },
    {
      label: "E",
      is_correct: false,
      meaning: "Granulomatous disease in which macrophages convert 25-hydroxyvitamin D to 1,25-dihydroxyvitamin D independently of PTH.",
      why_plausible: "It is a classic cause of hypercalcemia and hypercalciuria.",
      why_wrong_here: "Calcitriol excess suppresses PTH. There are also no pulmonary, skin, or eye findings and no lymphadenopathy.",
      when_correct: "Hypercalcemia with suppressed PTH, high 1,25-dihydroxyvitamin D, and bilateral hilar lymphadenopathy in a young adult.",
      distinguishing_clue: "Suppressed PTH plus high 1,25-dihydroxyvitamin D.",
      exam_tip: "1,25-OH vitamin D is high in granulomatous disease and lymphoma; 25-OH vitamin D is high in ingestion.",
    },
  ],
  high_yield_takeaways: [
    "Measure PTH first in any hypercalcemia: it splits PTH-dependent from PTH-independent causes.",
    "An inappropriately normal PTH in a hypercalcemic patient is abnormal.",
    "Urine calcium separates primary hyperparathyroidism (high) from FHH (low).",
    "PTH lowers serum phosphorus by reducing proximal tubular reabsorption.",
    "Malignancy, vitamin D, and granulomatous causes all suppress PTH.",
  ],
  exam_strategy: {
    pattern_recognition: "Middle-aged woman + kidney stone + mild chronic hypercalcemia = primary hyperparathyroidism until proven otherwise.",
    stem_decoding:
      "The laboratory panel carries the answer; the vital signs and the normal examination are there to show the patient is not acutely ill, which argues against malignancy.",
    elimination_sequence: [
      "Use PTH to eliminate every PTH-independent cause (A, D, E).",
      "Use urine calcium to eliminate FHH (C).",
      "Confirm the remaining option (B) fits phosphorus and symptoms.",
    ],
    time_management: "This is a two-lab question (PTH, urine calcium). Answer in under a minute and move on.",
  },
  exam_traps: [
    {
      trap: "Choosing malignancy because it is the most common cause of hypercalcemia overall.",
      how_to_avoid: "'Most common' depends on setting: outpatients with mild chronic hypercalcemia most often have primary hyperparathyroidism.",
    },
    {
      trap: "Missing FHH when PTH is high.",
      how_to_avoid: "When the stem gives urine calcium, it is usually there to test FHH versus primary hyperparathyroidism.",
    },
  ],
  mnemonics: [
    {
      mnemonic: "Stones, bones, abdominal groans, and psychiatric moans",
      expansion: "Kidney stones, bone pain, abdominal pain or constipation, and fatigue or depression.",
      caveat:
        "A memory aid for symptoms of chronic hypercalcemia, not a diagnostic rule. Most primary hyperparathyroidism today is found incidentally and is asymptomatic.",
    },
  ],
  visual_suggestions: [
    {
      kind: "diagnostic_algorithm",
      title: "Hypercalcemia work-up by PTH",
      description: "Branch on PTH (suppressed versus elevated), then PTHrP and vitamin D metabolites, or urine calcium for FHH.",
    },
    {
      kind: "lab_pattern",
      title: "Calcium, phosphorus, and PTH patterns",
      description: "Table comparing primary hyperparathyroidism, FHH, malignancy, vitamin D excess, and granulomatous disease.",
    },
  ],
  guideline_dependence: {
    depends_on_guidelines: false,
    note: "The diagnosis rests on physiology. Criteria for recommending surgery are guideline-based and are not tested here.",
  },
  official_answer_comment: "",
  uncertainty_flags: [],
  learning_summary:
    "Hypercalcemia with an elevated or inappropriately normal PTH is PTH-dependent. In that group, urine calcium separates primary hyperparathyroidism (high urine calcium, stones) from familial hypocalciuric hypercalcemia (low urine calcium, asymptomatic). Malignancy, vitamin D excess, and granulomatous disease all suppress PTH. PTH also lowers serum phosphorus.",
};

const HYPERCALCEMIA_CARDS: FlashcardSet = {
  cards: [
    {
      card_type: "basic",
      front: "In a patient with hypercalcemia, what single lab test splits the differential into two groups?",
      back: "Intact PTH (suppressed vs elevated/inappropriately normal).",
      explanation: "PTH-independent causes (malignancy, vitamin D, granulomas) suppress PTH; primary hyperparathyroidism and FHH do not.",
      tags: ["endocrinology", "hypercalcemia", "pth"],
    },
    {
      card_type: "differential",
      front: "What distinguishes primary hyperparathyroidism from familial hypocalciuric hypercalcemia?",
      back: "Urine calcium: high in primary hyperparathyroidism, low in FHH (Ca/Cr clearance ratio < 0.01).",
      explanation: "CASR inactivation in FHH increases renal calcium reabsorption.",
      tags: ["endocrinology", "fhh", "hyperparathyroidism"],
    },
    {
      card_type: "clinical",
      front: "A 58-year-old woman has a kidney stone, constipation, calcium 11.6 mg/dL, high PTH, low phosphorus, and high urine calcium. Diagnosis?",
      back: "Primary hyperparathyroidism.",
      explanation: "Elevated PTH plus hypercalciuria; low phosphorus from PTH's phosphaturic effect.",
      tags: ["endocrinology", "hyperparathyroidism"],
    },
    {
      card_type: "cloze",
      front: "PTH lowers serum phosphorus by decreasing phosphate reabsorption in the ____ tubule.",
      back: "Proximal",
      explanation: "PTH reduces NaPi-IIa cotransporters in the proximal tubule.",
      tags: ["physiology", "renal", "pth"],
    },
    {
      card_type: "differential",
      front: "Which vitamin D metabolite is elevated in sarcoidosis-related hypercalcemia versus vitamin D ingestion?",
      back: "Sarcoidosis: 1,25-dihydroxyvitamin D. Ingestion: 25-hydroxyvitamin D.",
      explanation: "Granuloma macrophages express 1α-hydroxylase independent of PTH.",
      tags: ["endocrinology", "sarcoidosis", "vitamin-d"],
    },
  ],
};
