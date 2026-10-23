import "server-only";
import { cache } from "react";
import type { ServerSupabase } from "@/lib/supabase/server";

export const getExamProfiles = cache(async (supabase: ServerSupabase) => {
  const { data } = await supabase.from("exam_profiles").select("id, name, region, description").order("sort_order");
  return data ?? [];
});

export const getTopics = cache(async (supabase: ServerSupabase) => {
  const { data } = await supabase.from("medical_topics").select("id, slug, name, kind").order("sort_order");
  return data ?? [];
});

export const getSettings = cache(async (supabase: ServerSupabase, userId: string) => {
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("study_preferences").select("*").eq("user_id", userId).single(),
  ]);
  return { profile: profile!, prefs: prefs! };
});
