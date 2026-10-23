import { describe, expect, it } from "vitest";
import { canonicalQuestion, contentHash, parseQuestionText } from "@/lib/questions/parse";

describe("parseQuestionText", () => {
  it("splits stem and A-E options in common formats", () => {
    const raw = `A 30-year-old man has chest pain.
Which is the most likely diagnosis?
A. Pericarditis
B) Aortic dissection
(C) Myocardial infarction
D: Pulmonary embolism
E - Costochondritis`;
    const p = parseQuestionText(raw);
    expect(p.stem).toBe("A 30-year-old man has chest pain.\nWhich is the most likely diagnosis?");
    expect(p.options.map((o) => o.label)).toEqual(["A", "B", "C", "D", "E"]);
    expect(p.options[2].text).toBe("Myocardial infarction");
    expect(p.options[4].text).toBe("Costochondritis");
  });

  it("does not treat a sentence starting with 'A' in the stem as an option", () => {
    const raw = `A. fumigatus was isolated earlier.
A 40-year-old woman has cough.
Which drug?
A. Voriconazole
B. Fluconazole`;
    const p = parseQuestionText(raw);
    expect(p.stem).toContain("A. fumigatus was isolated earlier.");
    expect(p.options).toHaveLength(2);
  });

  it("extracts an answer line without mixing it into options", () => {
    const p = parseQuestionText("Stem text here that is long enough?\nA. One\nB. Two\nC. Three\nAnswer: C");
    expect(p.options).toHaveLength(3);
    expect(p.answerHint).toBe("C");
    expect(p.options[2].text).toBe("Three");
  });

  it("joins wrapped option lines", () => {
    const p = parseQuestionText("Stem?\nA. First line\ncontinues here\nB. Second");
    expect(p.options[0].text).toBe("First line continues here");
  });

  it("returns no options when none are found", () => {
    const p = parseQuestionText("Only a stem without choices.");
    expect(p.options).toEqual([]);
    expect(p.stem).toBe("Only a stem without choices.");
  });

  it("supports more than five options", () => {
    const opts = "ABCDEFG".split("").map((l) => `${l}. Option ${l}`).join("\n");
    expect(parseQuestionText(`Stem?\n${opts}`).options).toHaveLength(7);
  });
});

describe("contentHash", () => {
  it("ignores whitespace and case differences", async () => {
    const a = await contentHash("A  patient  has FEVER.", [{ text: "Flu" }]);
    const b = await contentHash("a patient has fever.", [{ text: " flu " }]);
    expect(a).toBe(b);
    expect(canonicalQuestion("X", [{ text: "Y" }])).toBe("x||y");
  });
  it("differs when options differ", async () => {
    expect(await contentHash("Stem", [{ text: "A" }])).not.toBe(await contentHash("Stem", [{ text: "B" }]));
  });
});
