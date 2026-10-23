"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkRateLimit, runAnalysisJob, runFlashcardJob } from "@/lib/ai/pipeline";
import { gradeAttempt } from "@/lib/questions/grading";
import { OPTION_LABELS } from "@/lib/taxonomy";
import { requireUser } from "@/lib/supabase/server";

export type ActionState = { error?: string; message?: string } | undefined;

const Id = z.uuid();

export async function regenerate(_: ActionState, form: FormData): Promise<ActionState> {
  const id = Id.safeParse(form.get("question_id"));
  const kind = form.get("kind");
  if (!id.success || (kind !== "analysis" && kind !== "flashcards")) return { error: "Invalid request" };
  const { supabase, user } = await requireUser();
  const limited = await checkRateLimit(supabase);
  if (limited) return { error: limited };
  const res = kind === "analysis" ? await runAnalysisJob(supabase, user.id, id.data) : await runFlashcardJob(supabase, user.id, id.data);
  revalidatePath(`/questions/${id.data}`);
  return res.ok ? { message: kind === "analysis" ? "New analysis generated." : (res.detail ?? "Flashcards generated.") } : { error: res.error };
}

const Practice = z.object({
  question_id: z.uuid(),
  selected_label: z.enum(OPTION_LABELS),
  confidence: z.union([z.literal(""), z.enum(["low", "medium", "high"])]),
  time_spent_seconds: z.coerce.number().int().min(0).max(86400).optional(),
});

export async function submitPractice(form: FormData) {
  const v = Practice.parse({
    question_id: form.get("question_id"),
    selected_label: form.get("selected_label"),
    confidence: form.get("confidence") ?? "",
    time_spent_seconds: form.get("time_spent_seconds") || undefined,
  });
  const { supabase, user } = await requireUser();
  const [{ data: q }, { data: a }] = await Promise.all([
    supabase.from("questions").select("official_answer_label").eq("id", v.question_id).single(),
    supabase.from("ai_analyses").select("ai_answer_label").eq("question_id", v.question_id).order("version", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!q) throw new Error("Question not found");
  const grade = gradeAttempt(v.selected_label, q.official_answer_label, a?.ai_answer_label);
  await supabase.from("question_attempts").insert({
    user_id: user.id,
    question_id: v.question_id,
    selected_label: v.selected_label,
    confidence: v.confidence || null,
    mode: "practice",
    time_spent_seconds: v.time_spent_seconds ?? null,
    ...grade,
  });
  revalidatePath("/dashboard");
  redirect(`/questions/${v.question_id}?tab=answer&practiced=1`);
}

export async function setReviewStatus(form: FormData) {
  const id = Id.parse(form.get("question_id"));
  const status = z.enum(["new", "learning", "mastered", "flagged"]).parse(form.get("review_status"));
  const { supabase } = await requireUser();
  await supabase.from("questions").update({ review_status: status }).eq("id", id);
  revalidatePath(`/questions/${id}`);
}

export async function setOfficialAnswer(form: FormData) {
  const id = Id.parse(form.get("question_id"));
  const raw = form.get("official_answer");
  const label = raw ? z.enum(OPTION_LABELS).parse(raw) : null;
  const { supabase } = await requireUser();
  await supabase.from("questions").update({ official_answer_label: label }).eq("id", id);
  revalidatePath(`/questions/${id}`);
}

export async function deleteQuestion(form: FormData) {
  const id = Id.parse(form.get("question_id"));
  const { supabase } = await requireUser();
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath("/questions");
  redirect("/questions");
}

const Report = z.object({
  question_id: z.uuid(),
  analysis_id: z.union([z.literal(""), z.uuid()]),
  section: z.string().max(60),
  kind: z.enum(["incorrect", "unclear", "outdated", "ambiguous_question", "other"]),
  message: z.string().trim().min(3, "Describe the problem").max(4000),
});

export async function reportIssue(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = Report.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_feedback").insert({
    user_id: user.id,
    question_id: v.question_id,
    analysis_id: v.analysis_id || null,
    section: v.section,
    kind: v.kind,
    message: v.message,
  });
  if (error) return { error: error.message };
  if (v.kind === "incorrect" || v.kind === "ambiguous_question") {
    await supabase.from("questions").update({ review_status: "flagged" }).eq("id", v.question_id);
  }
  revalidatePath(`/questions/${v.question_id}`);
  return { message: "Thanks. Your report is saved for expert review, and the question is flagged in your library." };
}
