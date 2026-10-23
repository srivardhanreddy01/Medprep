import { AnalyzerForm } from "@/components/analyzer/analyzer-form";
import { PageHeader } from "@/components/layout/page-header";
import { getExamProfiles, getSettings, getTopics } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { SAMPLE_QUESTIONS } from "@/samples/questions";

export const metadata = { title: "Analyze a question" };
// Analysis and flashcard generation run inside the submit action.
export const maxDuration = 300;

export default async function AnalyzePage() {
  const { supabase, user } = await requireUser();
  const [exams, topics, { profile }] = await Promise.all([getExamProfiles(supabase), getTopics(supabase), getSettings(supabase, user.id)]);
  return (
    <>
      <PageHeader
        title="Analyze a Question"
        description="Paste a question, commit to an answer, then learn the reasoning. Remove any patient identifiers first."
      />
      <AnalyzerForm exams={exams} topics={topics} defaultExam={profile.target_exam_id ?? "usmle-step1"} samples={SAMPLE_QUESTIONS} />
    </>
  );
}
