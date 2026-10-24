"use client";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReelSlide } from "@/lib/media/videos";
import { cn } from "@/lib/utils";

const SLIDE_MS = 7000;

const TONE: Record<ReelSlide["kind"], string> = {
  hook: "from-primary to-ai",
  clue: "from-ai to-primary",
  answer: "from-success to-primary",
  trap: "from-warning to-destructive",
  mnemonic: "from-accent to-ai",
  recap: "from-primary to-success",
};

/** Vertical, auto-advancing story-style reel. Tap left or right to step, or pause. */
export function ReelPlayer({ slides, title }: { slides: ReelSlide[]; title: string }) {
  const [{ index, elapsed }, setPos] = useState({ index: 0, elapsed: 0 });
  const [playing, setPlaying] = useState(true);
  const last = slides.length - 1;
  const done = index === last && elapsed >= SLIDE_MS;

  useEffect(() => {
    if (!playing || done) return;
    const t = setInterval(
      () =>
        setPos((p) => {
          const e = p.elapsed + 100;
          return e >= SLIDE_MS && p.index < last ? { index: p.index + 1, elapsed: 0 } : { index: p.index, elapsed: e };
        }),
      100,
    );
    return () => clearInterval(t);
  }, [playing, done, last]);

  const go = (i: number) => setPos({ index: Math.max(0, Math.min(last, i)), elapsed: 0 });
  const slide = slides[index];

  return (
    <div
      className={cn("relative mx-auto flex aspect-[9/16] w-full max-w-xs flex-col overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg", TONE[slide.kind])}
      role="region"
      aria-roledescription="reel"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === " ") {
          e.preventDefault();
          setPlaying((p) => !p);
        }
      }}
      tabIndex={0}
    >
      <div className="flex gap-1 p-3">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: i < index ? "100%" : i === index ? `${Math.min(100, (elapsed / SLIDE_MS) * 100)}%` : "0%" }}
            />
          </div>
        ))}
      </div>
      <p className="px-4 text-xs font-medium tracking-wide text-white/80 uppercase">{title}</p>

      <div className="flex flex-1 flex-col justify-center gap-4 px-6" aria-live="polite">
        <p className="text-sm font-semibold tracking-wide text-white/85 uppercase">{slide.eyebrow}</p>
        <p className="text-2xl leading-snug font-bold text-balance">{slide.text}</p>
        {slide.detail && <p className="text-sm leading-relaxed text-white/90">{slide.detail}</p>}
      </div>

      <button type="button" className="absolute inset-y-16 left-0 w-1/3" onClick={() => go(index - 1)} aria-label="Previous slide" />
      <button type="button" className="absolute inset-y-16 right-0 w-1/3" onClick={() => go(index + 1)} aria-label="Next slide" />

      <div className="relative flex items-center justify-between p-3 text-xs text-white/85">
        <button type="button" onClick={() => go(index - 1)} className="rounded-full p-2 hover:bg-white/15" aria-label="Previous slide">
          <ChevronLeft className="size-4" />
        </button>
        {done ? (
          <button type="button" onClick={() => go(0)} className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 hover:bg-white/30">
            <RotateCcw className="size-4" /> Replay
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 hover:bg-white/30"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            {index + 1} / {slides.length}
          </button>
        )}
        <button type="button" onClick={() => go(index + 1)} className="rounded-full p-2 hover:bg-white/15" aria-label="Next slide">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
