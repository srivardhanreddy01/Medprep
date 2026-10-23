"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkRateLimit, runAnalysisJob, runFlashcardJob } from "@/lib/ai/pipeline";
import { contentHash } from "@/lib/questions/parse";
import { IDENTIFIER_LABELS, screenForIdentifiers } from "@/lib/questions/identifiers";
import { EXAM_IDS, OPTION_LABELS } from "@/lib/taxonomy";
import { requireUser } from "@/lib/supabase/server";

export type SubmitState =
  | {
      error?: string;
      blocked?: string[];
      warnings?: string[];
      similar?: { id: string; stem: string; similarity: number }[];
      duplicateId?: string;
    }
  | undefined;

const Label = z.enum(OPTION_LABELS);

const QuestionInput = z
  .object({
    stem: z.string().trim().min(20, "The question stem looks too short").max(12000, "The stem is over 12,000 characters"),
    options: z
      .array(z.object({ label: Label, text: z.string().trim().min(1, "Answer choices cannot be empty").max(1000) }))
      .min(2, "Add at least two answer choices")
      .max(10, "At most 10 answer choices"),
    exam_profile_id: z.enum(EXAM_IDS),
    topic_id: z.union([z.literal("auto"), z.coerce.number().int().positive()]),
    official_answer: z.union([z.literal(""), Label]),
    selected_label: z.union([z.literal(""), Label]),
    confidence: z.union([z.literal(""), z.enum(["low", "medium", "high"])]),
    time_spent_seconds: z.coerce.number().int().min(0).max(86400).optional(),
    source_note: z.string().trim().max(500).optional(),
    confirm_identifiers: z.boolean(),
    force: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const labels = v.options.map((o) => o.label);
    if (new Set(labels).size !== labels.length) ctx.addIssue({ code: "custom", message: "Answer choice letters must be unique" });
    if (v.official_answer && !labels.includes(v.official_answer))
      ctx.addIssue({ code: "custom", message: "The official answer must be one of the choices" });
    if (v.selected_label && !labels.includes(v.selected_label))
      ctx.addIssue({ code: "custom", message: "Your answer must be one of the choices" });
  });

export async function submitQuestion(_: SubmitState, form: FormData): Promise<SubmitState> {
  let options: unknown;
  try {
    options = JSON.parse(String(form.get("options") ?? "[]"));
  } catch {
    return { error: "Answer choices could not be read." };
  }
  const parsed = QuestionInput.safeParse({
    stem: form.get("stem"),
    options,
    exam_profile_id: form.get("exam_profile_id"),
    topic_id: form.get("topic_id") ?? "auto",
    official_answer: form.get("official_answer") ?? "",
    selected_label: form.get("selected_label") ?? "",
    confidence: form.get("confidence") ?? "",
    time_spent_seconds: form.get("time_spent_seconds") || undefined,
    source_note: form.get("source_note") || undefined,
    confirm_identifiers: form.get("confirm_identifiers") === "on",
    force: form.get("force") === "1",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;

  const fullText = `${v.stem}\n${v.options.map((o) => o.text).join("\n")}\n${v.source_note ?? ""}`;
  const findings = screenForIdentifiers(fullText);
  const blocked = findings.filter((f) => f.severity === "block");
  if (blocked.length) {
    return {
      error: "Remove patient identifiers before submitting.",
      blocked: blocked.map((f) => `${IDENTIFIER_LABELS[f.kind]}: "${f.match}"`),
    };
  }
  const warnings = findings.filter((f) => f.severity === "warn");
  if (warnings.length && !v.confirm_identifiers) {
    return {
      error: "Confirm that these are not real patient identifiers.",
      warnings: warnings.map((f) => `${IDENTIFIER_LABELS[f.kind]}: "${f.match}"`),
    };
  }

  const { supabase, user } = await requireUser();
  const limited = await checkRateLimit(supabase);
  if (limited) return { error: limited };

  const hash = await contentHash(v.stem, v.options);
  const { data: dup } = await supabase.from("questions").select("id").eq("content_hash", hash).maybeSingle();
  if (dup) return { error: "You have already saved this exact question.", duplicateId: dup.id };

  if (!v.force) {
    const { data: similar } = await supabase.rpc("find_similar_questions", { p_stem: v.stem });
    if (similar?.length) {
      return {
        error: "This looks similar to a question already in your library.",
        similar: similar.map((s) => ({ id: s.id, stem: s.stem, similarity: s.similarity })),
      };
    }
  }

  const { data: question, error: qErr } = await supabase
    .from("questions")
    .insert({
      user_id: user.id,
      exam_profile_id: v.exam_profile_id,
      topic_id: v.topic_id === "auto" ? null : v.topic_id,
      topic_source: v.topic_id === "auto" ? "ai" : "user",
      stem: v.stem,
      official_answer_label: v.official_answer || null,
      source_note: v.source_note ?? null,
      content_hash: hash,
    })
    .select("id")
    .single();
  if (qErr) return { error: `Could not save the question: ${qErr.message}` };

  const { error: cErr } = await supabase
    .from("answer_choices")
    .insert(v.options.map((o, i) => ({ question_id: question.id, label: o.label, text: o.text, position: i })));
  if (cErr) {
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: `Could not save answer choices: ${cErr.message}` };
  }

  // The independent attempt is recorded before the AI sees the question.
  await supabase.from("question_attempts").insert({
    user_id: user.id,
    question_id: question.id,
    selected_label: v.selected_label || null,
    confidence: v.confidence || null,
    mode: "initial",
    time_spent_seconds: v.time_spent_seconds ?? null,
    ...(v.selected_label && v.official_answer
      ? { is_correct: v.selected_label === v.official_answer, graded_against: "official" }
      : {}),
  });

  const analysis = await runAnalysisJob(supabase, user.id, question.id);
  if (analysis.ok) await runFlashcardJob(supabase, user.id, question.id);
  // Whether or not AI generation succeeded, the question is saved; the page shows status and retry.
  redirect(`/questions/${question.id}`);
}
