import type { ExamId } from "@/lib/taxonomy";

/**
 * Sample mentor profiles for the Find a Mentor page. These are fictional placeholders that show
 * the layout until real mentor sign-up and booking exist.
 */
export interface Mentor {
  id: string;
  name: string;
  role: string;
  exams: ExamId[];
  subjects: string[];
  languages: string[];
  bio: string;
  format: ("video" | "chat" | "study-plan review")[];
}

export const SAMPLE_MENTORS: Mentor[] = [
  {
    id: "m1",
    name: "Dr. Aisha Rahman",
    role: "PGY-2, Internal Medicine",
    exams: ["usmle-step1", "usmle-step2ck"],
    subjects: ["Cardiology", "Renal", "Biostatistics"],
    languages: ["English", "Urdu"],
    bio: "Took Step 1 pass/fail and Step 2 CK six months apart. Happy to help you build a dedicated-period schedule and a question-review routine.",
    format: ["video", "study-plan review"],
  },
  {
    id: "m2",
    name: "Dr. Karthik Iyer",
    role: "MD Radiology resident",
    exams: ["neet-pg", "ini-cet"],
    subjects: ["Anatomy", "Radiology", "Image-based questions"],
    languages: ["English", "Tamil", "Hindi"],
    bio: "Cleared NEET PG and INI-CET in the same cycle. Focus on high-volume revision, grand tests, and image questions.",
    format: ["video", "chat"],
  },
  {
    id: "m3",
    name: "Dr. Emily Chen",
    role: "Foundation Year 2 doctor",
    exams: ["plab-ukmla"],
    subjects: ["Emergency medicine", "Prescribing", "Ethics"],
    languages: ["English", "Mandarin"],
    bio: "International graduate who passed PLAB 1 and 2. Can talk you through UK guidelines, the GMC process, and exam-day logistics.",
    format: ["chat", "study-plan review"],
  },
  {
    id: "m4",
    name: "Dr. Marcus Johnson",
    role: "DO, Family Medicine attending",
    exams: ["comlex", "usmle-step3"],
    subjects: ["OMM", "Outpatient medicine", "CCS cases"],
    languages: ["English", "Spanish"],
    bio: "Took COMLEX and USMLE in parallel. Mentors osteopathic students on balancing both, and residents preparing for Step 3.",
    format: ["video"],
  },
  {
    id: "m5",
    name: "Dr. Priya Nair",
    role: "MD Pharmacology, faculty",
    exams: ["neet-pg", "usmle-step1"],
    subjects: ["Pharmacology", "Microbiology"],
    languages: ["English", "Malayalam"],
    bio: "Teaches second-year MBBS. Helps students who keep losing marks on drug mechanisms and adverse effects build retrieval habits.",
    format: ["video", "chat"],
  },
  {
    id: "m6",
    name: "Dr. Sofia Martinez",
    role: "PGY-3, Psychiatry",
    exams: ["usmle-step2ck", "usmle-step3"],
    subjects: ["Psychiatry", "Neurology", "Wellbeing"],
    languages: ["English", "Spanish"],
    bio: "Passionate about sustainable study habits. A good fit if burnout or test anxiety is getting in the way of your prep.",
    format: ["video", "study-plan review"],
  },
];
