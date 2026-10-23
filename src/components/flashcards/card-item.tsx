"use client";
import { Bot, Pause, Pencil, Play, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteCard, toggleSuspend } from "@/app/(app)/flashcards/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { CardForm, type CardValues } from "./card-form";

export interface CardRow extends CardValues {
  id: string;
  front: string;
  back: string;
  card_type: string;
  origin: string;
  suspended: boolean;
  question_id: string | null;
  tags: string[];
  schedule: { due: string; state: number; reps: number; lapses: number } | null;
}

const TYPE: Record<string, string> = { basic: "Recall", clinical: "Clinical", differential: "Differential", cloze: "Cloze", image: "Image" };
const STATE: Record<number, string> = { 0: "New", 1: "Learning", 2: "Review", 3: "Relearning" };

export function CardItem({
  card,
  decks,
  topics,
}: {
  card: CardRow;
  decks: { id: string; name: string; is_default: boolean }[];
  topics: { id: number; name: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [showBack, setShowBack] = useState(false);
  if (editing) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <CardForm decks={decks} topics={topics} values={card} onSaved={() => setEditing(false)} />
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }
  return (
    <article className="rounded-lg border bg-card p-4" aria-label="Flashcard">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline">{TYPE[card.card_type] ?? card.card_type}</Badge>
        {card.origin === "ai" && (
          <Badge variant="ai">
            <Bot className="size-3" aria-hidden /> AI
          </Badge>
        )}
        {card.suspended && <Badge variant="warning">Suspended</Badge>}
        {card.schedule && (
          <span className="ml-auto text-xs text-muted-foreground">
            {STATE[card.schedule.state]} · due {formatDate(card.schedule.due, { dateStyle: "medium" })}
            {card.schedule.lapses > 0 && ` · ${card.schedule.lapses} lapses`}
          </span>
        )}
      </div>
      <p className="font-medium">{card.front}</p>
      <button type="button" className="mt-2 text-xs text-primary underline" onClick={() => setShowBack((s) => !s)} aria-expanded={showBack}>
        {showBack ? "Hide answer" : "Show answer"}
      </button>
      {showBack && (
        <div className="mt-2 space-y-1 border-t pt-2 text-sm">
          <p>{card.back}</p>
          {card.explanation && <p className="text-muted-foreground">{card.explanation}</p>}
          {card.personal_note && <p className="rounded bg-muted px-2 py-1 text-xs">My note: {card.personal_note}</p>}
        </div>
      )}
      {card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((t) => (
            <Badge key={t} variant="secondary">
              #{t}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {card.question_id && (
          <Link href={`/questions/${card.question_id}`} className="mr-auto text-xs text-primary underline">
            Source question
          </Link>
        )}
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil /> Edit
        </Button>
        <form action={toggleSuspend}>
          <input type="hidden" name="id" value={card.id} />
          <Button type="submit" size="sm" variant="ghost">
            {card.suspended ? <Play /> : <Pause />} {card.suspended ? "Resume" : "Suspend"}
          </Button>
        </form>
        <form action={deleteCard}>
          <input type="hidden" name="id" value={card.id} />
          <Button type="submit" size="sm" variant="ghost">
            <Trash2 /> Delete
          </Button>
        </form>
      </div>
    </article>
  );
}
