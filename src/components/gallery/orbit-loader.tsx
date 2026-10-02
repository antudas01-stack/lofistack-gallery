import type { CSSProperties } from "react";

export type OrbitLoaderSize = "sm" | "md" | "lg";

export interface OrbitLoaderProps {
  /** Preset size or an exact pixel value. */
  size?: OrbitLoaderSize | number;
  /** Number of concentric orbits (1–3). */
  orbits?: 1 | 2 | 3;
  /** Seconds for the outer orbit to complete one revolution. */
  speed?: number;
  /** Arc + head color. Any CSS color; defaults to the current text color. */
  color?: string;
  /** Track color. Defaults to `color` at low opacity. */
  trackColor?: string;
  /** 0–100. When set, the outer orbit becomes a determinate progress ring. */
  progress?: number;
  /** Accessible label, also used as the visible caption. */
  label?: string;
  /** Render the label (and percentage, if determinate) under the loader. */
  showLabel?: boolean;
  /** Freeze the animation without unmounting (e.g. while a request is queued). */
  paused?: boolean;
  className?: string;
}

const SIZE_MAP: Record<OrbitLoaderSize, number> = { sm: 32, md: 48, lg: 72 };
const RADII = [44, 31, 18] as const;
const ARC_FRACTION = [0.28, 0.36, 0.5] as const;
const STROKE = 5;

const KEYFRAMES = `
@keyframes ls-orbit-spin { to { transform: rotate(360deg); } }
.ls-orbit-spin { transform-origin: 50px 50px; animation: ls-orbit-spin var(--ls-orbit-d, 1.6s) linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .ls-orbit-spin { animation-duration: calc(var(--ls-orbit-d, 1.6s) * 4); }
}`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pointOnCircle(radius: number, fraction: number) {
  const angle = fraction * Math.PI * 2;
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) };
}

export function OrbitLoader({
  size = "md",
  orbits = 3,
  speed = 1.6,
  color = "currentColor",
  trackColor,
  progress,
  label = "Loading",
  showLabel = false,
  paused = false,
  className,
}: OrbitLoaderProps) {
  const px = typeof size === "number" ? size : SIZE_MAP[size];
  const count = Math.min(3, Math.max(1, Math.round(orbits)));
  const determinate = typeof progress === "number" && Number.isFinite(progress);
  const value = determinate ? Math.min(100, Math.max(0, progress)) : 0;
  const track = trackColor ?? color;
  const caption = determinate ? `${label} · ${Math.round(value)}%` : label;

  const a11y = determinate
    ? {
        role: "progressbar" as const,
        "aria-label": label,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        "aria-valuenow": Math.round(value),
      }
    : { role: "status" as const, "aria-live": "polite" as const };

  return (
    <div {...a11y} className={cn("inline-flex flex-col items-center gap-2", className)}>
      <style href="ls-orbit-loader" precedence="default">
        {KEYFRAMES}
      </style>
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="shrink-0 overflow-visible"
      >
        {RADII.slice(0, count).map((r, i) => {
          const circumference = 2 * Math.PI * r;
          const isProgressRing = determinate && i === 0;
          const reverse = i % 2 === 1;
          const spinStyle = {
            "--ls-orbit-d": `${speed * (1 + i * 0.45)}s`,
            animationDirection: reverse ? "reverse" : "normal",
            animationPlayState: paused ? "paused" : "running",
          } as CSSProperties;

          if (isProgressRing) {
            const head = pointOnCircle(r, value / 100);
            return (
              <g key={r}>
                <circle cx={50} cy={50} r={r} stroke={track} strokeOpacity={0.15} strokeWidth={STROKE} />
                <g transform="rotate(-90 50 50)">
                  <circle
                    cx={50}
                    cy={50}
                    r={r}
                    stroke={color}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - value / 100)}
                    style={{ transition: "stroke-dashoffset 400ms ease" }}
                  />
                  <circle cx={head.x} cy={head.y} r={STROKE * 0.95} fill={color} />
                </g>
              </g>
            );
          }

          const arc = circumference * ARC_FRACTION[i];
          const head = reverse ? pointOnCircle(r, 0) : pointOnCircle(r, ARC_FRACTION[i]);
          return (
            <g key={r}>
              <circle cx={50} cy={50} r={r} stroke={track} strokeOpacity={0.15} strokeWidth={STROKE} />
              <g className="ls-orbit-spin" style={spinStyle}>
                <circle
                  cx={50}
                  cy={50}
                  r={r}
                  stroke={color}
                  strokeOpacity={1 - i * 0.2}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${arc} ${circumference}`}
                />
                <circle cx={head.x} cy={head.y} r={STROKE * 0.95} fill={color} fillOpacity={1 - i * 0.2} />
              </g>
            </g>
          );
        })}
      </svg>
      {showLabel ? (
        <span className="text-xs font-medium tabular-nums opacity-80">{caption}</span>
      ) : (
        <span className="sr-only">{caption}</span>
      )}
    </div>
  );
}
