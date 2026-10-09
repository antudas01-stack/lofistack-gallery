"use client";

import { useMemo, useState } from "react";
import { MorphingAreaChart, type AreaChartRange } from "@/components/gallery/morphing-area-chart";
import { ColorSwatches, Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const END = Date.UTC(2026, 9, 9);
const DAY_MS = 86_400_000;
const fmtDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

const COLORS = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
] as const;

/** Deterministic daily series (trend + weekly rhythm + noise) so server and client match. */
function series(seed: number, base: number, trend: number, days = 90) {
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  return Array.from({ length: days }, (_, i) => {
    const ms = END - (days - 1 - i) * DAY_MS;
    const weekday = new Date(ms).getUTCDay();
    const weekly = weekday === 0 || weekday === 6 ? 0.72 : 1 + 0.08 * Math.sin(i / 2);
    const value = base * (1 + trend * (i / days)) * weekly * (0.82 + rand() * 0.36);
    return { label: fmtDay.format(ms), value: Math.round(value) };
  });
}

function toRanges(points: ReturnType<typeof series>): AreaChartRange[] {
  return [
    { id: "7d", label: "7D", points: points.slice(-7) },
    { id: "30d", label: "30D", points: points.slice(-30) },
    { id: "90d", label: "90D", points },
  ];
}

const DATASETS = {
  revenue: { title: "Revenue", prefix: "$", suffix: "", base: 1400, trend: 0.55 },
  signups: { title: "New signups", prefix: "", suffix: "", base: 86, trend: 0.3 },
  latency: { title: "API latency", prefix: "", suffix: " ms", base: 240, trend: -0.35 },
} as const;
type Dataset = keyof typeof DATASETS;

export function MorphingAreaChartPlayground() {
  const [dataset, setDataset] = useState<Dataset>("revenue");
  const [summary, setSummary] = useState<"sum" | "average" | "last">("sum");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [height, setHeight] = useState(260);
  const [seed, setSeed] = useState(4);
  const [showAxis, setShowAxis] = useState(true);
  const [showHeader, setShowHeader] = useState(true);

  const d = DATASETS[dataset];
  const ranges = useMemo(() => toRanges(series(seed, d.base, d.trend)), [seed, d]);

  return (
    <PlaygroundShell
      stage={
        <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <MorphingAreaChart
            key={dataset}
            title={d.title}
            ranges={ranges}
            defaultRange="30d"
            summary={dataset === "latency" ? "average" : summary}
            color={color}
            valuePrefix={d.prefix}
            valueSuffix={d.suffix}
            higherIsBetter={dataset !== "latency"}
            height={height}
            showAxis={showAxis}
            showHeader={showHeader}
          />
        </div>
      }
      controls={
        <>
          <Segmented
            label="Dataset"
            options={Object.keys(DATASETS) as Dataset[]}
            value={dataset}
            onChange={setDataset}
          />
          <Segmented
            label="Headline"
            options={["sum", "average", "last"] as const}
            value={summary}
            onChange={setSummary}
          />
          <Slider
            label="Height"
            value={height}
            min={160}
            max={360}
            step={10}
            format={(v) => `${v}px`}
            onChange={setHeight}
          />
          <ColorSwatches label="Color" options={COLORS} value={color} onChange={setColor} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Header + range tabs" checked={showHeader} onChange={setShowHeader} />
            <Toggle label="Axis + gridlines" checked={showAxis} onChange={setShowAxis} />
          </div>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Shuffle data
          </button>
          <p className="text-xs leading-relaxed text-fg-muted">
            Switch <span className="font-medium text-fg">7D / 30D / 90D</span> to see the curve morph. Hover, or focus
            the chart and use the arrow keys.
          </p>
        </>
      }
    />
  );
}

export function MorphingAreaChartStates() {
  const up = useMemo(() => toRanges(series(9, 900, 0.8)), []);
  const down = useMemo(() => toRanges(series(13, 320, -0.5)), []);
  const single: AreaChartRange[] = [{ id: "all", label: "All", points: series(2, 60, 0.2, 14) }];
  const empty: AreaChartRange[] = [{ id: "7d", label: "7D", points: [] }];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Growing · emerald · 7D default">
        <MorphingAreaChart
          title="Orders"
          ranges={up}
          defaultRange="7d"
          color="#10b981"
          height={170}
          className="max-w-md"
        />
      </StateTile>
      <StateTile label="Lower is better (higherIsBetter=false) · average">
        <MorphingAreaChart
          title="Avg. response time"
          ranges={down}
          summary="average"
          valueSuffix=" ms"
          higherIsBetter={false}
          color="#f43f5e"
          height={170}
          className="max-w-md"
        />
      </StateTile>
      <StateTile label="Single range (no tabs) · last value">
        <MorphingAreaChart
          title="Active users"
          ranges={single}
          summary="last"
          color="#0ea5e9"
          height={170}
          className="max-w-md"
        />
      </StateTile>
      <StateTile label="Empty range">
        <MorphingAreaChart title="Refunds" ranges={empty} valuePrefix="$" height={170} className="max-w-md" />
      </StateTile>
      <StateTile label="Sparkline · no header or axis">
        <MorphingAreaChart
          title="Visitors"
          ranges={up}
          defaultRange="30d"
          color="#f59e0b"
          height={90}
          showHeader={false}
          showAxis={false}
          className="max-w-xs"
        />
      </StateTile>
    </div>
  );
}

export function MorphingAreaChartCard() {
  const ranges = useMemo(() => toRanges(series(4, 1400, 0.55)), []);
  return (
    <MorphingAreaChart
      title="Revenue"
      ranges={ranges}
      defaultRange="30d"
      height={120}
      showHeader={false}
      showAxis={false}
      className="w-64"
    />
  );
}
