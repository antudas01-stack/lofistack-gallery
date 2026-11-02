"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from "react";

export type InvitationTheme = "ivory" | "midnight" | "blush" | "sage";
export type RsvpResponse = "yes" | "maybe" | "no";

export interface FlipInvitationProps {
  /** Names shown on the front, e.g. "Aria Rahman & Leo Das". */
  hosts: string;
  /** Large foil monogram. Defaults to the hosts' initials joined with "&". */
  monogram?: string;
  /** Small line above the monogram. */
  preface?: string;
  /** Line under the names, e.g. "request the pleasure of your company". */
  message?: string;
  /** ISO date-time with offset, e.g. "2026-12-12T18:00:00+06:00". */
  eventDate: string;
  /** IANA zone the event happens in, used for every displayed time. */
  timeZone?: string;
  /** Event length in hours (calendar file + "happening now"). */
  durationHours?: number;
  venue: string;
  address?: string;
  mapUrl?: string;
  dressCode?: string;
  /** e.g. "Please reply by Nov 30". */
  rsvpNote?: string;
  theme?: InvitationTheme;
  /** Called with the guest's answer. Return a promise to show a saving state. */
  onRsvp?: (response: RsvpResponse) => void | Promise<unknown>;
  defaultResponse?: RsvpResponse;
  /** Show the "Add to calendar" (.ics download) link. */
  showCalendar?: boolean;
  defaultFlipped?: boolean;
  className?: string;
}

const THEMES: Record<InvitationTheme, Record<string, string>> = {
  ivory: {
    "--inv-paper": "#fbf7ef",
    "--inv-ink": "#3b2f2a",
    "--inv-muted": "#7a6a5f",
    "--inv-line": "#dccaa8",
    "--inv-foil-a": "#a8772c",
    "--inv-foil-b": "#f3d9a4",
    "--inv-btn": "#3b2f2a",
    "--inv-btn-ink": "#fbf7ef",
  },
  midnight: {
    "--inv-paper": "#141a2e",
    "--inv-ink": "#f1e9d8",
    "--inv-muted": "#a9b0c7",
    "--inv-line": "#3b4566",
    "--inv-foil-a": "#c9a24e",
    "--inv-foil-b": "#f7e3b0",
    "--inv-btn": "#f1e9d8",
    "--inv-btn-ink": "#141a2e",
  },
  blush: {
    "--inv-paper": "#fbeef0",
    "--inv-ink": "#4a2a33",
    "--inv-muted": "#87606b",
    "--inv-line": "#ecc3cb",
    "--inv-foil-a": "#a85d6b",
    "--inv-foil-b": "#f6cdd5",
    "--inv-btn": "#4a2a33",
    "--inv-btn-ink": "#fbeef0",
  },
  sage: {
    "--inv-paper": "#eef2ea",
    "--inv-ink": "#2f3a2e",
    "--inv-muted": "#5f6e5c",
    "--inv-line": "#c5d3bb",
    "--inv-foil-a": "#5d7f50",
    "--inv-foil-b": "#d3e6c4",
    "--inv-btn": "#2f3a2e",
    "--inv-btn-ink": "#eef2ea",
  },
};

const RESPONSES: Array<{ value: RsvpResponse; label: string; done: string }> = [
  { value: "yes", label: "Accept", done: "You're on the list. See you there!" },
  { value: "maybe", label: "Maybe", done: "Noted. We'll save you a seat just in case." },
  { value: "no", label: "Decline", done: "We'll miss you. Thanks for letting us know." },
];

// Font roles. The host app can load real fonts into these CSS variables (e.g. with next/font);
// otherwise the stacks fall back to locally installed faces.

const KEYFRAMES = `
@keyframes ls-inv-sheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
.ls-inv { font-family: var(--inv-font-serif, "Cormorant Garamond", "Cormorant", Georgia, serif); }
.ls-inv-script { font-family: var(--inv-font-script, "Pinyon Script", "Great Vibes", "Snell Roundhand", cursive); font-weight: 400; }
.ls-inv-caps { font-family: var(--inv-font-caps, "Cinzel", "Trajan Pro", Georgia, serif); }
.ls-inv-foil {
  background: linear-gradient(110deg, var(--inv-foil-a) 20%, var(--inv-foil-b) 40%, var(--inv-foil-a) 60%, var(--inv-foil-b) 80%);
  background-size: 200% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: ls-inv-sheen 6s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .ls-inv { font-family: var(--inv-font-serif, "Cormorant Garamond", "Cormorant", Georgia, serif); }
.ls-inv-script { font-family: var(--inv-font-script, "Pinyon Script", "Great Vibes", "Snell Roundhand", cursive); font-weight: 400; }
.ls-inv-caps { font-family: var(--inv-font-caps, "Cinzel", "Trajan Pro", Georgia, serif); }
.ls-inv-foil { animation: none; }
  .ls-inv-flipper { transition: none !important; }
}`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Ticking clock shared by every invitation on the page; null on the server.
let clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) clockTimer = setInterval(() => clockListeners.forEach((l) => l()), 1000);
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
      clockListeners = new Set();
    }
  };
}
const readClock = () => Math.floor(Date.now() / 1000) * 1000;

function initials(hosts: string) {
  const parts = hosts.split(/\s*(?:&|and)\s*/i).filter(Boolean);
  return parts.map((p) => p.trim()[0]?.toUpperCase()).join(" & ");
}

function icsDate(ms: number) {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function Flourish() {
  return (
    <svg viewBox="0 0 120 12" className="h-3 w-28" aria-hidden="true">
      <path d="M2 6h44M74 6h44" stroke="var(--inv-line)" strokeWidth="1" />
      <path d="M60 1l3 5-3 5-3-5z" fill="var(--inv-foil-a)" />
      <circle cx="50" cy="6" r="1.4" fill="var(--inv-foil-a)" />
      <circle cx="70" cy="6" r="1.4" fill="var(--inv-foil-a)" />
    </svg>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("absolute size-9", className)} aria-hidden="true">
      <path d="M4 36V12a8 8 0 0 1 8-8h24" fill="none" stroke="var(--inv-foil-a)" strokeWidth="1.2" />
      <path d="M9 36V16a7 7 0 0 1 7-7h20" fill="none" stroke="var(--inv-line)" strokeWidth="1" />
      <circle cx="12" cy="12" r="2" fill="var(--inv-foil-a)" />
    </svg>
  );
}

export function FlipInvitation({
  hosts,
  monogram,
  preface = "Together with their families",
  message = "request the pleasure of your company at their wedding",
  eventDate,
  timeZone = "UTC",
  durationHours = 5,
  venue,
  address,
  mapUrl,
  dressCode,
  rsvpNote,
  theme = "ivory",
  onRsvp,
  defaultResponse,
  showCalendar = true,
  defaultFlipped = false,
  className,
}: FlipInvitationProps) {
  const uid = useId();
  const [flipped, setFlipped] = useState(defaultFlipped);
  const [response, setResponse] = useState<RsvpResponse | undefined>(defaultResponse);
  const [saving, setSaving] = useState<RsvpResponse | null>(null);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const backHeadingRef = useRef<HTMLHeadingElement>(null);
  const frontButtonRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef(false);
  const now = useSyncExternalStore(subscribeClock, readClock, () => null);

  // After a user flip, move focus to the face that just became visible.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    (flipped ? backHeadingRef.current : frontButtonRef.current)?.focus({ preventScroll: true });
  }, [flipped]);

  const start = Date.parse(eventDate);
  const end = start + durationHours * 3_600_000;
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  });
  const frontDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone })
    .format(start)
    .replace(/,/g, " ·");
  const year = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(start);

  const left = now === null ? null : Math.max(0, start - now);
  const countdown =
    left === null
      ? null
      : [
          { label: "Days", value: Math.floor(left / 86_400_000) },
          { label: "Hours", value: Math.floor(left / 3_600_000) % 24 },
          { label: "Min", value: Math.floor(left / 60_000) % 60 },
          { label: "Sec", value: Math.floor(left / 1000) % 60 },
        ];
  const phase = now === null ? "upcoming" : now < start ? "upcoming" : now < end ? "live" : "past";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LofiStack//Flip Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${start}-${hosts.replace(/\W+/g, "")}@lofistack`,
    `DTSTAMP:${icsDate(start)}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${hosts}`,
    `LOCATION:${[venue, address].filter(Boolean).join(", ").replace(/,/g, "\\,")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const flip = (next: boolean) => {
    pendingFocus.current = true;
    setFlipped(next);
  };

  const answer = async (value: RsvpResponse) => {
    setError(false);
    const result = onRsvp?.(value);
    if (result instanceof Promise) {
      setSaving(value);
      try {
        await result;
      } catch {
        setSaving(null);
        setError(true);
        return;
      }
      setSaving(null);
    }
    setResponse(value);
  };

  // Gentle 3D tilt that follows the pointer (skipped for touch).
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    wrapRef.current.style.setProperty("--inv-rx", `${(-y * 8).toFixed(2)}deg`);
    wrapRef.current.style.setProperty("--inv-ry", `${(x * 10).toFixed(2)}deg`);
  };
  const resetTilt = () => {
    wrapRef.current?.style.setProperty("--inv-rx", "0deg");
    wrapRef.current?.style.setProperty("--inv-ry", "0deg");
  };

  const chosen = RESPONSES.find((r) => r.value === response);
  const face = "absolute inset-0 overflow-hidden rounded-[20px] border shadow-[0_24px_50px_-18px_rgb(0_0_0/0.45)]";
  const faceStyle: CSSProperties = {
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    background: "var(--inv-paper)",
    borderColor: "var(--inv-line)",
    color: "var(--inv-ink)",
  };

  return (
    <div
      ref={wrapRef}
      onPointerMove={onPointerMove}
      onPointerLeave={resetTilt}
      className={cn(
        "ls-inv relative aspect-[5/7] min-h-[476px] w-full max-w-[340px] select-none [perspective:1600px]",
        className,
      )}
      style={{ ...(THEMES[theme] as CSSProperties), ["--inv-rx" as string]: "0deg", ["--inv-ry" as string]: "0deg" }}
    >
      <style href="ls-flip-invitation" precedence="default">
        {KEYFRAMES}
      </style>
      <div
        className="ls-inv-flipper relative size-full"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(var(--inv-rx)) rotateY(calc(${flipped ? 180 : 0}deg + var(--inv-ry)))`,
          transition: "transform 900ms cubic-bezier(.2,.8,.2,1)",
        }}
      >
        {/* Front */}
        <section className={face} style={faceStyle} inert={flipped} aria-hidden={flipped}>
          <button
            ref={frontButtonRef}
            type="button"
            onClick={() => flip(true)}
            aria-label={`Invitation from ${hosts}. Open to see the details.`}
            className="group relative flex size-full flex-col items-center justify-center px-8 text-center focus-visible:outline-none"
          >
            <span
              className="pointer-events-none absolute inset-3 rounded-[14px] border"
              style={{ borderColor: "var(--inv-line)" }}
            />
            <span
              className="pointer-events-none absolute inset-[18px] rounded-[10px] border border-dashed opacity-60"
              style={{ borderColor: "var(--inv-line)" }}
            />
            <Corner className="top-5 left-5" />
            <Corner className="top-5 right-5 rotate-90" />
            <Corner className="right-5 bottom-5 rotate-180" />
            <Corner className="bottom-5 left-5 -rotate-90" />

            <span className="ls-inv-caps text-[10px] tracking-[0.28em] uppercase" style={{ color: "var(--inv-muted)" }}>
              {preface}
            </span>
            <span className="ls-inv-foil ls-inv-script mt-4 px-2 pb-2 text-[4.75rem] leading-[1.05]">
              {monogram ?? initials(hosts)}
            </span>
            <span className="mt-2">
              <Flourish />
            </span>
            <span className="ls-inv-script mt-3 text-[1.7rem] leading-[1.2] text-balance">{hosts}</span>
            <span className="mt-2 max-w-[15rem] text-[15px] leading-snug italic" style={{ color: "var(--inv-muted)" }}>
              {message}
            </span>
            <span className="ls-inv-caps mt-5 text-[11px] tracking-[0.16em] uppercase">{frontDate}</span>
            <span className="ls-inv-caps text-[11px] tracking-[0.3em]" style={{ color: "var(--inv-muted)" }}>
              {year}
            </span>

            <span
              className="absolute bottom-7 flex items-center gap-1.5 ls-inv-caps rounded-full border px-3 py-1 text-[9px] tracking-[0.2em] uppercase transition group-hover:gap-2.5 group-focus-visible:ring-2"
              style={{
                borderColor: "var(--inv-line)",
                color: "var(--inv-muted)",
                ["--tw-ring-color" as string]: "var(--inv-foil-a)",
              }}
            >
              <svg className="size-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Tap to open
            </span>
          </button>
        </section>

        {/* Back */}
        <section
          className={cn(face, "flex flex-col px-6 pt-6 pb-5")}
          style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          inert={!flipped}
          aria-hidden={!flipped}
          aria-labelledby={`${uid}-details`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3
              ref={backHeadingRef}
              id={`${uid}-details`}
              tabIndex={-1}
              className="ls-inv-script text-[2.6rem] leading-none outline-none"
            >
              The Details
            </h3>
            <button
              type="button"
              onClick={() => flip(false)}
              aria-label="Flip back to the front"
              className="grid size-8 place-items-center rounded-full border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: "var(--inv-line)",
                color: "var(--inv-muted)",
                ["--tw-ring-color" as string]: "var(--inv-foil-a)",
              }}
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <dl className="mt-3 space-y-2 text-[15px] leading-snug">
            <div>
              <dt className="ls-inv-caps text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--inv-muted)" }}>
                When
              </dt>
              <dd>
                {dateFmt.format(start)}
                <br />
                {timeFmt.format(start)}
              </dd>
            </div>
            <div>
              <dt className="ls-inv-caps text-[10px] tracking-[0.2em] uppercase" style={{ color: "var(--inv-muted)" }}>
                Where
              </dt>
              <dd>
                {venue}
                {address && (
                  <span className="block" style={{ color: "var(--inv-muted)" }}>
                    {address}
                  </span>
                )}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-block text-xs font-semibold underline decoration-1 underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                    style={{ ["--tw-ring-color" as string]: "var(--inv-foil-a)" }}
                  >
                    Open in Maps ↗
                  </a>
                )}
              </dd>
            </div>
            {dressCode && (
              <div>
                <dt
                  className="ls-inv-caps text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--inv-muted)" }}
                >
                  Dress code
                </dt>
                <dd>{dressCode}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4" aria-live="off">
            {phase === "upcoming" ? (
              <div className="grid grid-cols-4 gap-1.5 text-center" role="timer" aria-label="Time until the event">
                {(countdown ?? [{ label: "Days" }, { label: "Hours" }, { label: "Min" }, { label: "Sec" }]).map(
                  (unit) => (
                    <div
                      key={unit.label}
                      className="rounded-lg border py-1.5"
                      style={{ borderColor: "var(--inv-line)" }}
                    >
                      <span className="block text-xl leading-none font-semibold tabular-nums">
                        {"value" in unit ? String(unit.value).padStart(2, "0") : "--"}
                      </span>
                      <span
                        className="ls-inv-caps text-[8.5px] tracking-[0.12em] uppercase"
                        style={{ color: "var(--inv-muted)" }}
                      >
                        {unit.label}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p
                className="rounded-lg border py-2.5 text-center text-sm italic"
                style={{ borderColor: "var(--inv-line)" }}
              >
                {phase === "live" ? "Happening right now ✦" : "This celebration has passed. Thank you!"}
              </p>
            )}
          </div>

          <div className="mt-auto pt-4">
            {chosen && !saving ? (
              <div
                className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
                style={{ borderColor: "var(--inv-line)" }}
                role="status"
              >
                <p className="text-[15px] leading-snug">
                  <span aria-hidden="true" className="mr-1" style={{ color: "var(--inv-foil-a)" }}>
                    ✦
                  </span>
                  {chosen.done}
                </p>
                <button
                  type="button"
                  onClick={() => setResponse(undefined)}
                  className="shrink-0 text-xs font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                  style={{ ["--tw-ring-color" as string]: "var(--inv-foil-a)" }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div role="group" aria-label="RSVP">
                <div className="grid grid-cols-3 gap-1.5">
                  {RESPONSES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => answer(r.value)}
                      disabled={saving !== null || phase === "past"}
                      className={cn(
                        "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[15px] font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                        r.value === "yes" ? "hover:brightness-110" : "hover:bg-black/5",
                      )}
                      style={
                        r.value === "yes"
                          ? {
                              background: "var(--inv-btn)",
                              color: "var(--inv-btn-ink)",
                              borderColor: "var(--inv-btn)",
                              ["--tw-ring-color" as string]: "var(--inv-foil-a)",
                            }
                          : { borderColor: "var(--inv-line)", ["--tw-ring-color" as string]: "var(--inv-foil-a)" }
                      }
                    >
                      {saving === r.value && (
                        <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                      )}
                      {r.label}
                    </button>
                  ))}
                </div>
                {error && (
                  <p role="alert" className="mt-1.5 text-xs text-rose-600">
                    Couldn&apos;t save your reply. Please try again.
                  </p>
                )}
              </div>
            )}

            <div
              className="mt-3 flex items-center justify-between gap-2 text-[11px]"
              style={{ color: "var(--inv-muted)" }}
            >
              <span>{rsvpNote}</span>
              {showCalendar && (
                <a
                  href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`}
                  download="invitation.ics"
                  className="inline-flex shrink-0 items-center gap-1 font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: "var(--inv-ink)", ["--tw-ring-color" as string]: "var(--inv-foil-a)" }}
                >
                  + Add to calendar
                </a>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
