"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";

export type HoldButtonTone = "danger" | "primary" | "neutral";
export type HoldButtonSize = "sm" | "md" | "lg";
type Phase = "idle" | "holding" | "pending" | "confirmed";

export interface HoldToConfirmButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "onConfirm"
> {
  /** Resting label, e.g. "Delete project". */
  label: string;
  /** Shown while the user is holding. */
  holdingLabel?: string;
  /** Shown after the hold completes. */
  confirmedLabel?: string;
  /** How long the user must hold, in milliseconds. */
  duration?: number;
  /** Runs when the hold completes. Return a promise to show a pending state. */
  onConfirm: () => void | Promise<unknown>;
  tone?: HoldButtonTone;
  size?: HoldButtonSize;
  /** Icon shown before the resting label. */
  icon?: ReactNode;
  /** Return to idle this many ms after confirming. 0 keeps the confirmed state. */
  resetAfter?: number;
  ref?: Ref<HTMLButtonElement>;
}

const TONES: Record<HoldButtonTone, { base: string; fill: string; focus: string }> = {
  danger: {
    base: "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15",
    fill: "bg-rose-600 text-white",
    focus: "focus-visible:ring-rose-500",
  },
  primary: {
    base: "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15",
    fill: "bg-indigo-600 text-white",
    focus: "focus-visible:ring-indigo-500",
  },
  neutral: {
    base: "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
    fill: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
    focus: "focus-visible:ring-zinc-500",
  },
};

const SIZES: Record<HoldButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

const KEYFRAMES = `
@keyframes ls-hold-pop { 0% { transform: scale(1); } 40% { transform: scale(1.045); } 100% { transform: scale(1); } }
@keyframes ls-hold-burst { 0% { box-shadow: 0 0 0 0 var(--ls-hold-burst); } 100% { box-shadow: 0 0 0 14px transparent; } }
.ls-hold[data-phase="confirmed"] { animation: ls-hold-pop 420ms cubic-bezier(.2,.8,.2,1), ls-hold-burst 600ms ease-out; }
@media (prefers-reduced-motion: reduce) { .ls-hold[data-phase="confirmed"] { animation: none; } }`;

const BURST: Record<HoldButtonTone, string> = {
  danger: "rgb(225 29 72 / 0.45)",
  primary: "rgb(79 70 229 / 0.45)",
  neutral: "rgb(113 113 122 / 0.45)",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function CheckIcon() {
  return (
    <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 shrink-0 animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function HoldToConfirmButton({
  label,
  holdingLabel = "Keep holding…",
  confirmedLabel = "Done",
  duration = 1500,
  onConfirm,
  tone = "danger",
  size = "md",
  icon,
  resetAfter = 2000,
  disabled,
  className,
  ref,
  onBlur,
  ...buttonProps
}: HoldToConfirmButtonProps) {
  const hintId = useId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  // The timer decides completion; animation frames only paint the fill, so a
  // throttled or hidden tab can't stall the action.
  const stopHold = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    if (timer.current !== null) clearTimeout(timer.current);
    frame.current = null;
    timer.current = null;
  };

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "confirmed" || resetAfter <= 0) return;
    const reset = setTimeout(() => {
      setPhase("idle");
      setProgress(0);
    }, resetAfter);
    return () => clearTimeout(reset);
  }, [phase, resetAfter]);

  const complete = async () => {
    stopHold();
    setProgress(1);
    const result = onConfirm();
    if (result instanceof Promise) {
      setPhase("pending");
      try {
        await result;
      } catch {
        setPhase("idle");
        setProgress(0);
        return;
      }
    }
    setPhase("confirmed");
  };

  const begin = () => {
    if (disabled || phase !== "idle") return;
    const total = Math.max(1, duration);
    setPhase("holding");
    startedAt.current = performance.now();
    timer.current = setTimeout(() => void complete(), total);
    const paint = (now: number) => {
      setProgress(Math.min(0.999, (now - startedAt.current) / total));
      frame.current = requestAnimationFrame(paint);
    };
    frame.current = requestAnimationFrame(paint);
  };

  const cancel = () => {
    if (phase !== "holding") return;
    stopHold();
    setPhase("idle");
    setProgress(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already released (e.g. a very fast tap); holding still works without capture.
    }
    begin();
  };

  const isHoldKey = (event: KeyboardEvent) => event.key === " " || event.key === "Enter";

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isHoldKey(event)) return;
    event.preventDefault();
    if (!event.repeat) begin();
  };

  const onKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isHoldKey(event)) return;
    event.preventDefault();
    cancel();
  };

  const styles = TONES[tone];
  const busy = phase === "pending" || phase === "confirmed";
  const seconds = (duration / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
  const announcement =
    phase === "holding" ? holdingLabel : phase === "pending" ? "Working…" : phase === "confirmed" ? confirmedLabel : "";

  const views: Array<{ key: Phase | "rest"; text: string; lead: ReactNode }> = [
    { key: "rest", text: label, lead: icon },
    { key: "holding", text: holdingLabel, lead: null },
    { key: "pending", text: label, lead: <Spinner /> },
    { key: "confirmed", text: confirmedLabel, lead: <CheckIcon /> },
  ];
  const activeView = phase === "idle" ? "rest" : phase;

  // Every label is stacked in one grid cell so the button never changes width.
  const content = (
    <span className="grid">
      {views.map((view) => (
        <span
          key={view.key}
          className={cn(
            "col-start-1 row-start-1 flex items-center justify-center gap-2 whitespace-nowrap [&_svg]:size-4",
            view.key !== activeView && "invisible",
          )}
        >
          {view.lead}
          {view.text}
        </span>
      ))}
    </span>
  );

  return (
    <>
      <button
        {...buttonProps}
        ref={ref}
        type="button"
        disabled={disabled}
        aria-disabled={busy || undefined}
        aria-describedby={hintId}
        data-phase={phase}
        onPointerDown={onPointerDown}
        onPointerUp={cancel}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={(event) => {
          cancel();
          onBlur?.(event);
        }}
        onContextMenu={(event) => event.preventDefault()}
        style={{ ["--ls-hold-burst" as string]: BURST[tone] }}
        className={cn(
          "ls-hold relative isolate inline-flex touch-none items-center justify-center overflow-hidden rounded-xl border font-semibold select-none [-webkit-touch-callout:none]",
          "transition-[transform,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          phase === "holding" && "scale-[0.97]",
          busy ? "cursor-default" : "cursor-pointer",
          styles.base,
          styles.focus,
          SIZES[size],
          className,
        )}
      >
        <style href="ls-hold-to-confirm" precedence="default">
          {KEYFRAMES}
        </style>
        {content}
        {/* Fill layer: a solid copy of the content revealed left-to-right as the hold progresses */}
        <span
          aria-hidden="true"
          className={cn("absolute inset-0 flex items-center justify-center", styles.fill)}
          style={{
            clipPath: `inset(0 ${100 - progress * 100}% 0 0)`,
            transition: phase === "holding" ? "none" : "clip-path 380ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {content}
        </span>
      </button>
      <span id={hintId} className="sr-only">
        Press and hold for {seconds} seconds to confirm.
      </span>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
