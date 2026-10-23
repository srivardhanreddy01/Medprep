# 6. AI Prompt and Response Schemas

Code: `src/lib/ai/` (`schemas.ts`, `prompts.ts`, `validate.ts`, `pipeline.ts`, `providers/`).

## 6.1 Pipeline

1. **Prompt** (`PROMPT_VERSION = analysis-v1.0`): system prompt sets the educator role and the
   integrity rules; the user prompt carries the exam profile's scope and style, the stem and options
   inside `<question>` / `<options>` tags (declared untrusted data), and whether an official key exists.
   The student's own answer is **not** sent, so it cannot bias the model.
2. **Structured output**: the Zod schema is converted to JSON Schema and passed as the response
   format (Anthropic `output_config.format`), so the model must return schema-shaped JSON.
3. **Validation** (`validateAnalysis`): re-parses with Zod, then checks the answer is one of the
   options, every option has exactly one explanation, there are six reasoning steps, the differential
   has 2–4 entries, `is_correct` flags match the answer, and adds a `possible_answer_key_error` flag if
   the AI disagrees with the official key. Hard failures trigger **one repair round** with the issues
   fed back; a second failure marks the job failed but keeps the question.
4. **Storage**: `ai_analyses.result` stores the validated output plus server-owned fields
   (`answer_status`, `references`, `validation_notes`, `generated_by`).
5. **Flashcards** are a separate job with their own schema; cards are deduplicated against the
   student's existing fronts before insert.

## 6.2 Analysis schema (abridged)

```jsonc
{
  "topic_slug": "endocrinology",            // one of 18 slugs
  "subtopic": "Primary hyperparathyroidism",
  "question_task": "diagnosis",             // diagnosis | pathophysiology | next_best_step | treatment | …
  "difficulty": "easy",
  "answer": { "option": "B", "confidence": "high", "confidence_rationale": "…",
              "concept_tested": "…", "justification": "…", "why_best": "…" },
  "key_clues": [{ "clue": "…", "significance": "…", "weight": "decisive|supporting|distractor" }],
  "clinical_reasoning": [{ "step": 1, "title": "Identify the task", "content": "…" }],   // exactly 6
  "differential_diagnosis": [{ "candidate": "…", "supporting": "…", "against": "…", "verdict": "best|plausible|unlikely" }],
  "option_explanations": [{ "label": "A", "is_correct": false, "meaning": "…", "why_plausible": "…",
      "why_wrong_here": "…", "when_correct": "…", "distinguishing_clue": "…", "exam_tip": "…" }],
  "high_yield_takeaways": ["…"],
  "exam_strategy": { "pattern_recognition": "…", "stem_decoding": "…", "elimination_sequence": ["…"], "time_management": "…" },
  "exam_traps": [{ "trap": "…", "how_to_avoid": "…" }],
  "mnemonics": [{ "mnemonic": "…", "expansion": "…", "caveat": "…" }],
  "visual_suggestions": [{ "kind": "diagnostic_algorithm", "title": "…", "description": "…" }],
  "guideline_dependence": { "depends_on_guidelines": false, "note": "…" },
  "official_answer_comment": "",
  "uncertainty_flags": [{ "kind": "ambiguous_stem|multiple_plausible_answers|possibly_outdated|insufficient_information|possible_answer_key_error|region_dependent_practice|other", "detail": "…" }],
  "learning_summary": "…"
}
```

Server-added: `answer_status` (`official_key_agrees` | `official_key_disagrees` | `ai_inferred_unverified`),
`references` (only from curated retrieval; empty in Phase 1), `validation_notes`, `generated_by`.

## 6.3 Flashcard schema

```json
{ "cards": [{ "card_type": "basic|clinical|differential|cloze", "front": "…", "back": "…", "explanation": "…", "tags": ["…"] }] }
```

## 6.4 Provider configuration

| Variable | Default | Notes |
|---|---|---|
| `LLM_PROVIDER` | `anthropic` | `fixture` is the deterministic test provider, refused in production unless `ALLOW_FIXTURE_PROVIDER=true` |
| `LLM_MODEL` | `claude-opus-5-5` | Any model your key can use |
| `LLM_EFFORT` | `high` | `low` … `max`; trades depth for latency and cost |
| `ANTHROPIC_API_KEY` | none | Server-only |

The Anthropic provider streams the response (long outputs), uses structured outputs, and opts into
server-side refusal fallbacks (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) so a
safety-classifier decline on a legitimate medical question is retried on a fallback model. Refusals,
truncation, rate limits, and auth errors map to clear user-facing messages.

To add a provider (OpenAI, Gemini, self-hosted), implement `LLMProvider.generateStructured` in
`src/lib/ai/providers/` and register it in `getProvider()`.

## 6.5 Hallucination controls

No citations unless retrieved from `medical_references`; calibrated confidence with rationale;
uncertainty flags; official-key disagreement surfaced; schema + consistency validation; per-question
"Report an issue" feeding `user_feedback`; versioned analyses so a corrected explanation never erases
history. Phase 3 adds retrieval (RAG) over licensed references and a clinician-reviewed benchmark set
run in CI (`tests/` is where the eval harness will live).
