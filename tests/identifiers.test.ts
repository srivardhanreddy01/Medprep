import { describe, expect, it } from "vitest";
import { screenForIdentifiers } from "@/lib/questions/identifiers";
import { SAMPLE_QUESTIONS } from "@/samples/questions";

describe("screenForIdentifiers", () => {
  it("blocks emails, phone numbers, MRNs and SSNs", () => {
    const f = screenForIdentifiers("Contact jane.doe@example.com or 555-123-4567. MRN: 00123456. SSN 123-45-6789.");
    const kinds = f.map((x) => x.kind);
    expect(kinds).toEqual(expect.arrayContaining(["email", "phone", "mrn", "ssn"]));
    expect(f.every((x) => x.severity === "block")).toBe(true);
  });
  it("warns on dates of birth", () => {
    const f = screenForIdentifiers("DOB 03/14/1961, presented with fever.");
    expect(f.some((x) => x.kind === "date" && x.severity === "warn")).toBe(true);
  });
  it("does not flag ordinary vignette content such as labs and vitals", () => {
    for (const q of SAMPLE_QUESTIONS) {
      const text = q.stem + q.options.map((o) => o.text).join(" ");
      expect(screenForIdentifiers(text)).toEqual([]);
    }
  });
});
