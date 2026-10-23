"use client";
import { AlertTriangle, CheckCircle2, Keyboard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { recordReview } from "@/app/(app)/flashcards/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatInterval, previewIntervals, type RatingName, type ScheduleRow } from "@/lib/srs/fsrs";
import { cn } from "@/lib/utils";

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  explanation: string | null;
  personalNote: string | null;
  type: string;
  tags: string[];
  questionId: string | null;
  schedule: ScheduleRow;
}

const BUTTONS: { rating: RatingName; label: string; key: string; className: string }[] = [
  { rating: "again", label: "Again", key: "1", className: "border-destructive/50 hover:bg-destructive-soft" },
  { rating: "hard", label: "Hard", key: "2", className: "border-warning/50 hover:bg-warning-soft" },
  { rating: "good", label: "Good", key: "3", className: "border-success/50 hover:bg-success-soft" },
  { rating: "easy", label: "Easy", key: "4", className: "border-accent/50 hover:bg-accent-soft" },
];

/** Renders cloze blanks as highlighted gaps on the front. */
function Front({ text }: { text: string }) {
  const parts = text.split(/(_{3,})/);
  return (
    <>
      {parts.map((p, i) =>
        /^_{3,}$/.test(p) ? (
          <span key={i} className="mx-1 inline-block min-w-12 rounded bg-primary-soft px-2 text-primary">
            ?
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function ReviewSession({ cards, retention }: { cards: ReviewCard[]; retention: number }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  const card = queue[0];

  const preview = useMemo(() => (card ? previewIntervals(card.schedule, new Date(), retention) : null), [card, retention]);

  const rate = useCallback(
    (rating: RatingName) => {
      if (!card || pending) return;
      setError(null);
      start(async () => {
        const res = await recordReview({ flashcard_id: card.id, rating, duration_ms: Date.now() - shownAt.current });
        if (!res.ok) return setError(res.error);
        setDone((d) => d + 1);
        setFlipped(false);
        shownAt.current = Date.now();
        // Cards due again within this session (learning steps) go back to the end of the queue.
        setQueue((q) => {
          const rest = q.slice(1);
          return new Date(res.next.due).getTime() - Date.now() < 20 * 60_000 ? [...rest, { ...card, schedule: res.next }] : rest;
        });
      });
    },
    [card, pending],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped(true);
      }
      if (flipped) {
        const b = BUTTONS.find((x) => x.key === e.key);
        if (b) rate(b.rating);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, rate]);

  if (!card) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <h2 className="text-lg font-semibold">{done ? `Session complete: ${done} reviews` : "Nothing due right now"}</h2>
        <p className="text-sm text-muted-foreground">Your next reviews are on the study calendar.</p>
        <div className="flex gap-2">
          <Link href="/calendar" className={buttonVariants({ variant: "outline" })}>Study calendar</Link>
          <Link href="/dashboard" className={buttonVariants()}>Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{queue.length} remaining · {done} done</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Keyboard className="size-4" aria-hidden /> Space to flip, 1–4 to rate
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="h-full bg-primary transition-all" style={{ width: `${(100 * done) / Math.max(1, done + queue.length)}%` }} />
      </div>

      {card.schedule.lapses >= 3 && (
        <Alert variant="warning">
          <AlertTriangle />
          <p>
            You have forgotten this card {card.schedule.lapses} times. Rewriting it in your own words or revisiting the explanation usually helps
            more than another review.
            {card.questionId && (
              <>
                {" "}
                <Link className="underline" href={`/questions/${card.questionId}?tab=reasoning`}>Revisit the source question</Link>.
              </>
            )}
          </p>
        </Alert>
      )}

      <div className="flip-card" data-flipped={flipped}>
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Card back. Click to show front." : "Card front. Click to reveal answer."}
          className="flip-card-inner relative grid min-h-72 w-full cursor-pointer text-left"
        >
          <div className="flip-face col-start-1 row-start-1 flex flex-col rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex gap-1.5">
              <Badge variant="outline">{card.type}</Badge>
              {card.schedule.state === 0 && <Badge variant="accent">New</Badge>}
            </div>
            <p className="my-auto text-lg leading-relaxed">
              <Front text={card.front} />
            </p>
            <p className="mt-6 text-center text-xs text-muted-foreground">Recall the answer, then click or press Space</p>
          </div>
          <div className="flip-face flip-back col-start-1 row-start-1 flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm" aria-hidden={!flipped}>
            <p className="text-sm text-muted-foreground">{card.front}</p>
            <p className="text-lg font-medium leading-relaxed">{card.back}</p>
            {card.explanation && <p className="text-sm text-muted-foreground">{card.explanation}</p>}
            {card.personalNote && <p className="rounded bg-muted px-2 py-1 text-sm">My note: {card.personalNote}</p>}
            {card.tags.length > 0 && <p className="mt-auto text-xs text-muted-foreground">{card.tags.map((t) => `#${t}`).join(" ")}</p>}
          </div>
        </button>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {flipped ? (
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Rate your recall">
          {BUTTONS.map((b) => (
            <Button key={b.rating} variant="outline" className={cn("h-auto flex-col py-2", b.className)} disabled={pending} onClick={() => rate(b.rating)}>
              <span className="font-semibold">{b.label}</span>
              <span className="text-xs text-muted-foreground">{preview ? formatInterval(new Date(), preview[b.rating]) : ""}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button className="w-full" size="lg" onClick={() => setFlipped(true)}>
          Show answer
        </Button>
      )}
      {pending && (
        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Saving review
        </p>
      )}
    </div>
  );
}
