import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Full JSON export of the student's own data (all queries run under RLS). */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tables = ["profiles", "study_preferences", "questions", "question_attempts", "ai_analyses", "flashcard_decks", "flashcards", "review_schedules", "flashcard_reviews", "notes", "user_feedback"] as const;
  const out: Record<string, unknown> = { exported_at: new Date().toISOString() };
  for (const t of tables) {
    const { data } = await supabase.from(t).select("*").limit(50000);
    out[t] = data ?? [];
  }
  const { data: choices } = await supabase.from("answer_choices").select("*").limit(100000);
  out.answer_choices = choices ?? [];
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="medprep-export.json"`,
      "Cache-Control": "no-store",
    },
  });
}
