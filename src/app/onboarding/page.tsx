import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { SettingsForm } from "@/components/settings/settings-form";
import { getExamProfiles, getSettings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Set up your study plan" };

export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const [{ profile, prefs }, exams] = await Promise.all([getSettings(supabase, user.id), getExamProfiles(supabase)]);
  if (profile.onboarded_at) redirect("/dashboard");
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Logo />
      <h1 className="mt-8 text-2xl font-semibold">Set up your study plan</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Your exam choice shapes how explanations are written. You can change everything later in Settings.
      </p>
      <div className="rounded-xl border bg-card p-6">
        <SettingsForm
          onboarding
          exams={exams}
          values={{
            display_name: profile.display_name ?? "",
            target_exam_id: profile.target_exam_id ?? "",
            exam_date: profile.exam_date ?? "",
            timezone: profile.timezone,
            daily_minutes: prefs.daily_minutes,
            study_days: prefs.study_days,
            desired_retention: Number(prefs.desired_retention),
            max_new_cards_per_day: prefs.max_new_cards_per_day,
            email_reminders: prefs.email_reminders,
            browser_reminders: prefs.browser_reminders,
          }}
        />
      </div>
    </main>
  );
}
