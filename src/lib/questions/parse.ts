import { OPTION_LABELS } from "@/lib/taxonomy";

export interface ParsedQuestion {
  stem: string;
  options: { label: string; text: string }[];
}

// "A.", "A)", "(A)", "A:", "A -", optionally preceded by a bullet; label must start the line.
const OPTION_LINE = /^\s*(?:[-*•]\s*)?\(?([A-Ja-j])(?:[.):]|\s+-)\s+(.+)$/;
// "Answer: C", "Correct answer - C", "Ans. C"
const ANSWER_LINE = /^\s*(?:correct\s+)?(?:answer|ans)\s*[.:-]?\s*\(?([A-J])\)?\b/i;

/**
 * Splits a pasted question into stem and options. Options must be consecutive letters starting at
 * A. Text that follows the last option on lines without a label is treated as a continuation of
 * that option. A trailing "Answer: X" line is extracted separately and never mixed into options.
 */
export function parseQuestionText(raw: string): ParsedQuestion & { answerHint: string | null } {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let answerHint: string | null = null;

  // Find the first line that starts an "A" option such that B follows, scanning from the end so a
  // stem that mentions "A." early in a sentence is not mistaken for options.
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(OPTION_LINE);
    if (m && m[1].toUpperCase() === "A") {
      const next = lines.slice(i + 1).find((l) => OPTION_LINE.test(l));
      if (next && next.match(OPTION_LINE)![1].toUpperCase() === "B") {
        start = i;
        break;
      }
    }
  }
  if (start === -1) return { stem: raw.trim(), options: [], answerHint: null };

  const options: { label: string; text: string }[] = [];
  let expected = 0;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const ans = line.match(ANSWER_LINE);
    if (ans) {
      answerHint = ans[1].toUpperCase();
      break;
    }
    const m = line.match(OPTION_LINE);
    if (m && m[1].toUpperCase() === OPTION_LABELS[expected]) {
      options.push({ label: OPTION_LABELS[expected], text: m[2].trim() });
      expected++;
      if (expected >= OPTION_LABELS.length) break;
    } else if (line.trim() && options.length) {
      options[options.length - 1].text += ` ${line.trim()}`;
    }
  }
  const stem = lines.slice(0, start).join("\n").trim();
  return { stem, options, answerHint };
}

/** Normalizes stem + options for exact-duplicate detection. */
export function canonicalQuestion(stem: string, options: { text: string }[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9.%/]+/g, " ").trim();
  return `${norm(stem)}||${options.map((o) => norm(o.text)).join("|")}`;
}

export async function contentHash(stem: string, options: { text: string }[]): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalQuestion(stem, options));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
