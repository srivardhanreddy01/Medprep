"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

// Recessive axes and grid; text uses text tokens, never series colors.
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;
const grid = <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />;
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

interface TipProps {
  active?: boolean;
  payload?: readonly { dataKey?: unknown; name?: unknown; value?: unknown; color?: string }[];
  label?: unknown;
  unit?: string;
  labelFormat?: (l: string) => string;
}

function ChartTooltip({ active, payload, label, unit, labelFormat }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{labelFormat ? labelFormat(String(label)) : String(label ?? "")}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} aria-hidden />
          {String(p.name)}: <span className="font-medium text-foreground tabular-nums">{p.value === null || p.value === undefined ? "—" : `${Math.round(Number(p.value))}${unit ?? ""}`}</span>
        </p>
      ))}
    </div>
  );
}

function Frame({ height = 220, children, empty }: { height?: number; children: React.ReactElement; empty?: string | false }) {
  if (empty) {
    return (
      <div className="grid place-items-center rounded-md border border-dashed text-center text-sm text-muted-foreground" style={{ height }}>
        <p className="max-w-xs px-4">{empty}</p>
      </div>
    );
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function QuestionActivityChart({ data }: { data: { day: string; analyzed: number; attempts: number }[] }) {
  const empty = data.every((d) => !d.analyzed && !d.attempts) && "No questions yet. Activity appears here after your first analysis.";
  return (
    <Frame empty={empty}>
      <BarChart data={data} barGap={2} margin={{ left: -20, right: 4, top: 8 }}>
        {grid}
        <XAxis dataKey="day" tickFormatter={shortDay} {...axis} minTickGap={24} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} labelFormat={shortDay} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        <Bar dataKey="analyzed" name="Analyzed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={14} />
        <Bar dataKey="attempts" name="Answered" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={14} />
      </BarChart>
    </Frame>
  );
}

export function ReviewActivityChart({ data }: { data: { day: string; reviews: number }[] }) {
  const empty = data.every((d) => !d.reviews) && "No flashcard reviews yet.";
  return (
    <Frame empty={empty}>
      <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        {grid}
        <XAxis dataKey="day" tickFormatter={shortDay} {...axis} minTickGap={24} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} labelFormat={shortDay} />} />
        <Bar dataKey="reviews" name="Reviews" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={16} />
      </BarChart>
    </Frame>
  );
}

/** 7-day rolling accuracy over graded attempts. Days with no graded attempts in the window are gaps. */
export function AccuracyTrendChart({ data }: { data: { day: string; correct: number; graded: number }[] }) {
  const series = data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 6), i + 1);
    const g = win.reduce((s, x) => s + x.graded, 0);
    return { day: d.day, accuracy: g ? (100 * win.reduce((s, x) => s + x.correct, 0)) / g : null };
  });
  const empty = series.every((s) => s.accuracy === null) && "Answer questions before viewing explanations to see your accuracy trend.";
  return (
    <Frame empty={empty}>
      <LineChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
        {grid}
        <XAxis dataKey="day" tickFormatter={shortDay} {...axis} minTickGap={24} />
        <YAxis domain={[0, 100]} unit="%" {...axis} />
        <Tooltip cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }} content={(p) => <ChartTooltip {...p} unit="%" labelFormat={shortDay} />} />
        <Line dataKey="accuracy" name="7-day accuracy" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-1)" }} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} connectNulls={false} />
      </LineChart>
    </Frame>
  );
}

export function RecallRateChart({ data, target }: { data: { day: string; reviews: number; recalled: number }[]; target: number }) {
  const series = data.map((d) => ({ day: d.day, recall: d.reviews ? (100 * d.recalled) / d.reviews : null }));
  const empty = series.every((s) => s.recall === null) && "Review flashcards to measure how much you recall.";
  return (
    <Frame empty={empty}>
      <LineChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
        {grid}
        <XAxis dataKey="day" tickFormatter={shortDay} {...axis} minTickGap={24} />
        <YAxis domain={[0, 100]} unit="%" {...axis} />
        <ReferenceLine y={target * 100} stroke="var(--muted-foreground)" strokeDasharray="4 4" label={{ value: "Target", position: "insideTopRight", fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }} content={(p) => <ChartTooltip {...p} unit="%" labelFormat={shortDay} />} />
        <Line dataKey="recall" name="Recalled (not Again)" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "var(--chart-1)" }} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }} />
      </LineChart>
    </Frame>
  );
}

export function SubjectAccuracyChart({ data }: { data: { name: string; accuracy: number | null; attempts: number }[] }) {
  const rows = data.filter((d) => d.attempts > 0 && d.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  const empty = rows.length === 0 && "Subject accuracy appears once you have graded attempts.";
  return (
    <Frame height={Math.max(160, rows.length * 30 + 40)} empty={empty}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" domain={[0, 100]} unit="%" {...axis} />
        <YAxis type="category" dataKey="name" width={130} {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} unit="%" />} />
        <Bar dataKey="accuracy" name="Accuracy" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={14} minPointSize={2}>
          <LabelList dataKey="accuracy" position="right" fontSize={11} fill="var(--muted-foreground)" formatter={(v: unknown) => `${Math.round(Number(v))}%`} />
        </Bar>
      </BarChart>
    </Frame>
  );
}

export function WeakTopicChart({ data }: { data: { name: string; incorrect: number }[] }) {
  const rows = data.filter((d) => d.incorrect > 0).sort((a, b) => b.incorrect - a.incorrect).slice(0, 10);
  const empty = rows.length === 0 && "No missed questions yet.";
  return (
    <Frame height={Math.max(160, rows.length * 30 + 40)} empty={empty}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" allowDecimals={false} {...axis} />
        <YAxis type="category" dataKey="name" width={130} {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} />} />
        <Bar dataKey="incorrect" name="Incorrect attempts" fill="var(--chart-2)" radius={[0, 4, 4, 0]} maxBarSize={14} />
      </BarChart>
    </Frame>
  );
}

export function WeeklyImprovementChart({ data }: { data: { week: string; accuracy: number | null; graded: number }[] }) {
  const empty = data.every((d) => d.accuracy === null) && "Weekly accuracy appears after your first graded attempts.";
  return (
    <Frame empty={empty}>
      <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        {grid}
        <XAxis dataKey="week" tickFormatter={(w) => `Wk of ${shortDay(w)}`} {...axis} minTickGap={16} />
        <YAxis domain={[0, 100]} unit="%" {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} unit="%" labelFormat={(w) => `Week of ${shortDay(w)}`} />} />
        <Bar dataKey="accuracy" name="Accuracy" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </Frame>
  );
}

export function ForecastChart({ data }: { data: { day: string; count: number }[] }) {
  const empty = data.length === 0 && "No reviews scheduled yet.";
  return (
    <Frame empty={empty}>
      <BarChart data={data} margin={{ left: -20, right: 4, top: 8 }}>
        {grid}
        <XAxis dataKey="day" tickFormatter={shortDay} {...axis} minTickGap={16} />
        <YAxis allowDecimals={false} {...axis} />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={(p) => <ChartTooltip {...p} labelFormat={shortDay} />} />
        <Bar dataKey="count" name="Cards due" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={16} />
      </BarChart>
    </Frame>
  );
}

/** Study-consistency heatmap: one cell per day for the last `weeks` weeks (sequential, single hue). */
export function ConsistencyHeatmap({ days, counts, today, weeks = 16 }: { days: string[]; counts: Map<string, number>; today: string; weeks?: number }) {
  const set = new Set(days);
  const end = new Date(`${today}T12:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (weeks * 7 - 1) - end.getUTCDay());
  const cells: { day: string; n: number; active: boolean }[] = [];
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    cells.push({ day: k, n: counts.get(k) ?? 0, active: set.has(k) });
  }
  const level = (c: (typeof cells)[number]) => (!c.active ? 0 : c.n >= 30 ? 4 : c.n >= 15 ? 3 : c.n >= 5 ? 2 : 1);
  const shade = ["bg-muted", "bg-[#b7d3f6] dark:bg-[#184f95]", "bg-[#6da7ec] dark:bg-[#256abf]", "bg-[#2a78d6] dark:bg-[#5598e7]", "bg-[#184f95] dark:bg-[#9ec5f4]"];
  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-[3px] overflow-x-auto" role="img" aria-label={`Study activity on ${set.size} of the last ${weeks * 7} days`}>
        {cells.map((c) => (
          <div key={c.day} title={`${shortDay(c.day)}: ${c.active ? `${c.n} items` : "no activity"}`} className={cn("size-3 rounded-[3px]", shade[level(c)])} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        Less {shade.map((s, i) => <span key={i} className={cn("size-3 rounded-[3px]", s)} aria-hidden />)} More
      </div>
    </div>
  );
}
