import { Stethoscope } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Clinical Cases" };

export default function CasesPage() {
  return (
    <ComingSoon
      title="Clinical Cases"
      icon={Stethoscope}
      description="Practice vignettes generated from the concepts in your question bank."
      points={[
        "Beginner, intermediate, and advanced cases for each analyzed concept",
        "Genuinely different presentations, not the same case with a new age or name",
        "Answer before the solution is revealed; performance tracked separately from your original questions",
      ]}
    />
  );
}
