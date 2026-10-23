/**
 * Fictional educational sample questions for testing. Written for this project; not taken from
 * any commercial question bank. Patients and details are invented.
 */
export interface SampleQuestion {
  id: string;
  title: string;
  exam: string;
  topic: string;
  stem: string;
  options: { label: string; text: string }[];
  answer: string;
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: "hypercalcemia",
    title: "Hypercalcemia with kidney stones",
    exam: "usmle-step2ck",
    topic: "endocrinology",
    stem: `A 58-year-old woman comes to the clinic because of fatigue, constipation, and "aching bones" for 6 months. Two months ago she passed a kidney stone. She takes no medications or supplements. Temperature is 36.8°C (98.2°F), pulse is 76/min, and blood pressure is 138/84 mm Hg. Physical examination shows no abnormalities. Laboratory studies show:

Serum calcium 11.6 mg/dL (reference 8.5–10.2)
Serum phosphorus 2.2 mg/dL (reference 2.5–4.5)
Serum albumin 4.1 g/dL
Intact PTH 98 pg/mL (reference 10–65)
Creatinine 0.9 mg/dL
24-hour urine calcium 340 mg (elevated)

Which of the following is the most likely diagnosis?`,
    options: [
      { label: "A", text: "Humoral hypercalcemia of malignancy" },
      { label: "B", text: "Primary hyperparathyroidism" },
      { label: "C", text: "Familial hypocalciuric hypercalcemia" },
      { label: "D", text: "Vitamin D intoxication" },
      { label: "E", text: "Sarcoidosis" },
    ],
    answer: "B",
  },
  {
    id: "dka-potassium",
    title: "DKA with low potassium",
    exam: "usmle-step2ck",
    topic: "endocrinology",
    stem: `A 19-year-old man with type 1 diabetes mellitus is brought to the emergency department because of vomiting, abdominal pain, and rapid breathing for 1 day. He ran out of insulin 3 days ago. Pulse is 118/min, respirations are 28/min and deep, and blood pressure is 102/64 mm Hg. Mucous membranes are dry. Laboratory studies show:

Glucose 520 mg/dL
Sodium 131 mEq/L
Potassium 3.1 mEq/L
Bicarbonate 9 mEq/L
Arterial pH 7.12
Serum β-hydroxybutyrate markedly elevated

An intravenous infusion of 0.9% saline is started. Which of the following is the most appropriate next step in management?`,
    options: [
      { label: "A", text: "Begin a continuous intravenous regular insulin infusion" },
      { label: "B", text: "Administer intravenous potassium chloride and delay insulin" },
      { label: "C", text: "Administer intravenous sodium bicarbonate" },
      { label: "D", text: "Administer subcutaneous insulin glargine" },
      { label: "E", text: "Switch the infusion to 5% dextrose in water" },
    ],
    answer: "B",
  },
  {
    id: "rv-infarct",
    title: "Hypotension after nitroglycerin",
    exam: "usmle-step2ck",
    topic: "cardiovascular",
    stem: `A 64-year-old man is brought to the emergency department 1 hour after the onset of crushing substernal chest pain. He received sublingual nitroglycerin from paramedics, after which he became lightheaded. Pulse is 54/min and blood pressure is 82/50 mm Hg. Jugular venous pressure is elevated. The lungs are clear to auscultation. An ECG shows ST-segment elevation in leads II, III, and aVF, and ST elevation in right-sided lead V4R.

Which of the following is the most appropriate immediate step in management?`,
    options: [
      { label: "A", text: "Intravenous furosemide" },
      { label: "B", text: "Intravenous normal saline bolus" },
      { label: "C", text: "Repeat sublingual nitroglycerin" },
      { label: "D", text: "Intravenous metoprolol" },
      { label: "E", text: "Intravenous morphine" },
    ],
    answer: "B",
  },
  {
    id: "allopurinol",
    title: "Gout prophylaxis mechanism",
    exam: "usmle-step1",
    topic: "pharmacology",
    stem: `A 52-year-old man has had three attacks of acute gouty arthritis of the first metatarsophalangeal joint in the past year. Between attacks he is asymptomatic. Serum uric acid is 9.4 mg/dL. A 24-hour urine collection shows uric acid excretion within the reference range for overproduction. A drug is started that lowers serum uric acid by reducing its synthesis from hypoxanthine and xanthine.

The drug most likely acts by which of the following mechanisms?`,
    options: [
      { label: "A", text: "Inhibition of microtubule polymerization in neutrophils" },
      { label: "B", text: "Inhibition of URAT1 in the proximal tubule" },
      { label: "C", text: "Inhibition of xanthine oxidase" },
      { label: "D", text: "Enzymatic conversion of uric acid to allantoin" },
      { label: "E", text: "Inhibition of cyclooxygenase" },
    ],
    answer: "C",
  },
  {
    id: "sensitivity",
    title: "Calculating sensitivity",
    exam: "usmle-step1",
    topic: "biostatistics",
    stem: `A new rapid antigen test is evaluated in 500 people. Of 200 people with the disease confirmed by the reference standard, 160 have a positive rapid test. Of 300 people without the disease, 270 have a negative rapid test.

What is the sensitivity of the rapid test?`,
    options: [
      { label: "A", text: "53%" },
      { label: "B", text: "80%" },
      { label: "C", text: "84%" },
      { label: "D", text: "87%" },
      { label: "E", text: "90%" },
    ],
    answer: "B",
  },
];
