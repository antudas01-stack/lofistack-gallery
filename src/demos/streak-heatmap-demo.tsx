"use client";

import { useMemo, useState } from "react";
import { StreakHeatmap, type StreakHeatmapDatum } from "@/components/gallery/streak-heatmap";
import { ColorSwatches, Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const END = "2026-10-09";
const DAY_MS = 86_400_000;

const COLORS = [
  { name: "Violet", value: "#8b5cf6" },
  { name: "Emerald", value: "#10b981" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
] as const;

/** Deterministic pseudo-random data so server and client render the same grid. */
function makeData(days: number, seed: number, activity = 0.72): StreakHeatmapDatum[] {
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  const [y, m, d] = END.split("-").map(Number);
  const endMs = Date.UTC(y, m - 1, d);
  let on = true;
  return Array.from({ length: days }, (_, i) => {
    on = on ? rand() < activity + 0.12 : rand() < activity - 0.3;
    const date = new Date(endMs - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10);
    return { date, value: on ? 1 + Math.floor(rand() ** 1.6 * 12) : 0 };
  });
}

const RANGES = { "13 wks": 91, "26 wks": 182, "1 year": 365 } as const;
type Range = keyof typeof RANGES;

export function StreakHeatmapPlayground() {
  const [range, setRange] = useState<Range>("13 wks");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [cellSize, setCellSize] = useState(16);
  const [weekStart, setWeekStart] = useState<"mon" | "sun">("mon");
  const [seed, setSeed] = useState(7);
  const [showStats, setShowStats] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selected, setSelected] = useState<StreakHeatmapDatum | null>(null);

  const days = RANGES[range];
  const data = useMemo(() => makeData(days, seed), [days, seed]);

  return (
    <PlaygroundShell
      stage={
        <div className="flex max-w-full flex-col items-start gap-3">
          <StreakHeatmap
            data={data}
            label="Commits per day"
            end={END}
            days={days}
            color={color}
            unit="commit"
            cellSize={cellSize}
            weekStartsOn={weekStart === "mon" ? 1 : 0}
            showStats={showStats}
            showLegend={showLegend}
            showLabels={showLabels}
            onSelect={setSelected}
          />
          <p className="font-mono text-[11px] text-fg-muted" aria-live="polite">
            {selected
              ? `onSelect → { date: "${selected.date}", value: ${selected.value} }`
              : "Click a day (or press Enter on it) to fire onSelect."}
          </p>
        </div>
      }
      controls={
        <>
          <Segmented label="Range" options={Object.keys(RANGES) as Range[]} value={range} onChange={setRange} />
          <Segmented label="Week starts" options={["mon", "sun"] as const} value={weekStart} onChange={setWeekStart} />
          <Slider label="Cell size" value={cellSize} min={8} max={20} format={(v) => `${v}px`} onChange={setCellSize} />
          <ColorSwatches label="Color" options={COLORS} value={color} onChange={setColor} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Stats" checked={showStats} onChange={setShowStats} />
            <Toggle label="Legend" checked={showLegend} onChange={setShowLegend} />
            <Toggle label="Month + weekday labels" checked={showLabels} onChange={setShowLabels} />
          </div>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Shuffle data
          </button>
        </>
      }
    />
  );
}

export function StreakHeatmapStates() {
  const busy = useMemo(() => makeData(91, 3, 0.85), []);
  const sparse = useMemo(() => makeData(91, 11, 0.4), []);
  const perfect = useMemo(() => makeData(91, 5, 1.2).map((d) => ({ ...d, value: Math.max(1, d.value) })), []);
  const tiny = useMemo(() => makeData(91, 21), []);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Busy · emerald">
        <StreakHeatmap data={busy} label="Busy" end={END} color="#10b981" cellSize={11} showLegend={false} />
      </StateTile>
      <StateTile label="Sparse · rose">
        <StreakHeatmap data={sparse} label="Sparse" end={END} color="#f43f5e" cellSize={11} showLegend={false} />
      </StateTile>
      <StateTile label="Perfect streak · custom unit">
        <StreakHeatmap
          data={perfect}
          label="Workouts"
          end={END}
          color="#0ea5e9"
          unit="workout"
          cellSize={11}
          showLegend={false}
        />
      </StateTile>
      <StateTile label="Empty (no data yet)">
        <StreakHeatmap data={[]} label="Empty" end={END} cellSize={11} showLegend={false} />
      </StateTile>
      <StateTile label="Compact · no labels or stats">
        <StreakHeatmap
          data={tiny}
          label="Compact"
          end={END}
          color="#f59e0b"
          cellSize={9}
          showStats={false}
          showLabels={false}
        />
      </StateTile>
    </div>
  );
}

export function StreakHeatmapCard() {
  const data = useMemo(() => makeData(91, 7), []);
  return (
    <StreakHeatmap
      data={data}
      label="Preview"
      end={END}
      cellSize={10}
      showStats={false}
      showLegend={false}
      showLabels={false}
    />
  );
}
