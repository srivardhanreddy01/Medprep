"use client";
import { useEffect, useState } from "react";

/** Records time on question into a hidden field and shows a quiet elapsed timer. */
export function PracticeTimer() {
  const [start] = useState(() => Date.now());
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs(Math.round((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [start]);
  return (
    <div className="flex justify-end text-xs tabular-nums text-muted-foreground">
      <input type="hidden" name="time_spent_seconds" value={secs} />
      {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
    </div>
  );
}
