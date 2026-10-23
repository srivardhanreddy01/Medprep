import { Bot } from "lucide-react";
import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "AI Tutor" };

export default function TutorPage() {
  return (
    <ComingSoon
      title="AI Tutor: Teach Me to Think"
      icon={Bot}
      description="A Socratic tutor that guides you through a question instead of giving the answer."
      points={[
        "Asks for the key abnormal finding, then the differential, then the discriminating clue",
        "Three assistance levels: minimal hints, guided reasoning, detailed teaching",
        "Reveal the answer at any time; incorrect reasoning is corrected, never falsely validated",
      ]}
    />
  );
}
