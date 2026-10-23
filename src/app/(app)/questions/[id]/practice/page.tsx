import { notFound } from "next/navigation";
import { submitPractice } from "@/app/(app)/questions/actions";
import { PracticeTimer } from "@/components/question/practice-timer";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Practice question" };

export default async function PracticePage({ params }: PageProps<"/questions/[id]/practice">) {
  const { id } = await params;
  const { supabase } = await requireUser();
  const { data: q } = await supabase.from("questions").select("id, stem, answer_choices(label, text, position)").eq("id", id).maybeSingle();
  if (!q) notFound();
  const options = [...q.answer_choices].sort((a, b) => a.position - b.position);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Practice" description="The explanation stays hidden until you answer." />
      <Card>
        <CardContent className="pt-5">
          <form action={submitPractice} className="space-y-5">
            <input type="hidden" name="question_id" value={id} />
            <PracticeTimer />
            <p className="whitespace-pre-wrap leading-relaxed">{q.stem}</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Answer choices</legend>
              {options.map((o) => (
                <label key={o.label} className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name="selected_label" value={o.label} required className="mt-1 accent-[var(--primary)]" />
                  <span>
                    <strong>{o.label}.</strong> {o.text}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="flex flex-wrap items-center gap-2 text-sm">
              <legend className="mb-1 w-full font-medium">Confidence</legend>
              {(["low", "medium", "high"] as const).map((c) => (
                <label key={c} className="flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 capitalize has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name="confidence" value={c} className="accent-[var(--primary)]" />
                  {c}
                </label>
              ))}
            </fieldset>
            <SubmitButton pendingText="Checking…">Submit answer</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
