import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoEmbed } from "@/components/video/video-embed";
import { getTopics } from "@/lib/data";
import { LONG_FORM_LIBRARY, VIDEO_CHANNELS, youtubeSearchUrl } from "@/lib/media/videos";
import { requireUser } from "@/lib/supabase/server";
import type { TopicSlug } from "@/lib/taxonomy";

export const metadata = { title: "Video Library" };

export default async function VideosPage() {
  const { supabase } = await requireUser();
  const topics = await getTopics(supabase);
  const subjects = topics.filter((t) => t.slug in LONG_FORM_LIBRARY);

  return (
    <>
      <PageHeader
        title="Video Library"
        description="Long-form lectures by subject. Every question also has a short reel under its Reel tab."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {subjects.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm">
                  {LONG_FORM_LIBRARY[t.slug as TopicSlug].map((l) => (
                    <li key={l.query}>
                      <a href={youtubeSearchUrl(l.query)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        {l.title} <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Watch here</CardTitle>
              <CardDescription>Paste any YouTube lecture link to watch it without leaving MedPrep.</CardDescription>
            </CardHeader>
            <CardContent>
              <VideoEmbed storageKey="library" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Free channels</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {VIDEO_CHANNELS.map((c) => (
                  <li key={c.name}>
                    <a href={youtubeSearchUrl(c.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                      {c.name} <ExternalLink className="size-3" aria-hidden />
                    </a>
                    <p className="text-muted-foreground">{c.focus}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">MedPrep is not affiliated with these creators. Check facts against a current textbook or guideline.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
