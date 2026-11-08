import { z } from "zod";

export const ParsedQuestionSchema = z.object({
  source: z.string().min(1),
  exam: z.enum(["step1", "step2_ck"]),
  qid: z.string().nullable(),
  questionText: z.string(),
  choices: z.array(z.object({ label: z.string(), text: z.string(), percent: z.number().nullable() })),
  studentAnswer: z.string().nullable(),
  correctAnswer: z.string().nullable(),
  explanation: z.string().nullable(),
  educationalObjective: z.string().nullable(),
  warnings: z.array(z.string()),
});
export type ParsedQuestion = z.infer<typeof ParsedQuestionSchema>;

function normalize(input: string): string {
  return input.replace(/\u00a0/g, " ").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function answerLetter(text: string): string | null {
  const m = text.match(/\b([A-E])\b/i);
  return m ? m[1].toUpperCase() : null;
}

/** Deterministic first pass; never sends source material to an external service. */
export function parseQuestionPaste(input: string, source: string, exam: "step1" | "step2_ck"): ParsedQuestion {
  const raw = normalize(input);
  const warnings: string[] = [];
  const qid = raw.match(/\bQID\s*[:#-]?\s*(\d+)\b/i)?.[1] ?? null;
  const explanationStart = raw.search(/\bExplanation\s*[:\n]/i);
  const preExplanation = explanationStart >= 0 ? raw.slice(0, explanationStart) : raw;
  const afterExplanation = explanationStart >= 0 ? raw.slice(explanationStart).replace(/^Explanation\s*:?\s*/i, "") : "";
  const objectiveMatch = afterExplanation.match(/\bEducational objective\s*:\s*([\s\S]*?)(?=\b\d+ of \d+ flash cards|\bQID\s*\d+|$)/i);
  const educationalObjective = objectiveMatch?.[1].trim() || null;
  const explanation = afterExplanation
    .replace(/\bEducational objective\s*:[\s\S]*$/i, "")
    .replace(/\bQID\s*[:#-]?\s*\d+\s*$/i, "")
    .trim() || null;

  const selectedMatch = preExplanation.match(/\bYour answer\s*:?\s*([A-E])\b/i)
    ?? preExplanation.match(/\b([A-E])\s*Your answer\b/i);
  const correctMatch = preExplanation.match(/\bCorrect answer\s*(?:is|:)?\s*([A-E])\b/i);
  const studentAnswer = selectedMatch ? answerLetter(selectedMatch[1]) : null;
  const correctAnswer = correctMatch ? answerLetter(correctMatch[1]) : null;

  // Prefer choices beginning on separate lines. Compact question-bank copies may
  // concatenate options; the fallback recognizes option letters before choice text.
  const choiceRegion = preExplanation.split(/\bSubmit answer\b|\bIncorrect\.\s*Correct answer\b/i)[0];
  const lineChoices = [...choiceRegion.matchAll(/(?:^|\n)\s*([A-E])[.)\s]+([^\n]+)/g)];
  let choices = lineChoices.map(m => ({ label: m[1], text: m[2].trim(), percent: null as number | null }));
  if (choices.length < 2) {
    const compact = [...choiceRegion.matchAll(/([A-E])(?=[A-Z][a-z]|\d|Your answer)([\s\S]*?)(?=[A-E](?=[A-Z][a-z]|\d|Your answer)|$)/g)];
    if (compact.length >= 2) {
      choices = compact.map(m => ({
        label: m[1],
        text: m[2].replace(/\bYour answer\b/gi, "").replace(/\d+%\s*$/g, "").trim(),
        percent: Number(m[2].match(/(\d+)%\s*$/)?.[1] ?? NaN),
      })).map(c => ({ ...c, percent: Number.isFinite(c.percent) ? c.percent : null }));
    }
  }
  const firstChoice = lineChoices[0]?.index ?? (choices.length ? choiceRegion.search(/\bA[.)\s]|A(?=[A-Z])/): -1);
  const questionText = (firstChoice >= 0 ? choiceRegion.slice(0, firstChoice) : choiceRegion)
    .replace(/\bQID\s*[:#-]?\s*\d+\b/gi, "").trim();

  if (!qid) warnings.push("Question ID not detected");
  if (!correctAnswer) warnings.push("Correct answer not detected");
  if (!explanation) warnings.push("Explanation not detected");
  if (choices.length < 2 || new Set(choices.map(c => c.label)).size !== choices.length)
    warnings.push("Answer choices require manual review");
  if (!questionText) warnings.push("Question text not detected");
  if (correctAnswer && choices.length && !choices.some(c => c.label === correctAnswer))
    warnings.push("Correct answer does not match extracted choices");
  return ParsedQuestionSchema.parse({
    source, exam, qid, questionText, choices, studentAnswer,
    correctAnswer, explanation, educationalObjective, warnings,
  });
}
