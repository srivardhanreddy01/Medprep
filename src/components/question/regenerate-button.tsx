"use client";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { regenerate, type ActionState } from "@/app/(app)/questions/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function Inner({ label, kind }: { label: string; kind: "analysis" | "flashcards" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={kind === "flashcards" ? "default" : "outline"} size="sm" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : kind === "analysis" ? <RefreshCw /> : <Sparkles />}
      {pending ? "Generating…" : label}
    </Button>
  );
}

export function RegenerateButton({ questionId, kind, label }: { questionId: string; kind: "analysis" | "flashcards"; label: string }) {
  const [state, action] = useActionState<ActionState, FormData>(regenerate, undefined);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="kind" value={kind} />
      <Inner label={label} kind={kind} />
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      {state?.message && <Alert variant="success">{state.message}</Alert>}
    </form>
  );
}
