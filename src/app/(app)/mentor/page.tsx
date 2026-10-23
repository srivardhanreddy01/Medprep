import Link from "next/link";
import { ArrowRight, BookOpen, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Mentor & Well-being" };

export default function MentorPage() {
  return (
    <>
      <PageHeader title="Mentor & Well-being" description="Academic support and healthy study habits, together in one place." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5 text-primary" /> Academic mentorship</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Review your study progress and prepare questions for your mentor. Mentor assignment and messaging are not yet enabled in this pilot.</p>
            <Link href="/analytics" className={buttonVariants({ variant: "outline" })}>View your progress <ArrowRight className="size-4" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HeartHandshake className="size-5 text-primary" /> Well-being</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Make time for breaks, sleep, and connection while preparing for exams. This space is informational and is not a clinical or emergency service.</p>
            <p>Private well-being information is not shared with academic mentors through this page.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="size-5 text-primary" /> Your next study step</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use your personalized daily plan to balance learning, question practice, and recall.</p>
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>Go to today's plan <ArrowRight className="size-4" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /> Your privacy</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>MedPrep is an educational tool, not a medical or mental-health provider. Do not enter identifiable patient information or sensitive personal details into study notes.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
