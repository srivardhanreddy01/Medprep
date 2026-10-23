"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { newScheduleRow, review, type RatingName, type ScheduleRow } from "@/lib/srs/fsrs";
import { requireUser } from "@/lib/supabase/server";

export type CardState = { error?: string; saved?: boolean } | undefined;

const tagList = (raw: FormDataEntryValue | null) =>
  String(raw ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 12);

const CardInput = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  deck_id: z.uuid("Pick a deck"),
  card_type: z.enum(["basic", "clinical", "differential", "cloze"]),
  front: z.string().trim().min(1, "Front is required").max(2000),
  back: z.string().trim().min(1, "Back is required").max(4000),
  explanation: z.string().trim().max(4000),
  personal_note: z.string().trim().max(4000),
  topic_id: z.union([z.literal(""), z.coerce.number().int().positive()]),
});

export async function saveCard(_: CardState, form: FormData): Promise<CardState> {
  const parsed = CardInput.safeParse({
    id: form.get("id") ?? "",
    deck_id: form.get("deck_id"),
    card_type: form.get("card_type") ?? "basic",
    front: form.get("front"),
    back: form.get("back"),
    explanation: form.get("explanation") ?? "",
    personal_note: form.get("personal_note") ?? "",
    topic_id: form.get("topic_id") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, user } = await requireUser();
  const row = {
    deck_id: v.deck_id,
    card_type: v.card_type,
    front: v.front,
    back: v.back,
    explanation: v.explanation || null,
    personal_note: v.personal_note || null,
    topic_id: v.topic_id || null,
    tags: tagList(form.get("tags")),
  };
  if (v.id) {
    const { error } = await supabase.from("flashcards").update(row).eq("id", v.id);
    if (error) return { error: error.code === "23505" ? "You already have a card with this front." : error.message };
  } else {
    const { data, error } = await supabase.from("flashcards").insert({ ...row, user_id: user.id, origin: "user" }).select("id").single();
    if (error) return { error: error.code === "23505" ? "You already have a card with this front." : error.message };
    await supabase.from("review_schedules").insert({ flashcard_id: data.id, user_id: user.id, ...newScheduleRow() });
  }
  revalidatePath("/flashcards");
  return { saved: true };
}

export async function deleteCard(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  await supabase.from("flashcards").delete().eq("id", id);
  revalidatePath("/flashcards");
}

export async function toggleSuspend(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  const { data } = await supabase.from("flashcards").select("suspended").eq("id", id).single();
  if (data) await supabase.from("flashcards").update({ suspended: !data.suspended }).eq("id", id);
  revalidatePath("/flashcards");
}

export async function createDeck(_: CardState, form: FormData): Promise<CardState> {
  const name = z.string().trim().min(1, "Name the deck").max(100).safeParse(form.get("name"));
  if (!name.success) return { error: name.error.issues[0].message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("flashcard_decks").insert({ user_id: user.id, name: name.data, description: String(form.get("description") ?? "").slice(0, 500) || null });
  if (error) return { error: error.code === "23505" ? "A deck with that name exists." : error.message };
  revalidatePath("/flashcards");
  return { saved: true };
}

export async function deleteDeck(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  // The default deck cannot be deleted; its cards would have nowhere to go.
  await supabase.from("flashcard_decks").delete().eq("id", id).eq("is_default", false);
  revalidatePath("/flashcards");
}

const Review = z.object({
  flashcard_id: z.uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  duration_ms: z.coerce.number().int().min(0).max(3_600_000).optional(),
});

export type ReviewResult = { ok: true; next: ScheduleRow } | { ok: false; error: string };

/** Records a review: computes the next FSRS state, appends the review log, updates the schedule. */
export async function recordReview(input: { flashcard_id: string; rating: RatingName; duration_ms?: number }): Promise<ReviewResult> {
  const parsed = Review.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid review" };
  const v = parsed.data;
  const { supabase, user } = await requireUser();
  const [{ data: sched }, { data: prefs }] = await Promise.all([
    supabase.from("review_schedules").select("*").eq("flashcard_id", v.flashcard_id).single(),
    supabase.from("study_preferences").select("desired_retention").eq("user_id", user.id).single(),
  ]);
  if (!sched) return { ok: false, error: "Card not found" };
  const now = new Date();
  const { next, retrievabilityBefore } = review(sched as ScheduleRow, v.rating, now, Number(prefs?.desired_retention ?? 0.9));

  // Optimistic concurrency: only apply if the schedule has not changed since it was read.
  const { data: updated, error } = await supabase
    .from("review_schedules")
    .update(next)
    .eq("flashcard_id", v.flashcard_id)
    .eq("updated_at", sched.updated_at)
    .select("flashcard_id");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length) return { ok: false, error: "This card was reviewed elsewhere. Reload to continue." };

  await supabase.from("flashcard_reviews").insert({
    user_id: user.id,
    flashcard_id: v.flashcard_id,
    rating: { again: 1, hard: 2, good: 3, easy: 4 }[v.rating],
    state_before: sched.state,
    due_before: sched.due,
    stability_after: next.stability,
    difficulty_after: next.difficulty,
    scheduled_days: next.scheduled_days,
    next_due: next.due,
    retrievability_before: retrievabilityBefore,
    duration_ms: v.duration_ms ?? null,
    reviewed_at: now.toISOString(),
  });
  // No revalidatePath here: it would refresh the review page mid-session. Pages are dynamic and re-fetch on navigation.
  return { ok: true, next };
}
