/**
 * Screens question text for patient identifiers before it is stored or sent to an AI provider.
 * "block" findings must be removed; "warn" findings need the student's confirmation.
 * This is a safety net, not a de-identification guarantee.
 */
export interface IdentifierFinding {
  kind: "email" | "phone" | "mrn" | "ssn" | "nhs_number" | "aadhaar" | "date" | "name_label" | "address";
  severity: "block" | "warn";
  match: string;
}

const RULES: { kind: IdentifierFinding["kind"]; severity: IdentifierFinding["severity"]; re: RegExp }[] = [
  { kind: "email", severity: "block", re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  { kind: "ssn", severity: "block", re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { kind: "mrn", severity: "block", re: /\b(?:MRN|medical record(?: number| no\.?)?|patient id|hospital (?:no|number))\s*[:#]?\s*[A-Z0-9-]{4,}\b/gi },
  { kind: "nhs_number", severity: "block", re: /\bNHS(?: number| no\.?)?\s*[:#]?\s*\d{3}\s?\d{3}\s?\d{4}\b/gi },
  { kind: "aadhaar", severity: "block", re: /\b\d{4}\s\d{4}\s\d{4}\b/g },
  { kind: "phone", severity: "block", re: /(?:\+\d{1,3}[\s-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g },
  { kind: "name_label", severity: "block", re: /\b(?:patient name|name of patient|pt name)\s*[:-]\s*\S+/gi },
  { kind: "date", severity: "warn", re: /\b(?:DOB|date of birth|born on)\b[^\n]{0,20}/gi },
  {
    kind: "date",
    severity: "warn",
    re: /\b(?:\d{1,2}[/-]\d{1,2}[/-](?:19|20)\d{2}|(?:19|20)\d{2}-\d{2}-\d{2})\b/g,
  },
  { kind: "address", severity: "warn", re: /\b\d{1,5}\s+\w+(?:\s\w+)?\s(?:street|st\.|avenue|ave\.|road|rd\.|lane|drive|dr\.)\b/gi },
];

export function screenForIdentifiers(text: string): IdentifierFinding[] {
  const findings: IdentifierFinding[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const key = `${rule.kind}:${m[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ kind: rule.kind, severity: rule.severity, match: m[0].trim() });
    }
  }
  return findings;
}

export const IDENTIFIER_LABELS: Record<IdentifierFinding["kind"], string> = {
  email: "email address",
  phone: "phone number",
  mrn: "medical record number",
  ssn: "social security number",
  nhs_number: "NHS number",
  aadhaar: "national ID number",
  date: "date that may be a date of birth or visit date",
  name_label: "patient name",
  address: "street address",
};
