import { describe, expect, it } from "vitest";
import { FixtureProvider } from "@/lib/ai/providers/fixture";
import { analysisPrompt } from "@/lib/ai/prompts";
import { AnalysisSchema, FlashcardSetSchema } from "@/lib/ai/schemas";
import { validateAnalysis, validateFlashcards } from "@/lib/ai/validate";
import { SAMPLE_QUESTIONS } from "@/samples/questions";

const sample = SAMPLE_QUESTIONS[0];
const exam = { name: "USMLE Step 2 CK", scope_notes: "x", question_style: "y" };

async function fixtureAnalysis(officialAnswer?: string) {
  const p = new FixtureProvider();
  const res = await p.generateStructured({
    system: "",
    prompt: analysisPrompt({ stem: sample.stem, options: sample.options, exam, officialAnswer }),
    schema: AnalysisSchema,
    schemaName: "analysis",
  });
  return res.data as Record<string, unknown>;
}

describe("validateAnalysis", () => {
  const labels = sample.options.map((o) => o.label);

  it("accepts a complete, consistent analysis", async () => {
    const r = validateAnalysis(await fixtureAnalysis(), { labels });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.option_explanations.map((e) => e.label)).toEqual(labels);
      expect(r.data.option_explanations.filter((e) => e.is_correct).map((e) => e.label)).toEqual(["B"]);
    }
  });

  it("rejects an answer that is not one of the options", async () => {
    const a = await fixtureAnalysis();
    (a.answer as { option: string }).option = "Z";
    const r = validateAnalysis(a, { labels });
    expect(r.ok).toBe(false);
  });

  it("rejects missing option explanations", async () => {
    const a = await fixtureAnalysis();
    a.option_explanations = (a.option_explanations as unknown[]).slice(0, 3);
    const r = validateAnalysis(a, { labels });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues.join()).toMatch(/missing options D, E/);
  });

  it("repairs is_correct flags to match the answer and drops unknown labels", async () => {
    const a = await fixtureAnalysis();
    const ex = a.option_explanations as { label: string; is_correct: boolean }[];
    ex.forEach((e) => (e.is_correct = true));
    ex.push({ ...ex[0], label: "H" });
    const r = validateAnalysis(a, { labels });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.option_explanations.filter((e) => e.is_correct)).toHaveLength(1);
      expect(r.notes.join()).toMatch(/unknown option H/);
    }
  });

  it("flags disagreement with an official key", async () => {
    const r = validateAnalysis(await fixtureAnalysis(), { labels, officialAnswer: "C" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.uncertainty_flags.some((f) => f.kind === "possible_answer_key_error")).toBe(true);
  });

  it("rejects malformed JSON shapes", () => {
    expect(validateAnalysis({ foo: 1 }, { labels }).ok).toBe(false);
  });
});

describe("validateFlashcards", () => {
  const card = (front: string) => ({ card_type: "basic", front, back: "b", explanation: "e", tags: ["Endo Crine"] });

  it("deduplicates within the set and against existing cards", () => {
    const r = validateFlashcards({ cards: [card("What is X?"), card("what  is x?"), card("What is Y?"), card("Existing card")] }, [
      "existing CARD",
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.map((c) => c.front)).toEqual(["What is X?", "What is Y?"]);
      expect(r.data[0].tags).toEqual(["endo-crine"]);
    }
  });

  it("caps at 8 cards", () => {
    const r = validateFlashcards({ cards: Array.from({ length: 12 }, (_, i) => card(`Card number ${i}`)) }, []);
    expect(r.ok && r.data.length).toBe(8);
  });

  it("fails when nothing usable remains", () => {
    expect(validateFlashcards({ cards: [card("Existing card")] }, ["existing card"]).ok).toBe(false);
  });

  it("schema accepts the fixture card set", async () => {
    const p = new FixtureProvider();
    const res = await p.generateStructured({ system: "", prompt: "PTH 98 pg/mL", schema: FlashcardSetSchema, schemaName: "flashcards" });
    expect(FlashcardSetSchema.safeParse(res.data).success).toBe(true);
  });
});
