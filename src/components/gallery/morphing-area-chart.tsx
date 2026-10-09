"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

export interface AreaChartPoint {
  /** X-axis label, e.g. "Oct 9". */
  label: string;
  value: number;
}

export interface AreaChartRange {
  id: string;
  /** Tab label, e.g. "7D". */
  label: string;
  points: AreaChartPoint[];
}

export interface MorphingAreaChartProps {
  title: string;
  /** One dataset per range tab. Switching tabs morphs the curve. */
  ranges: AreaChartRange[];
  defaultRange?: string;
  /** Headline number: total, average or latest value of the active range. */
  summary?: "sum" | "average" | "last";
  /** Line + area color. Any CSS color. */
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  /** Set false for metrics like latency or cost, so a rise shows red. */
  higherIsBetter?: boolean;
  /** Plot height in px. */
  height?: number;
  /** Title, headline, delta and range tabs. */
  showHeader?: boolean;
  /** Gridlines and axis labels. */
  showAxis?: boolean;
  /** Morph duration in ms (0 disables; reduced-motion users never see it). */
  morphDuration?: number;
  className?: string;
}

interface Shape {
  samples: number[];
  max: number;
  headline: number;
}

const SAMPLES = 120;
const PAD = { top: 14, right: 14, bottom: 28, left: 46 };

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots the data. */
function monotone(ys: number[]) {
  const n = ys.length;
  if (n === 0) return () => 0;
  if (n === 1) return () => ys[0];
  const d = ys.slice(1).map((y, i) => y - ys[i]);
  const m = ys.map((_, i) =>
    i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2,
  );
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    const i = Math.min(n - 2, Math.max(0, Math.floor(x)));
    const t = x - i;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * m[i + 1]
    );
  };
}

/** Round the axis max up so the four gridline steps land on clean numbers. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const rawStep = value / 4;
  const exp = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * exp >= rawStep) ?? 10;
  return step * exp * 4;
}

function shapeFor(points: AreaChartPoint[], summary: MorphingAreaChartProps["summary"]): Shape {
  const values = points.map((p) => p.value);
  const curve = monotone(values);
  const last = Math.max(1, values.length - 1);
  const total = values.reduce((sum, v) => sum + v, 0);
  return {
    samples: Array.from({ length: SAMPLES }, (_, k) => curve((k / (SAMPLES - 1)) * last)),
    max: niceMax(Math.max(0, ...values) * 1.05),
    headline: summary === "last" ? (values.at(-1) ?? 0) : summary === "average" ? total / (values.length || 1) : total,
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function MorphingAreaChart({
  title,
  ranges,
  defaultRange,
  summary = "sum",
  color = "#8b5cf6",
  valuePrefix = "",
  valueSuffix = "",
  higherIsBetter = true,
  height = 240,
  showHeader = true,
  showAxis = true,
  morphDuration = 700,
  className,
}: MorphingAreaChartProps) {
  const uid = `ac${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [rangeId, setRangeId] = useState(defaultRange ?? ranges[0]?.id);
  const range = ranges.find((r) => r.id === rangeId) ?? ranges[0];
  const points = useMemo(() => range?.points ?? [], [range]);
  const target = useMemo(() => shapeFor(points, summary), [points, summary]);

  const [morph, setMorph] = useState<Shape | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const [width, setWidth] = useState(640);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const shown = morph ?? target;

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  const fmt = (n: number) => `${valuePrefix}${full.format(n)}${valueSuffix}`;
  const fmtCompact = (n: number) => `${valuePrefix}${compact.format(n)}${valueSuffix}`;

  const selectRange = (id: string) => {
    const next = ranges.find((r) => r.id === id);
    if (!next || id === rangeId) return;
    const from = shown;
    const to = shapeFor(next.points, summary);
    setRangeId(id);
    setActive(null);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || morphDuration <= 0) {
      setMorph(null);
      return;
    }
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = ease(Math.min(1, (now - start) / morphDuration));
      setMorph({
        samples: from.samples.map((v, k) => lerp(v, to.samples[k], t)),
        max: lerp(from.max, to.max, t),
        headline: lerp(from.headline, to.headline, t),
      });
      if (t < 1) frame.current = requestAnimationFrame(step);
      else {
        frame.current = null;
        setMorph(null);
      }
    };
    frame.current = requestAnimationFrame(step);
  };

  // Geometry
  const pad = showAxis ? PAD : { top: 10, right: 8, bottom: 8, left: 8 };
  const plotW = Math.max(1, width - pad.left - pad.right);
  const plotH = Math.max(1, height - pad.top - pad.bottom);
  const yOf = (v: number) => pad.top + plotH - (Math.max(0, v) / shown.max) * plotH;
  const xOfSample = (k: number) => pad.left + (k / (SAMPLES - 1)) * plotW;
  const xOfPoint = (i: number) => pad.left + (points.length > 1 ? i / (points.length - 1) : 0.5) * plotW;

  const line = shown.samples
    .map((v, k) => `${k === 0 ? "M" : "L"}${xOfSample(k).toFixed(1)},${yOf(v).toFixed(1)}`)
    .join("");
  const area = `${line}L${xOfSample(SAMPLES - 1).toFixed(1)},${pad.top + plotH}L${pad.left},${pad.top + plotH}Z`;

  const first = points[0]?.value ?? 0;
  const lastValue = points.at(-1)?.value ?? 0;
  const delta = first === 0 ? 0 : ((lastValue - first) / Math.abs(first)) * 100;

  const xTicks = (() => {
    if (points.length === 0) return [];
    const count = Math.min(points.length, width > 520 ? 5 : 3);
    return Array.from({ length: count }, (_, i) => Math.round((i / Math.max(1, count - 1)) * (points.length - 1)));
  })();

  const pickIndex = (clientX: number) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return null;
    const ratio = (clientX - rect.left - pad.left) / plotW;
    return Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1))));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (points.length === 0) return;
    const last = points.length - 1;
    const current = active ?? last;
    const next =
      event.key === "ArrowLeft"
        ? current - 1
        : event.key === "ArrowRight"
          ? current + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(Math.max(0, Math.min(last, next)));
  };

  const activePoint = active !== null && !morph ? points[active] : null;
  const ax = active !== null ? xOfPoint(active) : 0;
  const ay = activePoint ? yOf(activePoint.value) : 0;
  const tooltipLeft = Math.min(Math.max(ax, 64), width - 64);

  return (
    <figure className={cn("w-full", className)}>
      {showHeader && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <figcaption className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</figcaption>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50">
                {fmtCompact(shown.headline)}
              </span>
              {points.length > 1 && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    delta >= 0 === higherIsBetter
                      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-500/12 text-rose-700 dark:text-rose-400",
                  )}
                >
                  <span aria-hidden="true">{delta >= 0 ? "▲" : "▼"}</span>
                  <span className="sr-only">{delta >= 0 ? "Up" : "Down"}</span>
                  {Math.abs(delta).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          {ranges.length > 1 && (
            <div
              role="radiogroup"
              aria-label="Time range"
              className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80"
            >
              {ranges.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={r.id === range?.id}
                  onClick={() => selectRange(r.id)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                    r.id === range?.id
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  )}
                  style={{ ["--tw-ring-color" as string]: color }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!showHeader && <figcaption className="sr-only">{title}</figcaption>}

      <div
        ref={wrapRef}
        tabIndex={points.length ? 0 : -1}
        role="group"
        aria-label={`${title} chart. Use left and right arrow keys to read each value.`}
        onPointerMove={(e: PointerEvent<HTMLDivElement>) => setActive(pickIndex(e.clientX))}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((a) => a ?? (points.length ? points.length - 1 : null))}
        onBlur={() => setActive(null)}
        className="relative touch-pan-y rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        style={{ height, ["--tw-ring-color" as string]: color }}
      >
        {points.length === 0 ? (
          <div className="grid h-full place-items-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700">
            No data for this range yet
          </div>
        ) : (
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.38" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>

            {showAxis &&
              [0, 0.25, 0.5, 0.75, 1].map((f) => {
                const y = pad.top + plotH - f * plotH;
                return (
                  <g key={f} className="text-zinc-400 dark:text-zinc-500">
                    <line
                      x1={pad.left}
                      x2={pad.left + plotW}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={f === 0 ? 0.35 : 0.15}
                      strokeDasharray={f === 0 ? undefined : "3 5"}
                    />
                    <text
                      x={pad.left - 8}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fill="currentColor"
                      fontSize="10.5"
                    >
                      {fmtCompact(shown.max * f)}
                    </text>
                  </g>
                );
              })}

            {showAxis &&
              xTicks.map((i) => (
                <text
                  key={i}
                  x={xOfPoint(i)}
                  y={height - 8}
                  textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                  className="fill-zinc-400 dark:fill-zinc-500"
                  fontSize="10.5"
                >
                  {points[i].label}
                </text>
              ))}

            <path d={area} fill={`url(#${uid}-fill)`} />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 6px 10px color-mix(in oklab, ${color} 45%, transparent))` }}
            />

            {activePoint && (
              <g>
                <line
                  x1={ax}
                  x2={ax}
                  y1={pad.top}
                  y2={pad.top + plotH}
                  stroke={color}
                  strokeOpacity="0.5"
                  strokeDasharray="4 4"
                />
                <circle cx={ax} cy={ay} r="9" fill={color} fillOpacity="0.2" />
                <circle cx={ax} cy={ay} r="4.5" fill={color} stroke="white" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}

        {activePoint && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-zinc-200 bg-white/95 px-2.5 py-1.5 text-center shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95"
            style={{ left: tooltipLeft, top: Math.max(0, ay - 14) }}
          >
            <p className="text-sm font-semibold text-zinc-900 tabular-nums dark:text-zinc-50">
              {fmt(activePoint.value)}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{activePoint.label}</p>
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {activePoint ? `${activePoint.label}: ${fmt(activePoint.value)}` : ""}
      </p>
      <table className="sr-only">
        <caption>
          {title} ({range?.label})
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={`${p.label}-${i}`}>
              <td>{p.label}</td>
              <td>{fmt(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
