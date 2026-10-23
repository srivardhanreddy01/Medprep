import { Download, Layers, Play, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteDeck } from "@/app/(app)/flashcards/actions";
import { CardForm } from "@/components/flashcards/card-form";
import { CardItem, type CardRow } from "@/components/flashcards/card-item";
import { DeckForm } from "@/components/flashcards/deck-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Input, Select } from "@/components/ui/input";
import { getTopics } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Flashcards" };
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function FlashcardsPage({ searchParams }: PageProps<"/flashcards">) {
  const sp = await searchParams;
  const f = { q: str(sp.q).slice(0, 200), deck: str(sp.deck), tag: str(sp.tag), type: str(sp.type), status: str(sp.status), topic: str(sp.topic) };
  const { supabase } = await requireUser();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("flashcards")
    .select("*, review_schedules!inner(due, state, reps, lapses)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (f.q) query = query.textSearch("search", f.q, { type: "websearch", config: "english" });
  if (f.deck) query = query.eq("deck_id", f.deck);
  if (f.tag) query = query.contains("tags", [f.tag]);
  if (f.type) query = query.eq("card_type", f.type);
  if (/^\d+$/.test(f.topic)) query = query.eq("topic_id", Number(f.topic));
  if (f.status === "due") query = query.lte("review_schedules.due", nowIso).eq("suspended", false);
  if (f.status === "new") query = query.eq("review_schedules.state", 0);
  if (f.status === "suspended") query = query.eq("suspended", true);

  const [{ data: cards }, { data: decks }, { data: deckCounts }, { count: dueCount }, topics] = await Promise.all([
    query,
    supabase.from("flashcard_decks").select("id, name, is_default").order("is_default", { ascending: false }).order("name"),
    supabase.from("flashcards").select("deck_id"),
    supabase.from("review_schedules").select("flashcard_id, flashcards!inner(suspended)", { count: "exact", head: true }).lte("due", nowIso).eq("flashcards.suspended", false),
    getTopics(supabase),
  ]);
  const counts = new Map<string, number>();
  for (const c of deckCounts ?? []) counts.set(c.deck_id, (counts.get(c.deck_id) ?? 0) + 1);
  const rows: CardRow[] = (cards ?? []).map((c) => ({ ...c, schedule: c.review_schedules }));
  const allTags = [...new Set(rows.flatMap((r) => r.tags))].sort().slice(0, 40);
  const filtered = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader
        title="Flashcards"
        description="Cards are scheduled with FSRS for your retention target."
        actions={
          <>
            <a href="/api/export/flashcards" className={buttonVariants({ variant: "outline" })}>
              <Download /> Export for Anki
            </a>
            <Link href={`/flashcards/review${f.deck ? `?deck=${f.deck}` : ""}`} className={buttonVariants()}>
              <Play /> Review due ({dueCount ?? 0})
            </Link>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Link href="/flashcards" className={cn("block rounded-md px-2 py-1.5 text-sm hover:bg-muted", !f.deck && "bg-primary-soft text-primary")}>
                All cards
              </Link>
              {(decks ?? []).map((d) => (
                <div key={d.id} className="group flex items-center">
                  <Link
                    href={`/flashcards?deck=${d.id}`}
                    className={cn("flex flex-1 justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted", f.deck === d.id && "bg-primary-soft text-primary")}
                  >
                    <span className="truncate">{d.name}</span>
                    <span className="text-muted-foreground">{counts.get(d.id) ?? 0}</span>
                  </Link>
                  {!d.is_default && (
                    <form action={deleteDeck}>
                      <input type="hidden" name="id" value={d.id} />
                      <Button type="submit" variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={`Delete deck ${d.name} and its cards`}>
                        <Trash2 />
                      </Button>
                    </form>
                  )}
                </div>
              ))}
              <div className="pt-3">
                <DeckForm />
              </div>
            </CardContent>
          </Card>
          {allTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {allTags.map((t) => (
                  <Link key={t} href={`/flashcards?tag=${encodeURIComponent(t)}`} className={cn("rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-primary-soft", f.tag === t && "bg-primary-soft text-primary")}>
                    #{t}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          <form className="flex flex-wrap gap-2" role="search">
            {f.deck && <input type="hidden" name="deck" value={f.deck} />}
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={f.q} placeholder="Search all flashcards" aria-label="Search flashcards" className="pl-8" />
            </div>
            <Select name="status" defaultValue={f.status} aria-label="Status" className="w-36">
              <option value="">Any status</option>
              <option value="due">Due now</option>
              <option value="new">New</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Select name="type" defaultValue={f.type} aria-label="Format" className="w-36">
              <option value="">Any format</option>
              <option value="basic">Recall</option>
              <option value="clinical">Clinical</option>
              <option value="differential">Differential</option>
              <option value="cloze">Cloze</option>
            </Select>
            <Select name="topic" defaultValue={f.topic} aria-label="Subject" className="w-40">
              <option value="">All subjects</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>

          <details className="rounded-xl border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Create a card</summary>
            <div className="border-t p-4">
              <CardForm decks={decks ?? []} topics={topics} values={{ deck_id: f.deck || undefined }} />
            </div>
          </details>

          {rows.length === 0 ? (
            <EmptyState icon={Layers} title={filtered ? "No cards match" : "No flashcards yet"}>
              {filtered ? "Try a different filter." : "Analyze a question to generate cards, or create one above."}
            </EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((c) => (
                <CardItem key={c.id} card={c} decks={decks ?? []} topics={topics} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
