"use client";
import { Bot, Pencil, Trash2, UserPen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteNote, saveAiNoteAsMine } from "@/app/(app)/notebook/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { NoteForm } from "./note-form";

export interface NoteRow {
  id: string;
  title: string;
  body: string;
  note_type: string;
  origin: string;
  tags: string[];
  topic_id: number | null;
  parent_id: string | null;
  question_id: string | null;
  updated_at: string;
}

const TYPE_LABEL: Record<string, string> = { note: "Note", pearl: "Clinical pearl", mnemonic: "Mnemonic", summary: "Summary", highlight: "Highlight" };

export function NoteCard({
  note,
  topics,
  parents,
  showQuestionLink,
}: {
  note: NoteRow;
  topics: { id: number; name: string }[];
  parents?: { id: string; title: string }[];
  showQuestionLink?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ai = note.origin === "ai";
  return (
    <article className={cn("rounded-lg border p-4", ai ? "border-ai/30 bg-ai-soft/60" : "bg-card")}>
      {editing ? (
        <NoteForm topics={topics} parents={parents} questionId={note.question_id ?? undefined} values={note} onSaved={() => setEditing(false)} />
      ) : (
        <>
          <header className="mb-2 flex flex-wrap items-center gap-2">
            {ai ? (
              <Badge variant="ai">
                <Bot className="size-3" aria-hidden /> AI-generated
              </Badge>
            ) : (
              <Badge variant="secondary">
                <UserPen className="size-3" aria-hidden /> My note
              </Badge>
            )}
            <Badge variant="outline">{TYPE_LABEL[note.note_type] ?? note.note_type}</Badge>
            <h4 className="flex-1 font-medium">{note.title}</h4>
            <time className="text-xs text-muted-foreground">{formatDate(note.updated_at)}</time>
          </header>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{note.body}</p>
          {note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  #{t}
                </Badge>
              ))}
            </div>
          )}
          <footer className="mt-3 flex flex-wrap items-center gap-1">
            {showQuestionLink && note.question_id && (
              <Link href={`/questions/${note.question_id}?tab=notes`} className="mr-auto text-xs text-primary underline">
                Linked question
              </Link>
            )}
            {ai ? (
              <form action={saveAiNoteAsMine}>
                <input type="hidden" name="id" value={note.id} />
                <Button type="submit" size="sm" variant="ghost">
                  <UserPen /> Save a copy as my note
                </Button>
              </form>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </Button>
            )}
            <form action={deleteNote}>
              <input type="hidden" name="id" value={note.id} />
              <Button type="submit" size="sm" variant="ghost" aria-label={`Delete note ${note.title}`}>
                <Trash2 /> Delete
              </Button>
            </form>
          </footer>
        </>
      )}
    </article>
  );
}
