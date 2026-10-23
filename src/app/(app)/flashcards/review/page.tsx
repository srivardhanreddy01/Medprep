import { ReviewSession, type ReviewCard } from "@/components/flashcards/review-session";
import { PageHeader } from "@/components/layout/page-header";
import { getSettings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Review flashcards" };

export default async function ReviewPage({ searchParams }: PageProps<"/flashcards/review">) {
  const { deck } = await searchParams;
  const { supabase, user } = await requireUser();
  const { prefs } = await getSettings(supabase, user.id);
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const base = () => {
    let q = supabase
      .from("review_schedules")
      .select("*, flashcards!inner(id, front, back, explanation, personal_note, card_type, tags, question_id, suspended, deck_id)")
      .eq("flashcards.suspended", false);
    if (typeof deck === "string" && deck) q = q.eq("flashcards.deck_id", deck);
    return q;
  };

  const [{ data: due }, { count: newToday }] = await Promise.all([
    base().lte("due", now.toISOString()).neq("state", 0).order("due").limit(300),
    supabase.from("flashcard_reviews").select("id", { count: "exact", head: true }).eq("state_before", 0).gte("reviewed_at", startOfDay.toISOString()),
  ]);
  const newLimit = Math.max(0, prefs.max_new_cards_per_day - (newToday ?? 0));
  const { data: fresh } = newLimit ? await base().eq("state", 0).order("due").limit(newLimit) : { data: [] };

  const toCard = (r: NonNullable<typeof due>[number]): ReviewCard => ({
    id: r.flashcard_id,
    front: r.flashcards.front,
    back: r.flashcards.back,
    explanation: r.flashcards.explanation,
    personalNote: r.flashcards.personal_note,
    type: r.flashcards.card_type,
    tags: r.flashcards.tags,
    questionId: r.flashcards.question_id,
    schedule: {
      due: r.due,
      stability: r.stability,
      difficulty: r.difficulty,
      elapsed_days: r.elapsed_days,
      scheduled_days: r.scheduled_days,
      learning_steps: r.learning_steps,
      reps: r.reps,
      lapses: r.lapses,
      state: r.state,
      last_review: r.last_review,
    },
  });
  // Due reviews first (most overdue first), then new cards.
  const queue = [...(due ?? []).map(toCard), ...(fresh ?? []).map(toCard)];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Review" description={`${due?.length ?? 0} due · ${fresh?.length ?? 0} new (limit ${prefs.max_new_cards_per_day}/day)`} />
      <ReviewSession cards={queue} retention={Number(prefs.desired_retention)} />
    </div>
  );
}
