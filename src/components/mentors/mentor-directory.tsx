"use client";
import { Languages, MessageSquare, Search, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { Input, Select } from "@/components/ui/input";
import type { Mentor } from "@/samples/mentors";

const initials = (name: string) =>
  name
    .replace(/^Dr\.\s*/, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

export function MentorDirectory({ mentors, exams, defaultExam }: { mentors: Mentor[]; exams: { id: string; name: string }[]; defaultExam?: string }) {
  const [exam, setExam] = useState(defaultExam && mentors.some((m) => m.exams.includes(defaultExam as Mentor["exams"][number])) ? defaultExam : "");
  const [q, setQ] = useState("");
  const examName = new Map(exams.map((e) => [e.id, e.name]));

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return mentors.filter(
      (m) =>
        (!exam || m.exams.includes(exam as Mentor["exams"][number])) &&
        (!needle || [m.name, m.role, m.bio, ...m.subjects, ...m.languages].some((s) => s.toLowerCase().includes(needle))),
    );
  }, [mentors, exam, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subject, language, or name" aria-label="Search mentors" className="pl-8" />
        </div>
        <Select value={exam} onChange={(e) => setExam(e.target.value)} aria-label="Exam" className="w-48">
          <option value="">All exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </Select>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={Search} title="No mentors match">Try another exam or search term.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((m) => (
            <Card key={m.id} className="flex flex-col">
              <CardHeader className="flex-row items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary" aria-hidden>
                  {initials(m.name)}
                </div>
                <div>
                  <CardTitle>{m.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <div className="flex flex-wrap gap-1">
                  {m.exams.map((e) => (
                    <Badge key={e} variant="secondary">{examName.get(e) ?? e}</Badge>
                  ))}
                  {m.subjects.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
                <p>{m.bio}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Languages className="size-3.5" aria-hidden /> {m.languages.join(", ")}
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="flex gap-2 text-xs text-muted-foreground">
                  {m.format.includes("video") && (
                    <span className="flex items-center gap-1"><Video className="size-3.5" aria-hidden /> Video</span>
                  )}
                  {m.format.includes("chat") && (
                    <span className="flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden /> Chat</span>
                  )}
                </span>
                <Button size="sm" variant="outline" disabled title="Booking opens soon">Request intro</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
