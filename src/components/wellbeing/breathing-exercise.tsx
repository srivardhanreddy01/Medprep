"use client";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PHASES = ["Breathe in", "Hold", "Breathe out", "Hold"] as const;
const PHASE_SECONDS = 4;

/** Box breathing: four phases of four seconds. A quick reset between question blocks. */
export function BreathingExercise() {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const phase = Math.floor(tick / PHASE_SECONDS) % PHASES.length;
  const remaining = PHASE_SECONDS - (tick % PHASE_SECONDS);
  const expanded = running && (phase === 0 || phase === 1);

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="grid size-40 place-items-center">
        <div
          className={cn(
            "grid place-items-center rounded-full bg-primary-soft text-primary transition-all ease-in-out",
            expanded ? "size-40" : "size-24",
          )}
          style={{ transitionDuration: `${PHASE_SECONDS}s` }}
          aria-live="polite"
        >
          <div className="text-center">
            <p className="text-sm font-medium">{running ? PHASES[phase] : "Ready"}</p>
            {running && <p className="text-2xl font-semibold tabular-nums">{remaining}</p>}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{running ? `Cycle ${Math.floor(tick / (PHASE_SECONDS * 4)) + 1}` : "Four slow cycles take about a minute."}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (!running) setTick(0);
          setRunning((r) => !r);
        }}
      >
        {running ? <Pause /> : <Play />} {running ? "Stop" : "Start box breathing"}
      </Button>
    </div>
  );
}
