"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { EXAM_IDS } from "@/lib/taxonomy";
import { requireUser } from "@/lib/supabase/server";

export type SettingsState = { error?: string; saved?: boolean } | undefined;

const Settings = z.object({
  display_name: z.string().trim().min(1).max(80),
  target_exam_id: z.enum(EXAM_IDS),
  exam_date: z.union([z.literal(""), z.iso.date()]),
  timezone: z.string().min(1).max(64),
  daily_minutes: z.coerce.number().int().min(10).max(960),
  study_days: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Pick at least one study day"),
  desired_retention: z.coerce.number().min(0.7).max(0.97),
  max_new_cards_per_day: z.coerce.number().int().min(0).max(500),
  email_reminders: z.boolean(),
  browser_reminders: z.boolean(),
});

export async function saveSettings(_: SettingsState, form: FormData): Promise<SettingsState> {
  const parsed = Settings.safeParse({
    display_name: form.get("display_name"),
    target_exam_id: form.get("target_exam_id"),
    exam_date: form.get("exam_date") ?? "",
    timezone: form.get("timezone") || "UTC",
    daily_minutes: form.get("daily_minutes"),
    study_days: form.getAll("study_days"),
    desired_retention: form.get("desired_retention"),
    max_new_cards_per_day: form.get("max_new_cards_per_day"),
    email_reminders: form.get("email_reminders") === "on",
    browser_reminders: form.get("browser_reminders") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const { supabase, user } = await requireUser();
  const onboarding = form.get("onboarding") === "1";

  const { error: pErr } = await supabase
    .from("profiles")
    .update({
      display_name: v.display_name,
      target_exam_id: v.target_exam_id,
      exam_date: v.exam_date || null,
      timezone: v.timezone,
      ...(onboarding ? { onboarded_at: new Date().toISOString() } : {}),
    })
    .eq("id", user.id);
  if (pErr) return { error: pErr.message };
  const { error: sErr } = await supabase
    .from("study_preferences")
    .update({
      daily_minutes: v.daily_minutes,
      study_days: v.study_days,
      desired_retention: v.desired_retention,
      max_new_cards_per_day: v.max_new_cards_per_day,
      email_reminders: v.email_reminders,
      browser_reminders: v.browser_reminders,
    })
    .eq("user_id", user.id);
  if (sErr) return { error: sErr.message };

  revalidatePath("/", "layout");
  if (onboarding) redirect("/dashboard");
  return { saved: true };
}
