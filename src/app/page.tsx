import { Brain, CalendarClock, ListChecks, NotebookPen, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { DisclaimerFooter } from "@/components/layout/disclaimer";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";

const FEATURES = [
  { icon: Brain, title: "Six-step clinical reasoning", text: "Identify the task, extract the decisive clues, build the differential, and generalize to new presentations." },
  { icon: ListChecks, title: "Why every other option is wrong", text: "A card for each distractor: why it tempts you, why it fails here, and when it would be right." },
  { icon: Sparkles, title: "Flashcards from every question", text: "3–8 deduplicated cards per question: recall, clinical application, differential, and cloze." },
  { icon: CalendarClock, title: "FSRS spaced repetition", text: "Reviews scheduled by the open FSRS algorithm for your chosen retention target." },
  { icon: NotebookPen, title: "Your medical notebook", text: "Notes by system, pearls and mnemonics, with AI summaries kept separate from your own writing." },
  { icon: ShieldCheck, title: "Honest about uncertainty", text: "Official answers and AI-inferred answers are never mixed up. Ambiguous questions are flagged." },
];

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>Sign in</Link>
          <Link href="/signup" className={buttonVariants()}>Create account</Link>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-4 text-sm font-medium text-primary">USMLE · COMLEX · PLAB/UKMLA · NEET PG · INI-CET</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Don&apos;t just learn the answer. Learn how to reach it.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Paste any multiple-choice question. MedPrep teaches you to recognize the clues, eliminate the distractors, and
            remember the concept on exam day.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>Start studying</Link>
            <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>I have an account</Link>
          </div>
        </section>
        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-5">
              <f.icon className="mb-3 size-5 text-primary" aria-hidden />
              <h2 className="font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
      <DisclaimerFooter />
    </div>
  );
}
