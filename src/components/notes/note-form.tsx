"use client";
import { useActionState, useEffect, useRef } from "react";
import { saveNote, type NoteState } from "@/app/(app)/notebook/actions";
import { Alert } from "@/components/ui/alert";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export interface NoteValues {
  id?: string;
  title?: string;
  body?: string;
  note_type?: string;
  topic_id?: number | null;
  parent_id?: string | null;
  tags?: string[];
}

export function NoteForm({
  questionId,
  topics,
  parents = [],
  values = {},
  onSaved,
  compact,
}: {
  questionId?: string;
  topics: { id: number; name: string }[];
  parents?: { id: string; title: string }[];
  values?: NoteValues;
  onSaved?: () => void;
  compact?: boolean;
}) {
  const [state, action] = useActionState<NoteState, FormData>(saveNote, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.saved) {
      if (!values.id) ref.current?.reset();
      onSaved?.();
    }
  }, [state, values.id, onSaved]);
  const p = values.id ? `note-${values.id}` : "note-new";
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="id" value={values.id ?? ""} />
      <input type="hidden" name="question_id" value={questionId ?? ""} />
      <div className="space-y-1.5">
        <Label htmlFor={`${p}-title`}>Title</Label>
        <Input id={`${p}-title`} name="title" defaultValue={values.title} required maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${p}-body`}>Note</Label>
        <Textarea id={`${p}-body`} name="body" rows={compact ? 4 : 8} defaultValue={values.body} maxLength={20000} placeholder="Your own words stick better than copied text." />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-type`}>Type</Label>
          <Select id={`${p}-type`} name="note_type" defaultValue={values.note_type ?? "note"}>
            <option value="note">Note</option>
            <option value="pearl">Clinical pearl</option>
            <option value="mnemonic">Mnemonic</option>
            <option value="highlight">Highlight</option>
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
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-tags`}>Tags</Label>
          <Input id={`${p}-tags`} name="tags" defaultValue={values.tags?.join(", ")} placeholder="comma, separated" />
        </div>
      </div>
      {parents.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor={`${p}-parent`}>Nest under</Label>
          <Select id={`${p}-parent`} name="parent_id" defaultValue={values.parent_id ?? ""}>
            <option value="">Top level</option>
            {parents
              .filter((x) => x.id !== values.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.title}
                </option>
              ))}
          </Select>
        </div>
      )}
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      <SubmitButton size="sm" pendingText="Saving…">{values.id ? "Save changes" : "Add note"}</SubmitButton>
    </form>
  );
}
