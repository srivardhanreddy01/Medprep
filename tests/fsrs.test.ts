import { describe, expect, it } from "vitest";
import { formatInterval, newScheduleRow, previewIntervals, retrievability, review } from "@/lib/srs/fsrs";

const t0 = new Date("2026-01-01T09:00:00Z");

describe("FSRS scheduling", () => {
  it("new cards have no retrievability and are due immediately", () => {
    const row = newScheduleRow(t0);
    expect(row.state).toBe(0);
    expect(retrievability(row, t0)).toBeNull();
    expect(new Date(row.due).getTime()).toBe(t0.getTime());
  });

  it("orders intervals Again < Hard <= Good < Easy", () => {
    const p = previewIntervals(newScheduleRow(t0), t0);
    expect(p.again.getTime()).toBeLessThan(p.hard.getTime());
    expect(p.hard.getTime()).toBeLessThanOrEqual(p.good.getTime());
    expect(p.good.getTime()).toBeLessThan(p.easy.getTime());
  });

  it("grows intervals with successive successful reviews and shrinks after a lapse", () => {
    let row = newScheduleRow(t0);
    let now = t0;
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      const r = review(row, "good", now);
      row = r.next;
      intervals.push(new Date(row.due).getTime() - now.getTime());
      now = new Date(row.due);
    }
    expect(intervals[3]).toBeGreaterThan(intervals[1]);
    expect(row.state).toBe(2);
    const stabilityBefore = row.stability;
    const lapse = review(row, "again", now);
    expect(lapse.next.lapses).toBe(1);
    expect(lapse.next.stability).toBeLessThan(stabilityBefore);
    expect(lapse.retrievabilityBefore).toBeGreaterThan(0.5);
  });

  it("schedules shorter intervals for a higher retention target", () => {
    let row = newScheduleRow(t0);
    row = review(row, "good", t0).next;
    const now = new Date(row.due);
    row = review(row, "good", now).next;
    const later = new Date(row.due);
    const hi = previewIntervals(row, later, 0.95).good.getTime();
    const lo = previewIntervals(row, later, 0.8).good.getTime();
    expect(hi).toBeLessThan(lo);
  });

  it("formats intervals", () => {
    expect(formatInterval(t0, new Date(t0.getTime() + 10 * 60000))).toBe("10m");
    expect(formatInterval(t0, new Date(t0.getTime() + 3 * 86400000))).toBe("3d");
  });
});
