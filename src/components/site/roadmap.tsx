import type { ComponentEntry } from "@/registry/types";

const WEEKS = 13;
const PER_WEEK = 2;

/** 13-week challenge tracker: two slots per week, filled as components ship. */
export function Roadmap({ items, currentWeek, target }: { items: ComponentEntry[]; currentWeek: number; target: number }) {
  const shipped = new Map<number, number>();
  for (const item of items) shipped.set(item.week, (shipped.get(item.week) ?? 0) + 1);

  return (
    <figure className="rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-black/5 sm:p-5">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">13-week roadmap</span>
        <span className="text-xs text-fg-muted">
          {items.length} shipped · {PER_WEEK} per week · target {target}
        </span>
      </figcaption>
      <ol className="grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:gap-2">
        {Array.from({ length: WEEKS }, (_, i) => {
          const week = i + 1;
          const done = Math.min(PER_WEEK, shipped.get(week) ?? 0);
          const isCurrent = week === currentWeek;
          return (
            <li
              key={week}
              aria-label={`Week ${week}: ${done} of ${PER_WEEK} components${isCurrent ? ", current week" : ""}`}
              className="flex flex-col items-center gap-1.5"
            >
              <div className={`flex w-full flex-col gap-1 rounded-md p-0.5 ${isCurrent ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}>
                {Array.from({ length: PER_WEEK }, (_, slot) => (
                  <span
                    key={slot}
                    className={`h-4 rounded-[4px] sm:h-5 ${slot < done ? "bg-brand shadow-[0_0_12px_var(--glow)]" : "bg-surface-sunken ring-1 ring-line ring-inset"}`}
                  />
                ))}
              </div>
              <span className={`text-[10px] tabular-nums sm:text-xs ${isCurrent ? "font-semibold text-accent" : "text-fg-muted"}`}>
                {week}
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
