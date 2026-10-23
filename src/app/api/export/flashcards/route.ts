import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const clean = (s: string | null) => (s ?? "").replace(/[\t\r]/g, " ").replace(/\n/g, "<br>");

/** Anki-compatible tab-separated export: Front, Back (with explanation), Tags. Import as "Basic". */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("flashcards").select("front, back, explanation, tags, flashcard_decks(name)").order("created_at").limit(20000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const lines = [
    "#separator:tab",
    "#html:true",
    "#columns:Front\tBack\tTags",
    ...(data ?? []).map((c) => {
      const back = c.explanation ? `${clean(c.back)}<br><br><i>${clean(c.explanation)}</i>` : clean(c.back);
      const deck = c.flashcard_decks?.name.replace(/\s+/g, "_") ?? "";
      return `${clean(c.front)}\t${back}\t${[...c.tags, deck && `deck::${deck}`].filter(Boolean).join(" ")}`;
    }),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/tab-separated-values; charset=utf-8",
      "Content-Disposition": `attachment; filename="medprep-flashcards.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
