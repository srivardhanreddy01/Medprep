"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";

export type NoteState = { error?: string; saved?: boolean } | undefined;

const tagList = (raw: FormDataEntryValue | null) =>
  String(raw ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/\s+/g, "-"))
    .filter(Boolean)
    .slice(0, 12);

const NoteInput = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  title: z.string().trim().min(1, "Add a title").max(200),
  body: z.string().max(20000),
  note_type: z.enum(["note", "pearl", "mnemonic", "highlight"]),
  topic_id: z.union([z.literal(""), z.coerce.number().int().positive()]),
  parent_id: z.union([z.literal(""), z.uuid()]),
  question_id: z.union([z.literal(""), z.uuid()]),
});

export async function saveNote(_: NoteState, form: FormData): Promise<NoteState> {
  const parsed = NoteInput.safeParse({
    id: form.get("id") ?? "",
    title: form.get("title"),
    body: form.get("body") ?? "",
    note_type: form.get("note_type") ?? "note",
    topic_id: form.get("topic_id") ?? "",
    parent_id: form.get("parent_id") ?? "",
    question_id: form.get("question_id") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.id && v.parent_id === v.id) return { error: "A note cannot be its own parent" };
  const { supabase, user } = await requireUser();
  const row = {
    title: v.title,
    body: v.body,
    note_type: v.note_type,
    topic_id: v.topic_id || null,
    parent_id: v.parent_id || null,
    question_id: v.question_id || null,
    tags: tagList(form.get("tags")),
  };
  // Only student-written notes are editable; AI notes stay read-only.
  const { error } = v.id
    ? await supabase.from("notes").update(row).eq("id", v.id).eq("origin", "user")
    : await supabase.from("notes").insert({ ...row, user_id: user.id, origin: "user" });
  if (error) return { error: error.message };
  revalidatePath("/notebook");
  if (v.question_id) revalidatePath(`/questions/${v.question_id}`);
  return { saved: true };
}

export async function deleteNote(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase } = await requireUser();
  const { data } = await supabase.from("notes").delete().eq("id", id).select("question_id").maybeSingle();
  revalidatePath("/notebook");
  if (data?.question_id) revalidatePath(`/questions/${data.question_id}`);
}

/** Copies an AI summary into an editable student note, keeping the two clearly separate. */
export async function saveAiNoteAsMine(form: FormData) {
  const id = z.uuid().parse(form.get("id"));
  const { supabase, user } = await requireUser();
  const { data: n } = await supabase.from("notes").select("*").eq("id", id).single();
  if (!n) return;
  await supabase.from("notes").insert({
    user_id: user.id,
    question_id: n.question_id,
    topic_id: n.topic_id,
    title: n.title.replace(/^AI summary: /, ""),
    body: n.body,
    note_type: "note",
    origin: "user",
    tags: n.tags,
  });
  revalidatePath("/notebook");
  if (n.question_id) revalidatePath(`/questions/${n.question_id}`);
}
