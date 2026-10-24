import type { StoredAnalysis } from "@/lib/ai/schemas";
import type { TopicSlug } from "@/lib/taxonomy";

/**
 * Video learning. MedPrep does not host video: each question gets a "reel" built from its own
 * analysis (short vertical slides), and both reels and the long-form library link out to YouTube
 * searches. Students can paste a YouTube link to watch it inline.
 */

export interface ReelSlide {
  kind: "hook" | "clue" | "answer" | "trap" | "mnemonic" | "recap";
  eyebrow: string;
  text: string;
  detail?: string;
}

const clip = (s: string, max = 220) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/** Builds a 30-60 second reel for one question from its stored analysis. Every analyzed question yields at least four slides. */
export function buildReel(a: StoredAnalysis, answerText?: string): ReelSlide[] {
  const slides: ReelSlide[] = [{ kind: "hook", eyebrow: "What is this testing?", text: a.subtopic, detail: clip(a.answer.concept_tested) }];
  const clues = a.key_clues.filter((c) => c.weight === "decisive").slice(0, 2);
  for (const c of clues.length ? clues : a.key_clues.slice(0, 1))
    slides.push({ kind: "clue", eyebrow: "Key clue", text: clip(c.clue, 140), detail: clip(c.significance) });
  slides.push({
    kind: "answer",
    eyebrow: "Answer",
    text: answerText ? `${a.answer.option}. ${answerText}` : `Option ${a.answer.option}`,
    detail: clip(a.answer.why_best),
  });
  const trap = a.exam_traps[0];
  if (trap) slides.push({ kind: "trap", eyebrow: "Exam trap", text: clip(trap.trap, 160), detail: clip(trap.how_to_avoid) });
  const m = a.mnemonics[0];
  if (m) slides.push({ kind: "mnemonic", eyebrow: "Memory aid", text: m.mnemonic, detail: clip(m.expansion) });
  slides.push({ kind: "recap", eyebrow: "Pattern to remember", text: clip(a.exam_strategy.pattern_recognition, 200) });
  return slides;
}

export const youtubeSearchUrl = (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
export const youtubeShortsUrl = (query: string) => youtubeSearchUrl(`${query} #shorts`);

/** Extracts a YouTube video id from watch, share, shorts, embed, and live URLs. */
export function parseYouTubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
      id = m?.[2] ?? null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;

/** Free, widely used medical education channels. Links are searches so they never go stale. */
export const VIDEO_CHANNELS = [
  { name: "Ninja Nerd", focus: "Whiteboard lectures on physiology, pathology, and pharmacology" },
  { name: "Osmosis", focus: "Short animated disease and drug overviews" },
  { name: "Khan Academy Medicine", focus: "Foundational science and systems review" },
  { name: "Armando Hasudungan", focus: "Hand-drawn pathophysiology and immunology" },
  { name: "Strong Medicine", focus: "Internal medicine teaching for clinical years" },
] as const;

export interface LectureTopic {
  title: string;
  query: string;
}

/** Long-form lecture suggestions per subject. The query is sent to YouTube search. */
export const LONG_FORM_LIBRARY: Record<TopicSlug, LectureTopic[]> = {
  cardiovascular: [
    { title: "Cardiac cycle and pressure-volume loops", query: "cardiac cycle pressure volume loop lecture" },
    { title: "Heart failure: pathophysiology to management", query: "heart failure pathophysiology management lecture" },
    { title: "ECG interpretation from first principles", query: "ECG interpretation full lecture" },
  ],
  respiratory: [
    { title: "Pulmonary function tests and flow-volume loops", query: "pulmonary function tests flow volume loop lecture" },
    { title: "Obstructive vs restrictive lung disease", query: "obstructive vs restrictive lung disease lecture" },
  ],
  renal: [
    { title: "Acid-base disorders, step by step", query: "acid base disorders step by step lecture" },
    { title: "Glomerulonephritis and nephrotic syndrome", query: "nephritic vs nephrotic syndrome lecture" },
  ],
  gastrointestinal: [
    { title: "Liver function tests and jaundice", query: "jaundice liver function tests lecture" },
    { title: "Inflammatory bowel disease", query: "crohn disease ulcerative colitis lecture" },
  ],
  neurology: [
    { title: "Stroke syndromes by vascular territory", query: "stroke syndromes vascular territory lecture" },
    { title: "Brainstem lesions and cranial nerves", query: "brainstem lesions cranial nerves lecture" },
  ],
  endocrinology: [
    { title: "Calcium, PTH, and vitamin D", query: "calcium PTH vitamin D physiology lecture" },
    { title: "Thyroid disorders", query: "hyperthyroidism hypothyroidism lecture" },
    { title: "Adrenal disorders", query: "cushing addison adrenal lecture" },
  ],
  "hematology-oncology": [
    { title: "Approach to anemia", query: "approach to anemia lecture" },
    { title: "Coagulation cascade and bleeding disorders", query: "coagulation cascade bleeding disorders lecture" },
  ],
  "infectious-disease": [
    { title: "Antibiotics by mechanism", query: "antibiotics mechanism of action lecture" },
    { title: "HIV: virology to treatment", query: "HIV pathophysiology treatment lecture" },
  ],
  immunology: [
    { title: "Hypersensitivity reactions", query: "hypersensitivity reactions types lecture" },
    { title: "Primary immunodeficiencies", query: "primary immunodeficiency lecture" },
  ],
  musculoskeletal: [
    { title: "Inflammatory arthritis", query: "rheumatoid arthritis spondyloarthritis lecture" },
    { title: "Brachial plexus and upper limb nerve injuries", query: "brachial plexus nerve injuries lecture" },
  ],
  reproductive: [
    { title: "Menstrual cycle hormones", query: "menstrual cycle hormones lecture" },
    { title: "Hypertensive disorders of pregnancy", query: "preeclampsia eclampsia lecture" },
  ],
  psychiatry: [
    { title: "Antipsychotics and antidepressants", query: "antipsychotics antidepressants pharmacology lecture" },
    { title: "Mood disorders", query: "major depressive disorder bipolar lecture" },
  ],
  biostatistics: [
    { title: "Sensitivity, specificity, and predictive values", query: "sensitivity specificity predictive value lecture" },
    { title: "Study designs and bias", query: "epidemiology study designs bias lecture" },
  ],
  ethics: [
    { title: "Capacity, consent, and confidentiality", query: "medical ethics capacity informed consent lecture" },
  ],
  pharmacology: [
    { title: "Pharmacokinetics", query: "pharmacokinetics lecture" },
    { title: "Autonomic pharmacology", query: "autonomic pharmacology lecture" },
  ],
  pathology: [
    { title: "Cell injury and inflammation", query: "cell injury inflammation pathology lecture" },
    { title: "Neoplasia", query: "neoplasia pathology lecture" },
  ],
  anatomy: [
    { title: "Upper and lower limb nerves", query: "upper lower limb nerves anatomy lecture" },
    { title: "Abdominal vasculature", query: "abdominal blood supply anatomy lecture" },
  ],
  physiology: [
    { title: "Membrane potentials and action potentials", query: "action potential physiology lecture" },
    { title: "Renal physiology", query: "renal physiology lecture" },
  ],
};
