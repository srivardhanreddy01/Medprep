import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getExamProfiles, getSettings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();
  const [{ profile, prefs }, exams] = await Promise.all([getSettings(supabase, user.id), getExamProfiles(supabase)]);
  return (
    <>
      <PageHeader title="Settings" description="Exam, schedule, and spaced-repetition preferences." />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent className="pt-5">
            <SettingsForm
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
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Your data</CardTitle>
            <CardDescription>Download everything you have created.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/api/export/flashcards" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              <Download /> Flashcards (Anki-compatible TSV)
            </a>
            <a href="/api/export/all" className={buttonVariants({ variant: "outline", className: "w-full" })}>
              <Download /> Full export (JSON)
            </a>
            <p className="pt-2 text-xs text-muted-foreground">Signed in as {user.email}</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
