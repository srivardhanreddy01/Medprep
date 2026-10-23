import { createEmptyCard, fsrs, FSRSVersion, Rating, State, type Card, type Grade } from "ts-fsrs";

/**
 * Spaced repetition via ts-fsrs (FSRS-6 default parameters). Card state is persisted in
 * review_schedules; every review appends a flashcard_reviews row so parameters can later be
 * optimized from the student's own history.
 */

export const FSRS_VERSION = FSRSVersion;

export interface ScheduleRow {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
}

export type RatingName = "again" | "hard" | "good" | "easy";
export const RATINGS: Record<RatingName, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function scheduler(desiredRetention = 0.9) {
  return fsrs({ request_retention: desiredRetention, enable_fuzz: true, maximum_interval: 3650 });
}

export function rowToCard(row: ScheduleRow): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

export function cardToRow(card: Card): ScheduleRow {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  };
}

export function newScheduleRow(now = new Date()): ScheduleRow {
  return cardToRow(createEmptyCard(now));
}

/** Probability of recall right now (FSRS estimate). Null for cards never reviewed. */
export function retrievability(row: ScheduleRow, now = new Date(), desiredRetention = 0.9): number | null {
  if (row.state === State.New || !row.last_review) return null;
  return scheduler(desiredRetention).get_retrievability(rowToCard(row), now, false);
}

export function review(row: ScheduleRow, rating: RatingName, now = new Date(), desiredRetention = 0.9) {
  const f = scheduler(desiredRetention);
  const before = rowToCard(row);
  const r = retrievability(row, now, desiredRetention);
  const { card, log } = f.next(before, now, RATINGS[rating]);
  return { next: cardToRow(card), log, retrievabilityBefore: r };
}

/** Next due date for each button, shown on the review screen before the student answers. */
export function previewIntervals(row: ScheduleRow, now = new Date(), desiredRetention = 0.9): Record<RatingName, Date> {
  const preview = scheduler(desiredRetention).repeat(rowToCard(row), now);
  return {
    again: preview[Rating.Again].card.due,
    hard: preview[Rating.Hard].card.due,
    good: preview[Rating.Good].card.due,
    easy: preview[Rating.Easy].card.due,
  };
}

export function formatInterval(from: Date, to: Date): string {
  const mins = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 31) return `${days}d`;
  const months = days / 30.4;
  if (months < 12) return `${months.toFixed(months < 3 ? 1 : 0)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

export const STATE_LABELS: Record<number, string> = {
  [State.New]: "New",
  [State.Learning]: "Learning",
  [State.Review]: "Review",
  [State.Relearning]: "Relearning",
};
