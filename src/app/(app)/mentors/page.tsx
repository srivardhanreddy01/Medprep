import { Info } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { MentorDirectory } from "@/components/mentors/mentor-directory";
import { Alert } from "@/components/ui/alert";
import { getExamProfiles, getSettings } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { SAMPLE_MENTORS } from "@/samples/mentors";

export const metadata = { title: "Find a Mentor" };

export default async function MentorsPage() {
  const { supabase, user } = await requireUser();
  const [exams, { profile }] = await Promise.all([getExamProfiles(supabase), getSettings(supabase, user.id)]);
  return (
    <>
      <PageHeader title="Find a Mentor" description="Learn from doctors who recently passed the exam you are preparing for." />
      <Alert className="mb-6">
        <Info />
        <p>
          These are sample profiles while mentor sign-up and booking are being built. Feeling overwhelmed rather than stuck on content? See{" "}
          <Link href="/wellbeing" className="underline">Mental Health &amp; Counseling</Link>.
        </p>
      </Alert>
      <MentorDirectory mentors={SAMPLE_MENTORS} exams={exams} defaultExam={profile.target_exam_id ?? undefined} />
    </>
  );
}
