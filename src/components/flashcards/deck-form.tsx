"use client";
import { useActionState } from "react";
import { createDeck, type CardState } from "@/app/(app)/flashcards/actions";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeckForm() {
  const [state, action] = useActionState<CardState, FormData>(createDeck, undefined);
  return (
    <form action={action} className="space-y-2">
      <Input name="name" placeholder="New deck name" aria-label="New deck name" maxLength={100} required />
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      <SubmitButton size="sm" variant="outline" className="w-full" pendingText="Creating…">Create deck</SubmitButton>
    </form>
  );
}
