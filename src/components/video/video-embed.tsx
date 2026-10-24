"use client";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/input";
import { parseYouTubeId, youtubeEmbedUrl } from "@/lib/media/videos";
import { cn } from "@/lib/utils";

/**
 * Paste a YouTube link to watch it inline. The chosen video is remembered in this browser only,
 * keyed by `storageKey`, so a student can pin a short or a lecture to a question or subject.
 */
export function VideoEmbed({ storageKey, vertical = false, placeholder }: { storageKey: string; vertical?: boolean; placeholder?: string }) {
  const key = `medprep:video:${storageKey}`;
  const [id, setId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage after mount
      if (saved) setId(saved);
    } catch {
      // Storage can be unavailable (private mode); the embed still works for this visit.
    }
  }, [key]);

  const save = (next: string | null) => {
    setId(next);
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
    } catch {}
  };

  if (id)
    return (
      <div className="space-y-2">
        <div className={cn("overflow-hidden rounded-xl border bg-black", vertical ? "mx-auto aspect-[9/16] max-w-xs" : "aspect-video")}>
          <iframe
            src={youtubeEmbedUrl(id)}
            title="Embedded video"
            className="size-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => save(null)}>
          <X /> Remove video
        </Button>
      </div>
    );

  return (
    <form
      className="space-y-1"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseYouTubeId(value);
        if (!parsed) return setError("Paste a YouTube watch, share, or Shorts link.");
        setError(undefined);
        setValue("");
        save(parsed);
      }}
    >
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder ?? "Paste a YouTube link"} aria-label="YouTube link" />
        <Button type="submit" variant="outline">Watch here</Button>
      </div>
      <FieldError>{error}</FieldError>
    </form>
  );
}
