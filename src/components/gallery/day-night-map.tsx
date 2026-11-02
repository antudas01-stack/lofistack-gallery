"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { LAND_MASK } from "./world-land-mask";

export interface MapLocation {
  id: string;
  name: string;
  country?: string;
  lat: number;
  lng: number;
  /** IANA time zone, e.g. "Asia/Dhaka". */
  timeZone: string;
  /** Extra line in the detail card, e.g. "HQ · 42 people". */
  note?: string;
}

export interface DayNightMapProps {
  locations: MapLocation[];
  title?: string;
  description?: string;
  /** Show the time scrubber, Play and Now controls. */
  showControls?: boolean;
  /** Show the synced list of locations under the map. */
  showList?: boolean;
  defaultSelectedId?: string;
  onSelect?: (location: MapLocation) => void;
  /** Land dots in daylight. */
  dayColor?: string;
  /** Land dots at night. */
  nightColor?: string;
  /** City-light glow at night. */
  lightColor?: string;
  className?: string;
}

type Phase = "day" | "twilight" | "night";

const DEG = Math.PI / 180;
const ASPECT = 360 / (LAND_MASK.latTop - LAND_MASK.latBottom);
const KEYFRAMES = `
@keyframes ls-dn-pulse { 0% { transform: scale(.6); opacity: .7; } 100% { transform: scale(2.6); opacity: 0; } }
.ls-dn-pulse { animation: ls-dn-pulse 2.2s ease-out infinite; }
@media (prefers-reduced-motion: reduce) { .ls-dn-pulse { animation: none; opacity: 0; } }`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Shared minute-ish clock; null during SSR so server and client agree.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 15_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
const readNow = () => Math.floor(Date.now() / 15_000) * 15_000;

/** Approximate subsolar point (NOAA low-precision formulas, good to ~0.5°). */
export function subsolarPoint(ms: number) {
  const d = ms / 86_400_000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * DEG;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG;
  const e = (23.439 - 0.00000036 * d) * DEG;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / DEG / 15;
  const decl = Math.asin(Math.sin(e) * Math.sin(L)) / DEG;
  let eqTime = q / 15 - ra; // hours
  eqTime = ((((eqTime + 12) % 24) + 24) % 24) - 12;
  const utcHours = (((ms % 86_400_000) + 86_400_000) % 86_400_000) / 3_600_000;
  let lng = -15 * (utcHours - 12 + eqTime);
  lng = ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat: decl, lng };
}

/** Sine of the sun's altitude at a point. */
function sunSine(lat: number, lng: number, sun: { lat: number; lng: number }) {
  return (
    Math.sin(lat * DEG) * Math.sin(sun.lat * DEG) +
    Math.cos(lat * DEG) * Math.cos(sun.lat * DEG) * Math.cos((lng - sun.lng) * DEG)
  );
}

function phaseOf(sine: number): Phase {
  const alt = Math.asin(sine) / DEG;
  return alt > -0.833 ? "day" : alt > -6 ? "twilight" : "night";
}

function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function decodeLand() {
  const bin = atob(LAND_MASK.data);
  const perRow = Math.ceil(LAND_MASK.cols / 8);
  const cells: Array<{ r: number; c: number; lat: number; lng: number }> = [];
  for (let r = 0; r < LAND_MASK.rows; r++) {
    for (let c = 0; c < LAND_MASK.cols; c++) {
      if ((bin.charCodeAt(r * perRow + (c >> 3)) >> (7 - (c & 7))) & 1) {
        cells.push({
          r,
          c,
          lat: LAND_MASK.latTop - (r + 0.5) * LAND_MASK.step,
          lng: -180 + (c + 0.5) * LAND_MASK.step,
        });
      }
    }
  }
  return cells;
}

const toPct = (lat: number, lng: number) => ({
  left: ((lng + 180) / 360) * 100,
  top: ((LAND_MASK.latTop - lat) / (LAND_MASK.latTop - LAND_MASK.latBottom)) * 100,
});

const PHASE_ICON: Record<Phase, string> = { day: "☀", twilight: "◐", night: "☾" };
const PHASE_LABEL: Record<Phase, string> = { day: "Daytime", twilight: "Twilight", night: "Night" };

function formatOffset(minutes: number) {
  if (minutes === 0) return "Now";
  const sign = minutes > 0 ? "+" : "−";
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${sign}${h}h${m ? ` ${m}m` : ""}`;
}

export function DayNightMap({
  locations,
  title = "Around the world, right now",
  description = "Live daylight across the globe. Drag the timeline to watch night sweep across your locations.",
  showControls = true,
  showList = true,
  defaultSelectedId,
  onSelect,
  dayColor = "#fcd34d",
  nightColor = "#6d7bd8",
  lightColor = "#fde68a",
  className,
}: DayNightMapProps) {
  const uid = useId();
  const now = useSyncExternalStore(subscribe, readNow, () => null);
  const [offset, setOffset] = useState(0); // minutes from now
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(defaultSelectedId);
  const [hovered, setHovered] = useState<string | null>(null);
  const [observedWidth, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const land = useMemo(() => (typeof window === "undefined" ? [] : decodeLand()), []);
  const time = now === null ? null : now + offset * 60_000;
  const sun = time === null ? null : subsolarPoint(time);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Play: sweep forward to +24h from where the slider is, then return to "now".
  const playFrom = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let o = playFrom.current;
    const id = setInterval(() => {
      o += 20;
      if (o >= 24 * 60) {
        setPlaying(false);
        setOffset(0);
        return;
      }
      setOffset(o);
    }, 60);
    return () => clearInterval(id);
  }, [playing]);

  // Draw the dotted land, coloured by sun altitude, plus a soft daylight bloom.
  useEffect(() => {
    const canvas = canvasRef.current;
    // Read the size directly so the first paint never waits on the observer;
    // `width` (from the ResizeObserver) only re-triggers this effect on resize.
    const width = Math.round(wrapRef.current?.clientWidth ?? 0);
    if (!canvas || !width || time === null) return;
    const sun = subsolarPoint(time);
    const height = Math.round(width / ASPECT);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const sx = ((sun.lng + 180) / 360) * width;
    const sy = ((LAND_MASK.latTop - sun.lat) / (LAND_MASK.latTop - LAND_MASK.latBottom)) * height;
    for (const shift of [-width, 0, width]) {
      const bloom = ctx.createRadialGradient(sx + shift, sy, 0, sx + shift, sy, width * 0.32);
      bloom.addColorStop(0, `rgba(${rgb(dayColor).join(",")},0.16)`);
      bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, width, height);
    }

    const cw = width / LAND_MASK.cols;
    const ch = height / LAND_MASK.rows;
    const radius = Math.max(0.6, Math.min(cw, ch) * 0.34);
    const [dr, dg, db] = rgb(dayColor);
    const [nr, ng, nb] = rgb(nightColor);
    for (const cell of land) {
      // 0 = deep night, 1 = full day, smooth through twilight.
      const t = Math.min(1, Math.max(0, (sunSine(cell.lat, cell.lng, sun) + 0.1) / 0.2));
      const a = 0.32 + t * 0.58;
      ctx.fillStyle = `rgba(${Math.round(nr + (dr - nr) * t)},${Math.round(ng + (dg - ng) * t)},${Math.round(nb + (db - nb) * t)},${a})`;
      ctx.beginPath();
      ctx.arc((cell.c + 0.5) * cw, (cell.r + 0.5) * ch, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [land, observedWidth, time, dayColor, nightColor]);

  const info = locations.map((loc) => {
    const phase = sun ? phaseOf(sunSine(loc.lat, loc.lng, sun)) : null;
    const altitude = sun ? Math.round(Math.asin(sunSine(loc.lat, loc.lng, sun)) / DEG) : null;
    const clock =
      time === null
        ? "--:--"
        : new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: loc.timeZone }).format(time);
    const day =
      time === null ? "" : new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: loc.timeZone }).format(time);
    return { loc, phase, altitude, clock, day };
  });

  const activeId = hovered ?? selected;
  const active = info.find((i) => i.loc.id === activeId);
  const nightCount = info.filter((i) => i.phase === "night").length;
  const utcLabel =
    time === null
      ? "--:-- UTC"
      : `${new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }).format(time)} UTC`;

  const choose = (loc: MapLocation) => {
    setSelected(loc.id);
    onSelect?.(loc);
  };

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl bg-[#060a16] p-5 text-slate-100 ring-1 ring-white/10 sm:p-7",
        className,
      )}
    >
      <style href="ls-day-night-map" precedence="default">
        {KEYFRAMES}
      </style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"
      />

      <header className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.25em] text-amber-200/80 uppercase">Day · Night</p>
          <h2 id={`${uid}-title`} className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-slate-400">
          <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-slate-200 tabular-nums ring-1 ring-white/10">
            {utcLabel}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: dayColor }} /> Day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: nightColor }} /> Night
            </span>
            <span className="tabular-nums">{now === null ? "" : `${nightCount}/${locations.length} asleep`}</span>
          </span>
        </div>
      </header>

      <div ref={wrapRef} className="relative mt-6 w-full" style={{ aspectRatio: `${ASPECT}` }}>
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

        {sun && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              ...(() => {
                const p = toPct(sun.lat, sun.lng);
                return { left: `${p.left}%`, top: `${p.top}%` };
              })(),
              background: dayColor,
              boxShadow: `0 0 18px 6px ${dayColor}aa, 0 0 60px 20px ${dayColor}33`,
            }}
          />
        )}

        {info.map(({ loc, phase, clock }) => {
          const p = toPct(loc.lat, loc.lng);
          const isNight = phase === "night";
          const isActive = loc.id === activeId;
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => choose(loc)}
              onPointerEnter={() => setHovered(loc.id)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(loc.id)}
              onBlur={() => setHovered(null)}
              aria-pressed={loc.id === selected}
              aria-label={`${loc.name}${loc.country ? `, ${loc.country}` : ""}: ${clock}${phase ? `, ${PHASE_LABEL[phase].toLowerCase()}` : ""}`}
              className="group absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
            >
              {isNight && (
                <span
                  aria-hidden="true"
                  className="ls-dn-pulse absolute inset-1.5 rounded-full"
                  style={{ background: lightColor }}
                />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "relative rounded-full transition-all duration-300",
                  isActive ? "size-3 ring-2 ring-white" : "size-2",
                )}
                style={{
                  background: isNight ? lightColor : "#ffffff",
                  boxShadow: isNight ? `0 0 10px 3px ${lightColor}` : "0 0 0 2px rgb(255 255 255 / .25)",
                }}
              />
            </button>
          );
        })}

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute z-20 w-48 -translate-x-1/2 rounded-2xl bg-slate-900/90 p-3 shadow-2xl ring-1 ring-white/15 backdrop-blur"
            style={(() => {
              const p = toPct(active.loc.lat, active.loc.lng);
              const below = p.top < 35;
              return {
                left: `${Math.min(88, Math.max(12, p.left))}%`,
                top: below ? `calc(${p.top}% + 16px)` : undefined,
                bottom: below ? undefined : `calc(${100 - p.top}% + 16px)`,
              };
            })()}
          >
            <p className="text-sm font-semibold">
              {active.loc.name}
              {active.loc.country && <span className="font-normal text-slate-400">, {active.loc.country}</span>}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">{active.clock}</span>
              <span className="text-xs text-slate-400">{active.day}</span>
            </p>
            {active.phase && (
              <p className="mt-1 text-xs text-slate-300">
                <span aria-hidden="true" className="mr-1 text-amber-200">
                  {PHASE_ICON[active.phase]}
                </span>
                {PHASE_LABEL[active.phase]} · sun {Math.abs(active.altitude ?? 0)}°{" "}
                {(active.altitude ?? 0) >= 0 ? "up" : "below"}
              </p>
            )}
            {active.loc.note && (
              <p className="mt-1.5 border-t border-white/10 pt-1.5 text-xs text-slate-400">{active.loc.note}</p>
            )}
          </div>
        )}
      </div>

      {showControls && (
        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!playing) playFrom.current = offset >= 24 * 60 ? 0 : offset;
              setPlaying(!playing);
            }}
            aria-label={playing ? "Pause time-lapse" : "Play 24-hour time-lapse"}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-300 text-slate-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a16] active:scale-95"
          >
            {playing ? (
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="ml-0.5 size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5Z" />
              </svg>
            )}
          </button>
          <label className="flex min-w-48 flex-1 items-center gap-3">
            <span className="sr-only">Time offset from now</span>
            <input
              type="range"
              min={-12 * 60}
              max={24 * 60}
              step={15}
              value={offset}
              onChange={(e) => {
                setPlaying(false);
                setOffset(Number(e.target.value));
              }}
              aria-valuetext={formatOffset(offset)}
              className="h-1.5 w-full cursor-pointer accent-amber-300"
            />
            <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-300 tabular-nums">
              {formatOffset(offset)}
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setOffset(0);
            }}
            disabled={offset === 0 && !playing}
            className="rounded-full px-3.5 py-2 text-xs font-semibold text-slate-200 ring-1 ring-white/15 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-40"
          >
            Now
          </button>
        </div>
      )}

      {showList && (
        <ul className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Locations">
          {info.map(({ loc, phase, clock, day }) => (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => choose(loc)}
                onPointerEnter={() => setHovered(loc.id)}
                onPointerLeave={() => setHovered(null)}
                aria-pressed={loc.id === selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200",
                  loc.id === activeId
                    ? "bg-white/10 ring-white/25"
                    : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.07]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm",
                    phase === "night"
                      ? "bg-indigo-500/20 text-indigo-200"
                      : phase === "twilight"
                        ? "bg-orange-400/20 text-orange-200"
                        : "bg-amber-300/20 text-amber-200",
                  )}
                >
                  {phase ? PHASE_ICON[phase] : "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{loc.name}</span>
                  <span className="block text-xs text-slate-400">{phase ? PHASE_LABEL[phase] : "—"}</span>
                </span>
                <span className="text-right">
                  <span className="block font-mono text-sm tabular-nums">{clock}</span>
                  <span className="block text-[11px] text-slate-500">{day}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
