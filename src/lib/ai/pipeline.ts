import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { answerStatus, gradeAttempt } from "@/lib/questions/grading";
import { newScheduleRow } from "@/lib/srs/fsrs";
import { getProvider, ProviderError, type LLMProvider } from "./providers";
import { ANALYSIS_SYSTEM, analysisPrompt, FLASHCARD_SYSTEM, flashcardPrompt, PROMPT_VERSION, type PromptQuestion } from "./prompts";
import { AnalysisSchema, FlashcardSetSchema, type StoredAnalysis } from "./schemas";
import { validateAnalysis, validateFlashcards } from "./validate";

export type JobResult = { ok: true; detail?: string } | { ok: false; error: string };

const RATE_LIMIT = Number(process.env.AI_JOBS_PER_HOUR ?? 30);

export async function checkRateLimit(supabase: ServerSupabase): Promise<string | null> {
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("ai_generation_jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_LIMIT) return `You have reached the limit of ${RATE_LIMIT} AI generations per hour. Try again later.`;
  return null;
}

async function loadQuestion(supabase: ServerSupabase, questionId: string) {
  const { data: q, error } = await supabase
    .from("questions")
    .select("id, stem, official_answer_label, topic_id, topic_source, exam_profile_id, answer_choices(label, text, position), exam_profiles(name, scope_notes, question_style), medical_topics(name)")
    .eq("id", questionId)
    .single();
  if (error || !q) throw new Error("Question not found");
  const options = [...q.answer_choices].sort((a, b) => a.position - b.position).map(({ label, text }) => ({ label, text }));
  const prompt: PromptQuestion = {
    stem: q.stem,
    options,
    exam: q.exam_profiles!,
    topicHint: q.topic_source === "user" ? (q.medical_topics?.name ?? null) : null,
    officialAnswer: q.official_answer_label,
  };
  return { q, prompt };
}

async function startJob(supabase: ServerSupabase, userId: string, questionId: string, jobType: "analysis" | "flashcards", provider: LLMProvider) {
  const { data, error } = await supabase
    .from("ai_generation_jobs")
    .insert({ user_id: userId, question_id: questionId, job_type: jobType, provider: provider.name, model: provider.model })
    .select("id")
    .single();
  if (error) throw new Error(`Could not start job: ${error.message}`);
  return data.id;
}

async function finishJob(
  supabase: ServerSupabase,
  jobId: string,
  result: { status: "succeeded" | "failed"; error?: string; usage?: { inputTokens: number; outputTokens: number }; model?: string },
) {
  await supabase
    .from("ai_generation_jobs")
    .update({
      status: result.status,
      error: result.error?.slice(0, 2000) ?? null,
      input_tokens: result.usage?.inputTokens ?? null,
      output_tokens: result.usage?.outputTokens ?? null,
      ...(result.model ? { model: result.model } : {}),
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

function errorMessage(err: unknown): string {
  if (err instanceof ProviderError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

/**
 * Generates, validates and stores a new analysis version for a question, then grades the
 * student's ungraded attempts and saves the AI learning summary as an AI note.
 */
export async function runAnalysisJob(supabase: ServerSupabase, userId: string, questionId: string): Promise<JobResult> {
  let provider: LLMProvider;
  try {
    provider = getProvider();
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  const { q, prompt } = await loadQuestion(supabase, questionId);
  const jobId = await startJob(supabase, userId, questionId, "analysis", provider);
  const labels = prompt.options.map((o) => o.label);

  try {
    let issues: string[] | undefined;
    let validated: ReturnType<typeof validateAnalysis> | undefined;
    let usage = { inputTokens: 0, outputTokens: 0 };
    let model = provider.model;
    // One repair round: validation issues are fed back to the model.
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await provider.generateStructured({
        system: ANALYSIS_SYSTEM,
        prompt: analysisPrompt(prompt, issues),
        schema: AnalysisSchema,
        schemaName: "analysis",
      });
      usage = {
        inputTokens: usage.inputTokens + (res.usage?.inputTokens ?? 0),
        outputTokens: usage.outputTokens + (res.usage?.outputTokens ?? 0),
      };
      model = res.model;
      validated = validateAnalysis(res.data, { labels, officialAnswer: q.official_answer_label });
      if (validated.ok) break;
      issues = validated.issues;
    }
    if (!validated?.ok) {
      const msg = `The AI response failed validation: ${validated && !validated.ok ? validated.issues.join("; ") : "unknown"}`;
      await finishJob(supabase, jobId, { status: "failed", error: msg, usage, model });
      return { ok: false, error: msg };
    }

    const analysis = validated.data;
    const stored: StoredAnalysis = {
      ...analysis,
      answer_status: answerStatus(q.official_answer_label, analysis.answer.option),
      references: [],
      validation_notes: validated.notes,
      generated_by: { provider: provider.name, model, prompt_version: PROMPT_VERSION, fixture: provider.isFixture },
    };

    const { data: last } = await supabase
      .from("ai_analyses")
      .select("version")
      .eq("question_id", questionId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: inserted, error: insErr } = await supabase
      .from("ai_analyses")
      .insert({
        user_id: userId,
        question_id: questionId,
        version: (last?.version ?? 0) + 1,
        provider: provider.name,
        model,
        prompt_version: PROMPT_VERSION,
        ai_answer_label: analysis.answer.option,
        ai_confidence: analysis.answer.confidence,
        question_task: analysis.question_task,
        agrees_with_official: q.official_answer_label ? q.official_answer_label === analysis.answer.option : null,
        result: stored as unknown as { [key: string]: Json },
      })
      .select("id")
      .single();
    if (insErr) throw new Error(`Could not save analysis: ${insErr.message}`);

    // Fill topic and difficulty from the AI when the student chose auto-classification.
    const update: { difficulty: "easy" | "medium" | "hard"; topic_id?: number; topic_source?: string } = {
      difficulty: analysis.difficulty,
    };
    if (q.topic_id === null || q.topic_source === "ai") {
      const { data: topic } = await supabase.from("medical_topics").select("id").eq("slug", analysis.topic_slug).single();
      if (topic) Object.assign(update, { topic_id: topic.id, topic_source: "ai" });
    }
    await supabase.from("questions").update(update).eq("id", questionId);

    // Grade attempts that were waiting for an answer key.
    const { data: ungraded } = await supabase
      .from("question_attempts")
      .select("id, selected_label")
      .eq("question_id", questionId)
      .is("is_correct", null)
      .not("selected_label", "is", null);
    for (const a of ungraded ?? []) {
      const g = gradeAttempt(a.selected_label, q.official_answer_label, analysis.answer.option);
      if (g.is_correct !== null) {
        await supabase.from("question_attempts").update(g).eq("id", a.id);
      }
    }

    // Replace the AI summary note for this question (student notes are never touched).
    await supabase.from("notes").delete().eq("question_id", questionId).eq("origin", "ai").eq("note_type", "summary");
    await supabase.from("notes").insert({
      user_id: userId,
      question_id: questionId,
      topic_id: update.topic_id ?? q.topic_id,
      title: `AI summary: ${analysis.subtopic}`.slice(0, 200),
      body: analysis.learning_summary,
      note_type: "summary",
      origin: "ai",
      tags: [analysis.topic_slug],
    });

    await finishJob(supabase, jobId, { status: "succeeded", usage, model });
    return { ok: true, detail: inserted.id };
  } catch (err) {
    const msg = errorMessage(err);
    await finishJob(supabase, jobId, { status: "failed", error: msg });
    return { ok: false, error: msg };
  }
}

/** Generates flashcards from the latest analysis into the default deck. Independent of the analysis job. */
export async function runFlashcardJob(supabase: ServerSupabase, userId: string, questionId: string): Promise<JobResult> {
  let provider: LLMProvider;
  try {
    provider = getProvider();
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
  const { data: latest } = await supabase
    .from("ai_analyses")
    .select("result")
    .eq("question_id", questionId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest) return { ok: false, error: "Analyze the question before generating flashcards." };
  const analysis = latest.result as unknown as StoredAnalysis;

  const { q, prompt } = await loadQuestion(supabase, questionId);
  const jobId = await startJob(supabase, userId, questionId, "flashcards", provider);
  try {
    const { data: existing } = await supabase.from("flashcards").select("front").limit(2000);
    const existingFronts = (existing ?? []).map((c) => c.front);
    const res = await provider.generateStructured({
      system: FLASHCARD_SYSTEM,
      prompt: flashcardPrompt(
        prompt,
        {
          answer_label: analysis.answer.option,
          concept: analysis.answer.concept_tested,
          takeaways: analysis.high_yield_takeaways,
          distinguishing: analysis.option_explanations.map((o) => `${o.label}: ${o.distinguishing_clue}`),
        },
        existingFronts,
      ),
      schema: FlashcardSetSchema,
      schemaName: "flashcards",
    });
    const validated = validateFlashcards(res.data, existingFronts);
    if (!validated.ok) {
      const msg = validated.issues.join("; ");
      await finishJob(supabase, jobId, { status: "failed", error: msg, usage: res.usage, model: res.model });
      return { ok: false, error: msg };
    }

    const { data: deck } = await supabase.from("flashcard_decks").select("id").eq("is_default", true).single();
    if (!deck) throw new Error("Default deck is missing");

    const { data: cards, error } = await supabase
      .from("flashcards")
      .insert(
        validated.data.map((c) => ({
          user_id: userId,
          deck_id: deck.id,
          question_id: questionId,
          topic_id: q.topic_id,
          card_type: c.card_type,
          front: c.front,
          back: c.back,
          explanation: c.explanation,
          tags: c.tags,
          origin: "ai",
        })),
      )
      .select("id");
    if (error) throw new Error(`Could not save flashcards: ${error.message}`);
    const now = new Date();
    const { error: schedErr } = await supabase
      .from("review_schedules")
      .insert(cards.map((c) => ({ flashcard_id: c.id, user_id: userId, ...newScheduleRow(now) })));
    if (schedErr) throw new Error(`Could not schedule flashcards: ${schedErr.message}`);

    await finishJob(supabase, jobId, { status: "succeeded", usage: res.usage, model: res.model });
    return { ok: true, detail: `${cards.length} cards created${validated.notes.length ? ` (${validated.notes.join("; ")})` : ""}` };
  } catch (err) {
    const msg = errorMessage(err);
    await finishJob(supabase, jobId, { status: "failed", error: msg });
    return { ok: false, error: msg };
  }
}
