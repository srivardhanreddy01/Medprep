"use client";
import { Flag } from "lucide-react";
import { useActionState } from "react";
import { reportIssue, type ActionState } from "@/app/(app)/questions/actions";
import { Alert } from "@/components/ui/alert";
import { Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReportIssue({ questionId, analysisId }: { questionId: string; analysisId?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(reportIssue, undefined);
  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
        <Flag className="size-4" aria-hidden /> Report an issue with this explanation
      </summary>
      <form action={action} className="space-y-3 border-t p-3">
        <input type="hidden" name="question_id" value={questionId} />
        <input type="hidden" name="analysis_id" value={analysisId ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="report-kind">Problem</Label>
            <Select id="report-kind" name="kind" defaultValue="incorrect">
              <option value="incorrect">Medically incorrect</option>
              <option value="outdated">Outdated</option>
              <option value="unclear">Unclear</option>
              <option value="ambiguous_question">Question itself is ambiguous</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-section">Section</Label>
            <Select id="report-section" name="section" defaultValue="answer">
              <option value="answer">Answer</option>
              <option value="reasoning">Clinical reasoning</option>
              <option value="options">Wrong options</option>
              <option value="strategy">Exam strategy</option>
              <option value="flashcards">Flashcards</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-message">What is wrong?</Label>
          <Textarea id="report-message" name="message" rows={3} maxLength={4000} required />
        </div>
        {state?.error && <Alert variant="destructive">{state.error}</Alert>}
        {state?.message && <Alert variant="success">{state.message}</Alert>}
        <SubmitButton size="sm" pendingText="Sending…">Submit report</SubmitButton>
      </form>
    </details>
  );
}
