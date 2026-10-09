"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";

export interface StreakHeatmapDatum {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  value: number;
}

export interface StreakHeatmapProps {
  data: StreakHeatmapDatum[];
  /** Accessible name for the chart, e.g. "Commits in the last 90 days". */
  label: string;
  /** Last day shown (YYYY-MM-DD). Defaults to the latest date in `data`. */
  end?: string;
  /** Number of days shown, counting back from `end`. */
  days?: number;
  /** Ascending thresholds for intensity levels 1–4. */
  levels?: [number, number, number, number];
  /** Base color for active days. Any CSS color. */
  color?: string;
  /** Unit used in the readout and stats, singular. */
  unit?: string;
  unitPlural?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** Cell size in px. */
  cellSize?: number;
  showStats?: boolean;
  showLegend?: boolean;
  /** Month + weekday labels. */
  showLabels?: boolean;
  /** Called when a day is clicked or activated with Enter / Space. */
  onSelect?: (day: StreakHeatmapDatum) => void;
  className?: string;
}

interface Day {
  date: string;
  ms: number;
  value: number;
  level: number;
}

const DAY_MS = 86_400_000;
const GAP = 3;
const LEVEL_MIX = [0, 32, 55, 78, 100];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_LEVELS: [number, number, number, number] = [1, 3, 6, 10];

const fmtLong = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const fmtShort = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fmtMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseISO(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function toISO(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

function levelFor(value: number, thresholds: number[]) {
  if (value <= 0) return 0;
  let level = 1;
  thresholds.forEach((t, i) => {
    if (value >= t) level = i + 1;
  });
  return level;
}

function streaks(days: Day[]) {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.value > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Current streak counts back from the last day; an empty last day doesn't break it yet.
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].value <= 0) i -= 1;
  while (i >= 0 && days[i].value > 0) {
    current += 1;
    i -= 1;
  }
  return { current, longest };
}

export function StreakHeatmap({
  data,
  label,
  end,
  days = 91,
  levels = DEFAULT_LEVELS,
  color = "#8b5cf6",
  unit = "contribution",
  unitPlural,
  weekStartsOn = 1,
  cellSize = 14,
  showStats = true,
  showLegend = true,
  showLabels = true,
  onSelect,
  className,
}: StreakHeatmapProps) {
  const plural = unitPlural ?? `${unit}s`;
  const count = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? unit : plural}`;

  // Only used when there's no `end` and no data: captured once so renders stay pure.
  const [today] = useState(() => Math.floor(Date.now() / DAY_MS) * DAY_MS);

  const model = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const d of data) byDate.set(d.date, (byDate.get(d.date) ?? 0) + d.value);

    const endMs = end ? parseISO(end) : data.length ? Math.max(...data.map((d) => parseISO(d.date))) : today;
    const total = Math.max(1, Math.round(days));
    const startMs = endMs - (total - 1) * DAY_MS;

    const list: Day[] = Array.from({ length: total }, (_, i) => {
      const ms = startMs + i * DAY_MS;
      const date = toISO(ms);
      const value = byDate.get(date) ?? 0;
      return { date, ms, value, level: levelFor(value, levels) };
    });

    const lead = (new Date(startMs).getUTCDay() - weekStartsOn + 7) % 7;
    const columns = Math.ceil((lead + list.length) / 7);

    // Month label at each column holding the 1st of a month (plus the first column).
    const months: Array<{ column: number; text: string }> = [];
    list.forEach((day, i) => {
      const column = Math.floor((lead + i) / 7);
      const isFirst = new Date(day.ms).getUTCDate() === 1;
      if (i === 0 || isFirst) months.push({ column, text: fmtMonth.format(day.ms) });
    });
    const monthLabels = months.filter((m, i) => !(i === 0 && months[1] && months[1].column - m.column < 3));

    return {
      list,
      lead,
      columns,
      monthLabels,
      total: list.reduce((sum, d) => sum + d.value, 0),
      activeDays: list.filter((d) => d.value > 0).length,
      ...streaks(list),
    };
  }, [data, end, days, levels, weekStartsOn, today]);

  const [focusIndex, setFocusIndex] = useState(model.list.length - 1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const safeFocus = Math.min(focusIndex, model.list.length - 1);
  const shown = model.list[hoverIndex ?? safeFocus];

  const moveFocus = (next: number) => {
    const clamped = Math.max(0, Math.min(model.list.length - 1, next));
    setFocusIndex(clamped);
    cellRefs.current[clamped]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 };
    if (event.key in moves) {
      event.preventDefault();
      moveFocus(index + moves[event.key]);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(model.list.length - 1);
    }
  };

  const fillFor = (level: number) =>
    level === 0 ? undefined : `color-mix(in oklab, ${color} ${LEVEL_MIX[level]}%, transparent)`;

  const pitch = cellSize + GAP;
  const labelWidth = showLabels ? 28 : 0;

  return (
    <figure className={cn("inline-flex max-w-full flex-col gap-4", className)}>
      {showStats && (
        <dl className="grid grid-cols-3 gap-2">
          {[
            { term: "Current streak", value: `${model.current} ${model.current === 1 ? "day" : "days"}` },
            { term: "Longest streak", value: `${model.longest} ${model.longest === 1 ? "day" : "days"}` },
            { term: `Total ${plural}`, value: model.total.toLocaleString("en-US") },
          ].map((stat) => (
            <div
              key={stat.term}
              className="flex flex-col-reverse rounded-xl border border-zinc-200 bg-white/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{stat.term}</dt>
              <dd className="text-lg font-semibold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-100">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="max-w-full overflow-x-auto pb-1">
        <div className="relative" style={{ paddingLeft: labelWidth, paddingTop: showLabels ? 18 : 0 }}>
          {showLabels && (
            <>
              <div aria-hidden="true" className="absolute top-0 right-0" style={{ left: labelWidth }}>
                {model.monthLabels.map((m) => (
                  <span
                    key={`${m.column}-${m.text}`}
                    className="absolute text-[10px] text-zinc-500 dark:text-zinc-400"
                    style={{ left: m.column * pitch }}
                  >
                    {m.text}
                  </span>
                ))}
              </div>
              <div aria-hidden="true" className="absolute left-0 flex flex-col" style={{ top: 18, gap: GAP }}>
                {Array.from({ length: 7 }, (_, row) => (
                  <span
                    key={row}
                    className="text-[10px] leading-none text-zinc-500 dark:text-zinc-400"
                    style={{ height: cellSize, lineHeight: `${cellSize}px` }}
                  >
                    {[1, 3, 5].includes((weekStartsOn + row) % 7) ? WEEKDAYS[(weekStartsOn + row) % 7] : ""}
                  </span>
                ))}
              </div>
            </>
          )}

          <div
            role="group"
            aria-label={`${label}. Use arrow keys to move between days.`}
            className="grid"
            style={{
              gridTemplateRows: `repeat(7, ${cellSize}px)`,
              gridAutoColumns: `${cellSize}px`,
              gridAutoFlow: "column",
              gap: GAP,
              width: model.columns * pitch - GAP,
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {Array.from({ length: model.lead }, (_, i) => (
              <span key={`lead-${i}`} aria-hidden="true" />
            ))}
            {model.list.map((day, i) => (
              <button
                key={day.date}
                ref={(node) => {
                  cellRefs.current[i] = node;
                }}
                type="button"
                tabIndex={i === safeFocus ? 0 : -1}
                aria-label={`${fmtLong.format(day.ms)}: ${day.value > 0 ? count(day.value) : `no ${plural}`}`}
                onFocus={() => setFocusIndex(i)}
                onMouseEnter={() => setHoverIndex(i)}
                onKeyDown={(event) => onKeyDown(event, i)}
                onClick={() => onSelect?.({ date: day.date, value: day.value })}
                className={cn(
                  "rounded-[3px] transition-transform duration-150 hover:scale-125 focus-visible:z-10 focus-visible:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:focus-visible:outline-white",
                  day.level === 0 && "bg-zinc-200/80 dark:bg-zinc-800",
                )}
                style={{ backgroundColor: fillFor(day.level) }}
              />
            ))}
          </div>
        </div>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <span aria-live="polite" className="tabular-nums">
          {shown ? (
            <>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{fmtShort.format(shown.ms)}</span>
              {" · "}
              {shown.value > 0 ? count(shown.value) : `No ${plural}`}
            </>
          ) : null}
        </span>
        {showLegend && (
          <span className="flex items-center gap-1.5" aria-hidden="true">
            Less
            {LEVEL_MIX.map((_, level) => (
              <span
                key={level}
                className={cn("size-2.5 rounded-[2px]", level === 0 && "bg-zinc-200/80 dark:bg-zinc-800")}
                style={{ backgroundColor: fillFor(level) }}
              />
            ))}
            More
          </span>
        )}
      </figcaption>
    </figure>
  );
}
