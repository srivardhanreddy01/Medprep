import { NotebookPen, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { NoteCard, type NoteRow } from "@/components/notes/note-card";
import { NoteForm } from "@/components/notes/note-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Input, Select } from "@/components/ui/input";
import { getTopics } from "@/lib/data";
import { requireUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Medical Notebook" };
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function NotebookPage({ searchParams }: PageProps<"/notebook">) {
  const sp = await searchParams;
  const f = { q: str(sp.q).slice(0, 200), topic: str(sp.topic), origin: str(sp.origin), type: str(sp.type), tag: str(sp.tag) };
  const { supabase } = await requireUser();
  const topics = await getTopics(supabase);

  let query = supabase.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(300);
  if (f.q) query = query.textSearch("search", f.q, { type: "websearch", config: "english" });
  if (f.topic === "unsorted") query = query.is("topic_id", null);
  else if (/^\d+$/.test(f.topic)) query = query.eq("topic_id", Number(f.topic));
  if (f.origin === "user" || f.origin === "ai") query = query.eq("origin", f.origin);
  if (f.type) query = query.eq("note_type", f.type);
  if (f.tag) query = query.contains("tags", [f.tag]);

  const [{ data: notes }, { data: all }] = await Promise.all([query, supabase.from("notes").select("id, title, topic_id, tags, origin, parent_id")]);
  const counts = new Map<string, number>();
  for (const n of all ?? []) counts.set(String(n.topic_id ?? "unsorted"), (counts.get(String(n.topic_id ?? "unsorted")) ?? 0) + 1);
  const tags = [...new Set((all ?? []).flatMap((n) => n.tags))].sort().slice(0, 40);
  const parents = (all ?? []).filter((n) => n.origin === "user" && !n.parent_id).map((n) => ({ id: n.id, title: n.title }));

  // Hierarchy: show children under their parent when the parent is in the result set.
  const rows = (notes ?? []) as NoteRow[];
  const ids = new Set(rows.map((n) => n.id));
  const roots = rows.filter((n) => !n.parent_id || !ids.has(n.parent_id));
  const children = (id: string) => rows.filter((n) => n.parent_id === id);
  const filtered = Object.values(f).some(Boolean);
  const topicName = f.topic === "unsorted" ? "Unsorted" : topics.find((t) => String(t.id) === f.topic)?.name;

  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...f, ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/notebook${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="My Medical Notebook" description="Your notes, pearls, and mnemonics by system. AI summaries are marked and kept separate from what you write." />
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systems and disciplines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              <Link href={link({ topic: "" })} className={cn("flex justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted", !f.topic && "bg-primary-soft text-primary")}>
                All notes <span className="text-muted-foreground">{all?.length ?? 0}</span>
              </Link>
              {topics.map((t) => (
                <Link key={t.id} href={link({ topic: String(t.id) })} className={cn("flex justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted", f.topic === String(t.id) && "bg-primary-soft text-primary")}>
                  <span className="truncate">{t.name}</span>
                  <span className="text-muted-foreground">{counts.get(String(t.id)) ?? 0}</span>
                </Link>
              ))}
              <Link href={link({ topic: "unsorted" })} className={cn("flex justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted", f.topic === "unsorted" && "bg-primary-soft text-primary")}>
                Unsorted <span className="text-muted-foreground">{counts.get("unsorted") ?? 0}</span>
              </Link>
            </CardContent>
          </Card>
          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Link key={t} href={link({ tag: f.tag === t ? "" : t })} className={cn("rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-primary-soft", f.tag === t && "bg-primary-soft text-primary")}>
                    #{t}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          <form className="flex flex-wrap gap-2" role="search">
            {f.topic && <input type="hidden" name="topic" value={f.topic} />}
            {f.tag && <input type="hidden" name="tag" value={f.tag} />}
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={f.q} placeholder="Search notes" aria-label="Search notes" className="pl-8" />
            </div>
            <Select name="origin" defaultValue={f.origin} aria-label="Author" className="w-40">
              <option value="">Mine and AI</option>
              <option value="user">My notes only</option>
              <option value="ai">AI summaries only</option>
            </Select>
            <Select name="type" defaultValue={f.type} aria-label="Type" className="w-36">
              <option value="">Any type</option>
              <option value="note">Notes</option>
              <option value="pearl">Clinical pearls</option>
              <option value="mnemonic">Mnemonics</option>
              <option value="highlight">Highlights</option>
              <option value="summary">Summaries</option>
            </Select>
            <Button type="submit" variant="outline">Filter</Button>
            {filtered && <Link href="/notebook" className={buttonVariants({ variant: "ghost" })}>Clear</Link>}
          </form>

          <details className="rounded-xl border bg-card" open={!rows.length && !filtered}>
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Write a note{topicName ? ` in ${topicName}` : ""}</summary>
            <div className="border-t p-4">
              <NoteForm topics={topics} parents={parents} values={{ topic_id: /^\d+$/.test(f.topic) ? Number(f.topic) : null }} />
            </div>
          </details>

          {rows.length === 0 ? (
            <EmptyState icon={NotebookPen} title={filtered ? "No notes match" : "Your notebook is empty"}>
              {filtered ? "Try a different filter." : "Notes you add to questions, and AI summaries of analyzed questions, collect here."}
            </EmptyState>
          ) : (
            <div className="space-y-3">
              {roots.map((n) => (
                <div key={n.id} className="space-y-2">
                  <NoteCard note={n} topics={topics} parents={parents} showQuestionLink />
                  {children(n.id).length > 0 && (
                    <div className="ml-6 space-y-2 border-l-2 pl-4">
                      {children(n.id).map((c) => (
                        <NoteCard key={c.id} note={c} topics={topics} parents={parents} showQuestionLink />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
