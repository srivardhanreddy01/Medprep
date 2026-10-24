import { HeartHandshake, LifeBuoy, Phone } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BreathingExercise } from "@/components/wellbeing/breathing-exercise";

export const metadata = { title: "Mental Health & Counseling" };

const CRISIS_LINES = [
  { region: "United States", name: "988 Suicide & Crisis Lifeline", contact: "Call or text 988", href: "tel:988" },
  { region: "United Kingdom & Ireland", name: "Samaritans", contact: "Call 116 123", href: "tel:116123" },
  { region: "India", name: "Tele-MANAS (Government of India)", contact: "Call 14416", href: "tel:14416" },
  { region: "India", name: "iCall (TISS) psychosocial helpline", contact: "Call 9152987821", href: "tel:+919152987821" },
];

const COUNSELING_OPTIONS = [
  {
    title: "Your medical school's counseling service",
    body: "Most schools offer free, confidential counseling for students, often with clinicians who understand exam pressure and clinical rotations. Student affairs or the dean of students can connect you.",
  },
  {
    title: "Your primary care doctor",
    body: "A good first stop if sleep, mood, appetite, or concentration have changed for more than two weeks. They can assess, treat, and refer.",
  },
  {
    title: "A licensed therapist",
    body: "Cognitive behavioral therapy is effective for anxiety, perfectionism, and low mood. Many therapists offer video sessions that fit around study blocks.",
  },
  {
    title: "Peers and mentors",
    body: "Someone a year or two ahead has been exactly where you are. Talking through a study plan can lift a surprising amount of pressure.",
  },
];

const SIGNS = [
  "Feeling hopeless, or that nothing you do will be enough",
  "Sleeping far more or far less than usual for weeks",
  "Losing interest in things you normally enjoy",
  "Panic before or during practice blocks",
  "Using alcohol or other substances to cope",
  "Thoughts of harming yourself",
];

const HABITS = [
  "Protect 7–9 hours of sleep. Memory consolidation happens overnight, so sleep is study time.",
  "Schedule one half-day off each week and keep it.",
  "Judge progress over weeks, not single practice scores. Daily scores are noisy.",
  "Move for 20–30 minutes a day; even a walk improves mood and focus.",
  "Keep at least one conversation a day that is not about the exam.",
];

export default function WellbeingPage() {
  return (
    <>
      <PageHeader
        title="Mental Health & Counseling"
        description="Exam prep is hard on everyone. Support is available, and asking for it is a strength."
      />
      <Alert variant="destructive" className="mb-6">
        <LifeBuoy />
        <div>
          <p className="font-medium">If you are in danger or thinking about ending your life, get help now.</p>
          <p className="mt-1">Call your local emergency number (911 in the US, 999 in the UK, 112 in India and Europe) or one of the free lines below.</p>
        </div>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden /> Free, confidential support lines
              </CardTitle>
              <CardDescription>Available 24 hours a day. Check your country&apos;s health service for other local lines.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {CRISIS_LINES.map((l) => (
                  <li key={l.name} className="rounded-lg border p-3 text-sm">
                    <p className="text-xs text-muted-foreground">{l.region}</p>
                    <p className="font-medium">{l.name}</p>
                    <a href={l.href} className="text-primary underline">{l.contact}</a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="size-4" aria-hidden /> Talk to someone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {COUNSELING_OPTIONS.map((o) => (
                <div key={o.title}>
                  <p className="font-medium">{o.title}</p>
                  <p className="text-muted-foreground">{o.body}</p>
                </div>
              ))}
              <p>
                Want a study mentor? <Link href="/mentors" className="text-primary underline">Find a mentor</Link>.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>When to reach out</CardTitle>
                <CardDescription>Any of these lasting more than two weeks is worth talking about.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {SIGNS.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Habits that protect you</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {HABITS.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>One-minute reset</CardTitle>
              <CardDescription>Try this between question blocks or before a test.</CardDescription>
            </CardHeader>
            <CardContent>
              <BreathingExercise />
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">
            MedPrep is a study tool and does not provide counseling or medical care. The resources here are for information; contact a licensed professional for support.
          </p>
        </aside>
      </div>
    </>
  );
}
