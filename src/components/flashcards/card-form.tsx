"use client";
import { useActionState, useEffect, useRef } from "react";
import { saveCard, type CardState } from "@/app/(app)/flashcards/actions";
import { Alert } from "@/components/ui/alert";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export interface CardValues {
  id?: string;
  deck_id?: string;
  card_type?: string;
  front?: string;
  back?: string;
  explanation?: string | null;
  personal_note?: string | null;
  topic_id?: number | null;
  tags?: string[];
}

export function CardForm({
  decks,
  topics,
  values = {},
  onSaved,
}: {
  decks: { id: string; name: string; is_default: boolean }[];
  topics: { id: number; name: string }[];
  values?: CardValues;
  onSaved?: () => void;
}) {
  const [state, action] = useActionState<CardState, FormData>(saveCard, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.saved) {
      if (!values.id) ref.current?.reset();
      onSaved?.();
    }
  }, [state, values.id, onSaved]);
  const p = values.id ? `card-${values.id}` : "card-new";
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="id" value={values.id ?? ""} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-deck`}>Deck</Label>
          <Select id={`${p}-deck`} name="deck_id" defaultValue={values.deck_id ?? decks.find((d) => d.is_default)?.id}>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-type`}>Format</Label>
          <Select id={`${p}-type`} name="card_type" defaultValue={values.card_type ?? "basic"}>
            <option value="basic">Basic recall</option>
            <option value="clinical">Clinical application</option>
            <option value="differential">Differential</option>
            <option value="cloze">Cloze (use ____ for blanks)</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-topic`}>Subject</Label>
          <Select id={`${p}-topic`} name="topic_id" defaultValue={values.topic_id ?? ""}>
            <option value="">Unsorted</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${p}-front`}>Front</Label>
        <Textarea id={`${p}-front`} name="front" rows={2} required maxLength={2000} defaultValue={values.front} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${p}-back`}>Back</Label>
        <Textarea id={`${p}-back`} name="back" rows={2} required maxLength={4000} defaultValue={values.back} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-expl`}>Explanation</Label>
          <Textarea id={`${p}-expl`} name="explanation" rows={2} maxLength={4000} defaultValue={values.explanation ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-note`}>Personal note</Label>
          <Textarea id={`${p}-note`} name="personal_note" rows={2} maxLength={4000} defaultValue={values.personal_note ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${p}-tags`}>Tags</Label>
        <Input id={`${p}-tags`} name="tags" defaultValue={values.tags?.join(", ")} placeholder="cardiology, heart-failure" />
      </div>
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      {state?.saved && !values.id && <Alert variant="success">Card added and scheduled for review.</Alert>}
      <SubmitButton size="sm" pendingText="Saving…">{values.id ? "Save card" : "Add card"}</SubmitButton>
    </form>
  );
}
