import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Row-level security checks against a real Supabase instance (local: `npx supabase start`).
 * Skipped unless SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY are set.
 */
const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_ANON_KEY;

async function newUser(tag: string) {
  const c = createClient<Database>(url!, key!, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signUp({ email: `rls-${tag}-${Date.now()}@example.com`, password: "password-123456" });
  if (error || !data.user) throw error ?? new Error("signup failed");
  return { c, id: data.user.id };
}

describe.skipIf(!url || !key)("row-level security", () => {
  let a: { c: SupabaseClient<Database>; id: string };
  let b: { c: SupabaseClient<Database>; id: string };
  let questionId: string;
  let deckId: string;
  let attemptId: string;

  beforeAll(async () => {
    a = await newUser("a");
    b = await newUser("b");
    const { data: q, error } = await a.c
      .from("questions")
      .insert({ user_id: a.id, exam_profile_id: "usmle-step1", stem: "A private question stem that is long enough.", content_hash: `h-${Date.now()}` })
      .select("id")
      .single();
    if (error) throw error;
    questionId = q.id;
    await a.c.from("answer_choices").insert([
      { question_id: q.id, label: "A", text: "One", position: 0 },
      { question_id: q.id, label: "B", text: "Two", position: 1 },
    ]);
    const { data: att } = await a.c
      .from("question_attempts")
      .insert({ user_id: a.id, question_id: q.id, selected_label: "A", is_correct: true, graded_against: "official" })
      .select("id")
      .single();
    attemptId = att!.id;
    const { data: deck } = await a.c.from("flashcard_decks").select("id").eq("is_default", true).single();
    deckId = deck!.id;
  });

  it("creates profile, preferences and a default deck on signup", async () => {
    const { data: p } = await a.c.from("profiles").select("id").single();
    const { data: s } = await a.c.from("study_preferences").select("desired_retention").single();
    expect(p?.id).toBe(a.id);
    expect(Number(s?.desired_retention)).toBe(0.9);
    expect(deckId).toBeTruthy();
  });

  it("hides another user's questions, choices, and attempts", async () => {
    expect((await b.c.from("questions").select("id").eq("id", questionId)).data).toEqual([]);
    expect((await b.c.from("answer_choices").select("id").eq("question_id", questionId)).data).toEqual([]);
    expect((await b.c.from("question_attempts").select("id").eq("question_id", questionId)).data).toEqual([]);
  });

  it("prevents writing rows on behalf of another user", async () => {
    const { error } = await b.c
      .from("questions")
      .insert({ user_id: a.id, exam_profile_id: "usmle-step1", stem: "Injected question stem that is long enough.", content_hash: "x" });
    expect(error).not.toBeNull();
    const { error: choiceErr } = await b.c.from("answer_choices").insert({ question_id: questionId, label: "C", text: "Injected", position: 2 });
    expect(choiceErr).not.toBeNull();
  });

  it("prevents attaching cards to another user's deck or question", async () => {
    const { error } = await b.c
      .from("flashcards")
      .insert({ user_id: b.id, deck_id: deckId, card_type: "basic", front: "Injected front", back: "x" });
    expect(error).not.toBeNull();
  });

  it("keeps attempts append-only once graded", async () => {
    const { data } = await a.c.from("question_attempts").update({ is_correct: false }).eq("id", attemptId).select("id");
    expect(data).toEqual([]);
    const { data: still } = await a.c.from("question_attempts").select("is_correct").eq("id", attemptId).single();
    expect(still?.is_correct).toBe(true);
    const { error: delErr, data: deleted } = await a.c.from("question_attempts").delete().eq("id", attemptId).select("id");
    expect(delErr === null && deleted?.length === 0).toBe(true);
  });

  it("updates and deletes by others affect nothing", async () => {
    const { data } = await b.c.from("questions").update({ stem: "Overwritten stem that is long enough to pass." }).eq("id", questionId).select("id");
    expect(data).toEqual([]);
    const { data: del } = await b.c.from("questions").delete().eq("id", questionId).select("id");
    expect(del).toEqual([]);
  });

  it("scopes analytics functions to the caller", async () => {
    const { data: perfB } = await b.c.rpc("topic_performance");
    expect(perfB).toEqual([]);
    const { data: daysB } = await b.c.rpc("daily_activity", { p_days: 7, p_tz: "UTC" });
    expect(daysB?.every((d) => d.attempts === 0)).toBe(true);
    const { data: daysA } = await a.c.rpc("daily_activity", { p_days: 7, p_tz: "UTC" });
    expect(daysA?.some((d) => d.attempts === 1)).toBe(true);
  });

  it("allows reading reference data", async () => {
    const { data } = await b.c.from("exam_profiles").select("id");
    expect(data?.length).toBe(8);
  });
});
