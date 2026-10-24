import { ExternalLink, Film, MonitorPlay } from "lucide-react";
import Link from "next/link";
import { ReelPlayer } from "@/components/video/reel-player";
import { VideoEmbed } from "@/components/video/video-embed";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoredAnalysis } from "@/lib/ai/schemas";
import { buildReel, LONG_FORM_LIBRARY, youtubeSearchUrl, youtubeShortsUrl } from "@/lib/media/videos";

export function ReelTab({ a, questionId, answerText }: { a: StoredAnalysis; questionId: string; answerText?: string }) {
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
      <ReelPlayer key={questionId} slides={buildReel(a, answerText)} title={a.subtopic} />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="size-4" aria-hidden /> Short videos on this concept
            </CardTitle>
            <CardDescription>The reel is built from this question&apos;s explanation. Find creator shorts on the same idea, or pin one here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href={youtubeShortsUrl(a.subtopic)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink /> Shorts: {a.subtopic}
            </a>
            <VideoEmbed storageKey={`reel:${questionId}`} vertical placeholder="Paste a YouTube Shorts link" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LongVideosTab({ a, questionId }: { a: StoredAnalysis; questionId: string }) {
  const lectures = LONG_FORM_LIBRARY[a.topic_slug] ?? [];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MonitorPlay className="size-4" aria-hidden /> Full lectures
          </CardTitle>
          <CardDescription>Longer explanations of the concept and the subject around it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="space-y-1.5">
            <li>
              <a href={youtubeSearchUrl(`${a.subtopic} lecture`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                {a.subtopic} <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
            {lectures.map((l) => (
              <li key={l.query}>
                <a href={youtubeSearchUrl(l.query)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                  {l.title} <ExternalLink className="size-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <Link href="/videos" className="inline-block pt-1 text-muted-foreground underline">Browse the video library</Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Watch a lecture here</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoEmbed storageKey={`long:${questionId}`} />
        </CardContent>
      </Card>
    </div>
  );
}
