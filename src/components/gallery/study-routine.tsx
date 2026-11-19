"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

export type StudyDay = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type StudyLevel = "easy" | "normal" | "hard";

export interface StudySubject {
  name: string;
  /** Hard subjects get more sessions and are placed earlier in the evening. */
  level?: StudyLevel;
}

export interface RoutineOptions {
  subjects: StudySubject[];
  /** 24-hour "HH:MM", e.g. "18:00". */
  start: string;
  end: string;
  sessionMinutes: number;
  breakMinutes: number;
  studyDays: StudyDay[];
  weekStart?: StudyDay;
  hardFirst?: boolean;
  /** Change it to get a different arrangement of the same sessions. */
  seed?: number;
}

export interface RoutineSession {
  /** Minutes after midnight. */
  start: number;
  end: number;
  /** Index into the subjects list. */
  subject: number;
  name: string;
}

export interface StudyRoutineResult {
  /** Set when a routine can't be made; explains what to fix. */
  problem: string | null;
  slots: Array<{ start: number; end: number }>;
  days: Array<{ day: StudyDay; label: string; free: boolean; sessions: RoutineSession[] }>;
  totals: Array<{ subject: number; name: string; sessions: number; minutes: number }>;
  /** Subjects that got no session because there is not enough time. */
  leftOut: string[];
  sessionsPerWeek: number;
  minutesPerWeek: number;
}

export interface StudyRoutineProps {
  title?: string;
  defaultSubjects?: Array<string | StudySubject>;
  /** 24-hour "HH:MM". */
  defaultStart?: string;
  defaultEnd?: string;
  defaultSessionMinutes?: number;
  defaultBreakMinutes?: number;
  defaultStudyDays?: StudyDay[];
  /** First column of the week. Saturday by default. */
  weekStart?: StudyDay;
  /** Put the hardest subjects first, while the mind is fresh. */
  hardFirst?: boolean;
  maxSubjects?: number;
  onChange?: (routine: StudyRoutineResult) => void;
  className?: string;
}

const DAYS: StudyDay[] = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
const DAY_NAMES: Record<StudyDay, [string, string]> = {
  sat: ["Sat", "Saturday"],
  sun: ["Sun", "Sunday"],
  mon: ["Mon", "Monday"],
  tue: ["Tue", "Tuesday"],
  wed: ["Wed", "Wednesday"],
  thu: ["Thu", "Thursday"],
  fri: ["Fri", "Friday"],
};
const LEVELS: StudyLevel[] = ["easy", "normal", "hard"];
const WEIGHT: Record<StudyLevel, number> = { easy: 1, normal: 2, hard: 3 };
const SESSION_OPTIONS = [30, 40, 50, 60, 90];
const BREAK_OPTIONS = [0, 5, 10, 15];
const DEFAULT_SUBJECTS: StudySubject[] = [
  { name: "Bangla" },
  { name: "English" },
  { name: "Math", level: "hard" },
  { name: "Science" },
  { name: "BGS", level: "easy" },
  { name: "ICT", level: "easy" },
];
/** [background, text] pairs. The same colours are used on screen and in the downloaded picture. */
const PALETTE: Array<[string, string]> = [
  ["#fde68a", "#78350f"],
  ["#bfdbfe", "#1e3a8a"],
  ["#bbf7d0", "#14532d"],
  ["#fecdd3", "#881337"],
  ["#ddd6fe", "#4c1d95"],
  ["#fed7aa", "#7c2d12"],
  ["#a5f3fc", "#164e63"],
  ["#f5d0fe", "#701a75"],
  ["#d9f99d", "#365314"],
  ["#fbcfe8", "#831843"],
  ["#99f6e4", "#134e4a"],
  ["#e2e8f0", "#1e293b"],
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes >= 0 && minutes < 1440 ? minutes : null;
}

/** 1080 → "6:00 PM" */
export function formatTime(minutes: number) {
  const m = ((minutes % 1440) + 1440) % 1440;
  const hour = Math.floor(m / 60);
  return `${hour % 12 || 12}:${String(m % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const mix = (a: number, b: number, c: number) =>
  (((a + 1) * 73856093) ^ ((b + 1) * 19349663) ^ ((c + 1) * 83492791)) >>> 0;

/** Turns subjects, a daily study time and study days into a weekly routine. Pure: same input, same routine. */
export function buildRoutine(options: RoutineOptions): StudyRoutineResult {
  const { subjects, sessionMinutes, breakMinutes, hardFirst = true, seed = 0 } = options;
  const first = DAYS.indexOf(options.weekStart ?? "sat");
  const week = DAYS.map((_, i) => DAYS[(first + i) % 7]);
  const studyDays = week.filter((day) => options.studyDays.includes(day));
  const start = parseTime(options.start);
  const end = parseTime(options.end);
  const length = start === null || end === null ? 0 : (((end - start) % 1440) + 1440) % 1440;

  let problem: string | null = null;
  if (subjects.length === 0) problem = "Add at least one subject to get a routine.";
  else if (start === null || end === null) problem = "Choose when your study time starts and ends.";
  else if (length === 0) problem = "The end time has to be different from the start time.";
  else if (length > 720) problem = "Study time can be 12 hours at most. Please check the start and end time.";
  else if (length < sessionMinutes)
    problem = `Your study time is ${formatDuration(length)}, which is shorter than one ${sessionMinutes}-minute session. Pick a shorter session or a longer study time.`;
  else if (studyDays.length === 0) problem = "Pick at least one study day.";

  const empty = (label: string | null): StudyRoutineResult => ({
    problem: label,
    slots: [],
    days: week.map((day) => ({ day, label: DAY_NAMES[day][1], free: !studyDays.includes(day), sessions: [] })),
    totals: [],
    leftOut: [],
    sessionsPerWeek: 0,
    minutesPerWeek: 0,
  });
  if (problem || start === null) return empty(problem);

  const perDay = Math.floor((length + breakMinutes) / (sessionMinutes + breakMinutes));
  const slots = Array.from({ length: perDay }, (_, i) => {
    const from = start + i * (sessionMinutes + breakMinutes);
    return { start: from % 1440, end: (from + sessionMinutes) % 1440 };
  });

  // 1. How many sessions each subject gets: one each first, the rest shared by difficulty.
  const weights = subjects.map((s) => WEIGHT[s.level ?? "normal"]);
  const quota = subjects.map(() => 0);
  let left = perDay * studyDays.length;
  const byWeight = subjects.map((_, i) => i).sort((a, b) => weights[b] - weights[a] || a - b);
  for (const i of byWeight) {
    if (left === 0) break;
    quota[i] = 1;
    left -= 1;
  }
  while (left > 0) {
    let best = 0;
    for (let i = 1; i < subjects.length; i += 1) {
      if (weights[i] / (2 * quota[i] + 1) > weights[best] / (2 * quota[best] + 1)) best = i;
    }
    quota[best] += 1;
    left -= 1;
  }

  // 2. Spread each subject over the days, so the same subject is not stacked on one day.
  const grid: number[][] = studyDays.map(() => []);
  const order = subjects.map((_, i) => i).sort((a, b) => quota[b] - quota[a] || weights[b] - weights[a] || a - b);
  for (const subject of order) {
    for (let n = 0; n < quota[subject]; n += 1) {
      let best = -1;
      let bestScore = Infinity;
      for (let k = 0; k < grid.length; k += 1) {
        const d = (k + subject * 2 + seed * 3 + n) % grid.length;
        if (grid[d].length >= perDay) continue;
        const score = grid[d].filter((s) => s === subject).length * 100 + grid[d].length;
        if (score < bestScore) {
          best = d;
          bestScore = score;
        }
      }
      if (best >= 0) grid[best].push(subject);
    }
  }

  // 3. Order each day: hardest first, and never the same subject twice in a row when avoidable.
  grid.forEach((day, d) => {
    day.sort((a, b) => (hardFirst ? weights[b] - weights[a] : 0) || mix(a, d, seed) - mix(b, d, seed));
    for (let i = 1; i < day.length; i += 1) {
      if (day[i] !== day[i - 1]) continue;
      const swap = day.findIndex((s, j) => j > i && s !== day[i]);
      if (swap > 0) [day[i], day[swap]] = [day[swap], day[i]];
    }
  });

  return {
    problem: null,
    slots,
    days: week.map((day) => {
      const index = studyDays.indexOf(day);
      return {
        day,
        label: DAY_NAMES[day][1],
        free: index < 0,
        sessions:
          index < 0 ? [] : grid[index].map((subject, i) => ({ ...slots[i], subject, name: subjects[subject].name })),
      };
    }),
    totals: subjects.map((s, i) => ({
      subject: i,
      name: s.name,
      sessions: quota[i],
      minutes: quota[i] * sessionMinutes,
    })),
    leftOut: subjects.filter((_, i) => quota[i] === 0).map((s) => s.name),
    sessionsPerWeek: perDay * studyDays.length,
    minutesPerWeek: perDay * studyDays.length * sessionMinutes,
  };
}

interface Row {
  id: number;
  name: string;
  level: StudyLevel;
  color: number;
}

/** Draws the routine as a picture a student can save or print. */
function drawRoutine(routine: StudyRoutineResult, rows: Row[], title: string, subtitle: string) {
  const timeW = 190;
  const colW = 170;
  const rowH = 84;
  const top = 150;
  const width = 48 * 2 + timeW + colW * routine.days.length;
  const height = top + 56 + rowH * routine.slots.length + 48;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const box = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 12);
    else ctx.rect(x, y, w, h);
    ctx.fill();
  };
  const text = (value: string, x: number, y: number, font: string, fill: string, maxWidth?: number) => {
    ctx.font = font;
    ctx.fillStyle = fill;
    ctx.fillText(value, x, y, maxWidth);
  };
  const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "middle";
  text(title, 48, 62, `700 40px ${sans}`, "#18181b");
  text(subtitle, 48, 108, `400 22px ${sans}`, "#52525b");

  ctx.textAlign = "center";
  routine.days.forEach((day, d) => {
    text(
      DAY_NAMES[day.day][1],
      48 + timeW + colW * d + colW / 2,
      top + 26,
      `600 20px ${sans}`,
      day.free ? "#a1a1aa" : "#18181b",
    );
  });
  routine.slots.forEach((slot, r) => {
    const y = top + 56 + rowH * r;
    ctx.textAlign = "left";
    text(formatTime(slot.start), 48, y + rowH / 2 - 12, `600 20px ${sans}`, "#18181b");
    text(`to ${formatTime(slot.end)}`, 48, y + rowH / 2 + 14, `400 17px ${sans}`, "#71717a");
    ctx.textAlign = "center";
    routine.days.forEach((day, d) => {
      const x = 48 + timeW + colW * d;
      if (day.free) return;
      const session = day.sessions[r];
      const colors = PALETTE[rows[session.subject]?.color ?? 0];
      box(x + 5, y + 5, colW - 10, rowH - 10, colors[0]);
      text(session.name, x + colW / 2, y + rowH / 2, `600 20px ${sans}`, colors[1], colW - 26);
    });
  });
  routine.days.forEach((day, d) => {
    if (!day.free || routine.slots.length === 0) return;
    const x = 48 + timeW + colW * d;
    box(x + 5, top + 61, colW - 10, rowH * routine.slots.length - 10, "#f4f4f5");
    text("Free day", x + colW / 2, top + 56 + (rowH * routine.slots.length) / 2, `500 19px ${sans}`, "#71717a");
  });
  return canvas;
}

export function StudyRoutine({
  title = "Study routine",
  defaultSubjects = DEFAULT_SUBJECTS,
  defaultStart = "18:00",
  defaultEnd = "22:00",
  defaultSessionMinutes = 50,
  defaultBreakMinutes = 10,
  defaultStudyDays = ["sat", "sun", "mon", "tue", "wed", "thu"],
  weekStart = "sat",
  hardFirst = true,
  maxSubjects = 12,
  onChange,
  className,
}: StudyRoutineProps) {
  const uid = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    defaultSubjects.slice(0, maxSubjects).map((subject, i) => ({
      id: i + 1,
      name: typeof subject === "string" ? subject : subject.name,
      level: (typeof subject === "string" ? undefined : subject.level) ?? "normal",
      color: i % PALETTE.length,
    })),
  );
  const [draft, setDraft] = useState("");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [sessionMinutes, setSessionMinutes] = useState(defaultSessionMinutes);
  const [breakMinutes, setBreakMinutes] = useState(defaultBreakMinutes);
  const [studyDays, setStudyDays] = useState<StudyDay[]>(defaultStudyDays);
  const [seed, setSeed] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const routine = useMemo(
    () =>
      buildRoutine({
        subjects: rows.map((row) => ({ name: row.name, level: row.level })),
        start,
        end,
        sessionMinutes,
        breakMinutes,
        studyDays,
        weekStart,
        hardFirst,
        seed,
      }),
    [rows, start, end, sessionMinutes, breakMinutes, studyDays, weekStart, hardFirst, seed],
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(routine);
  }, [routine]);

  const addSubject = (event: FormEvent) => {
    event.preventDefault();
    const name = draft.trim().replace(/\s+/g, " ");
    if (!name) return;
    if (rows.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      setNotice(`${name} is already in your list.`);
      return;
    }
    if (rows.length >= maxSubjects) {
      setNotice(`You can add up to ${maxSubjects} subjects.`);
      return;
    }
    const used = new Set(rows.map((row) => row.color));
    const free = PALETTE.findIndex((_, i) => !used.has(i));
    const id = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    setRows([...rows, { id, name, level: "normal", color: free >= 0 ? free : id % PALETTE.length }]);
    setDraft("");
    setNotice(`${name} added.`);
  };

  const week = routine.days;
  const lastSlot = routine.slots[routine.slots.length - 1];
  const dayCount = week.filter((day) => !day.free).length;
  const subtitle = routine.problem
    ? ""
    : `${formatTime(routine.slots[0].start)} to ${formatTime(lastSlot.end)} · ${dayCount} study ${dayCount === 1 ? "day" : "days"} · ${formatDuration(routine.minutesPerWeek)} a week`;
  const mostSessions = Math.max(1, ...routine.totals.map((total) => total.sessions));

  const copyText = async () => {
    const lines = week.map((day) =>
      day.free
        ? `${day.label}: Free day`
        : `${day.label}: ${day.sessions.map((s) => `${formatTime(s.start)} ${s.name}`).join(" | ")}`,
    );
    try {
      await navigator.clipboard.writeText([title, subtitle, "", ...lines].join("\n"));
      setNotice("Routine copied as text.");
    } catch {
      setNotice("Copying isn't allowed in this browser.");
    }
  };
  const download = () => {
    drawRoutine(routine, rows, title, subtitle).toBlob((blob) => {
      if (!blob) return setNotice("The picture couldn't be made.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "study-routine.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setNotice("Saved study-routine.png");
    }, "image/png");
  };

  const field =
    "h-10 min-w-0 rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 focus:outline-none dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-100";
  const label = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
  const card = "rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/[0.03]";
  const step =
    "grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white dark:bg-indigo-500";
  const action =
    "rounded-full px-3.5 py-2 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none active:scale-95 disabled:opacity-40 dark:focus-visible:ring-offset-zinc-900";

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        "@container w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm sm:p-6 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      <h2 id={`${uid}-title`} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Add your subjects, set your fixed study time and choose your study days. The routine is made for you.
      </p>

      <div className="mt-5 grid grid-cols-1 items-start gap-3 @xl:grid-cols-2 @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* 1. Subjects */}
        <div className={cn(card, "@xl:row-span-2 @3xl:row-span-1")}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className={step}>1</span> Your subjects
          </h3>
          <form onSubmit={addSubject} className="mt-3 flex gap-2">
            <label htmlFor={`${uid}-subject`} className="sr-only">
              Subject name
            </label>
            <input
              id={`${uid}-subject`}
              value={draft}
              maxLength={24}
              placeholder="e.g. Physics"
              onChange={(event) => setDraft(event.target.value)}
              className={cn(field, "w-full")}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className={cn(action, "h-10 shrink-0 bg-indigo-600 px-4 text-white hover:bg-indigo-500")}
            >
              Add
            </button>
          </form>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No subjects yet. Type a name and press Add.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center gap-2">
                  <span
                    className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-sm font-semibold"
                    style={{ backgroundColor: PALETTE[row.color][0], color: PALETTE[row.color][1] }}
                  >
                    {row.name}
                  </span>
                  <select
                    aria-label={`How hard is ${row.name}?`}
                    value={row.level}
                    onChange={(event) =>
                      setRows(
                        rows.map((r) => (r.id === row.id ? { ...r, level: event.target.value as StudyLevel } : r)),
                      )
                    }
                    className={cn(field, "h-8 shrink-0 px-2 text-xs")}
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level[0].toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={`Remove ${row.name}`}
                    onClick={() => {
                      setRows(rows.filter((r) => r.id !== row.id));
                      setNotice(`${row.name} removed.`);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
                      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Hard subjects get more sessions each week.</p>
        </div>

        {/* 2. Study time */}
        <div className={card}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className={step}>2</span> Your study time
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2 @sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-start`} className={label}>
                From
              </label>
              <input
                id={`${uid}-start`}
                type="time"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className={cn(field, "mt-1 w-full")}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-end`} className={label}>
                To
              </label>
              <input
                id={`${uid}-end`}
                type="time"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className={cn(field, "mt-1 w-full")}
              />
            </div>
            <div>
              <label htmlFor={`${uid}-session`} className={label}>
                One session
              </label>
              <select
                id={`${uid}-session`}
                value={sessionMinutes}
                onChange={(event) => setSessionMinutes(Number(event.target.value))}
                className={cn(field, "mt-1 w-full")}
              >
                {[...new Set([...SESSION_OPTIONS, defaultSessionMinutes])]
                  .sort((a, b) => a - b)
                  .map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${uid}-break`} className={label}>
                Break after
              </label>
              <select
                id={`${uid}-break`}
                value={breakMinutes}
                onChange={(event) => setBreakMinutes(Number(event.target.value))}
                className={cn(field, "mt-1 w-full")}
              >
                {[...new Set([...BREAK_OPTIONS, defaultBreakMinutes])]
                  .sort((a, b) => a - b)
                  .map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes === 0 ? "No break" : `${minutes} min`}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            {routine.slots.length > 0
              ? `${routine.slots.length} ${routine.slots.length === 1 ? "session" : "sessions"} a day, finishing at ${formatTime(lastSlot.end)}.`
              : "Set a start and end time, for example 6:00 PM to 10:00 PM."}
          </p>
        </div>

        {/* 3. Days */}
        <div className={card}>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <span className={step}>3</span> Your study days
          </h3>
          <div role="group" aria-label="Study days" className="mt-3 grid grid-cols-4 gap-1.5 @3xl:grid-cols-3">
            {week.map(({ day }) => {
              const on = studyDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${DAY_NAMES[day][1]}: ${on ? "study day" : "free day"}`}
                  onClick={() => setStudyDays(on ? studyDays.filter((d) => d !== day) : [...studyDays, day])}
                  className={cn(
                    action,
                    "flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 ring-1",
                    on
                      ? "bg-indigo-600 text-white ring-indigo-600 dark:bg-indigo-500 dark:ring-indigo-500"
                      : "bg-white text-zinc-500 ring-zinc-300 hover:bg-zinc-100 dark:bg-transparent dark:text-zinc-400 dark:ring-white/15 dark:hover:bg-white/10",
                  )}
                >
                  <span className="text-sm">{DAY_NAMES[day][0]}</span>
                  <span className="text-[10px] font-medium opacity-80">{on ? "Study" : "Free"}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Tap a day to switch it between study and free. {dayCount} study, {7 - dayCount} free.
          </p>
        </div>
      </div>

      {/* Routine */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Your weekly routine</h3>
          {subtitle && <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!!routine.problem}
            onClick={() => {
              setSeed(seed + 1);
              setNotice("Routine rearranged.");
            }}
            className={cn(
              action,
              "text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-100 dark:text-zinc-100 dark:ring-white/20 dark:hover:bg-white/10",
            )}
          >
            Shuffle
          </button>
          <button
            type="button"
            disabled={!!routine.problem}
            onClick={copyText}
            className={cn(
              action,
              "text-zinc-800 ring-1 ring-zinc-300 hover:bg-zinc-100 dark:text-zinc-100 dark:ring-white/20 dark:hover:bg-white/10",
            )}
          >
            Copy as text
          </button>
          <button
            type="button"
            disabled={!!routine.problem}
            onClick={download}
            className={cn(action, "bg-indigo-600 text-white hover:bg-indigo-500")}
          >
            Download picture
          </button>
        </div>
      </div>

      {routine.problem ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300"
        >
          {routine.problem}
        </p>
      ) : (
        <>
          {routine.leftOut.length > 0 && (
            <p
              role="alert"
              className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-400/15 dark:text-amber-200"
            >
              There isn&apos;t enough time for every subject. Left out: {routine.leftOut.join(", ")}. Add a study day,
              more time or shorter sessions.
            </p>
          )}
          <div
            role="region"
            aria-label="Weekly study routine, scrolls sideways on small screens"
            tabIndex={0}
            className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none dark:border-white/10"
          >
            <table className="w-full min-w-[38rem] border-separate border-spacing-0 text-sm">
              <caption className="sr-only">
                Weekly study routine. Rows are session times, columns are days of the week.
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-10 bg-zinc-100 px-3 py-2.5 text-left text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    Time
                  </th>
                  {week.map((day) => (
                    <th
                      key={day.day}
                      scope="col"
                      className={cn(
                        "bg-zinc-100 px-1.5 py-2.5 text-center text-xs font-semibold dark:bg-zinc-800",
                        day.free ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-100",
                      )}
                    >
                      <abbr title={day.label} className="no-underline">
                        {DAY_NAMES[day.day][0]}
                      </abbr>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routine.slots.map((slot, r) => (
                  <tr key={slot.start}>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 border-t border-zinc-200 bg-white px-3 py-2 text-left align-middle whitespace-nowrap dark:border-white/10 dark:bg-zinc-900"
                    >
                      <span className="block text-sm font-semibold tabular-nums">{formatTime(slot.start)}</span>
                      <span className="block text-[11px] font-normal text-zinc-500 tabular-nums dark:text-zinc-400">
                        to {formatTime(slot.end)}
                      </span>
                    </th>
                    {week.map((day) => {
                      if (day.free) {
                        return r === 0 ? (
                          <td
                            key={day.day}
                            rowSpan={routine.slots.length}
                            className="border-t border-zinc-200 p-1 align-middle dark:border-white/10"
                          >
                            <div className="grid h-full min-h-12 place-items-center rounded-lg bg-zinc-100 px-1 py-3 text-center text-[11px] font-medium text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                              Free day
                            </div>
                          </td>
                        ) : null;
                      }
                      const session = day.sessions[r];
                      const colors = PALETTE[rows[session.subject]?.color ?? 0];
                      return (
                        <td key={day.day} className="border-t border-zinc-200 p-1 dark:border-white/10">
                          <div
                            className="grid min-h-12 place-items-center rounded-lg px-1.5 py-2 text-center text-xs leading-tight font-semibold break-words"
                            style={{ backgroundColor: colors[0], color: colors[1] }}
                          >
                            {session.name}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 @lg:grid-cols-2 @3xl:grid-cols-3">
            {routine.totals.map((total) => {
              const colors = PALETTE[rows[total.subject]?.color ?? 0];
              return (
                <li key={total.subject} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="truncate font-semibold">{total.name}</span>
                    <span className="shrink-0 text-zinc-500 tabular-nums dark:text-zinc-400">
                      {total.sessions} {total.sessions === 1 ? "session" : "sessions"} · {formatDuration(total.minutes)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-zinc-200 dark:bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(total.sessions / mostSessions) * 100}%`, backgroundColor: colors[0] }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p role="status" className="mt-3 min-h-4 text-xs text-zinc-500 dark:text-zinc-400">
        {notice}
      </p>
    </section>
  );
}
