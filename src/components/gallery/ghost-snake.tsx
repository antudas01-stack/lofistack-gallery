"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type SnakeTheme = "nokia" | "amber" | "ice";
type Dir = "up" | "down" | "left" | "right";
type Status = "ready" | "playing" | "paused" | "over";

export interface SnakeResult {
  score: number;
  best: number;
  newRecord: boolean;
  /** How many moves the run lasted. */
  ticks: number;
}

export interface GhostSnakeProps {
  /** Board width in cells. */
  cols?: number;
  /** Board height in cells. */
  rows?: number;
  /** Starting speed, 1 (slow) to 9 (fast). Each apple is worth this many points. */
  startLevel?: number;
  /** true = hitting the edge ends the game; false = wrap around like Nokia's "no maze". */
  walls?: boolean;
  /** Race a replay of your best run. */
  ghost?: boolean;
  /** Short beeps on eat / crash (Web Audio). */
  sound?: boolean;
  theme?: SnakeTheme;
  /** localStorage key for the best score + ghost recording. */
  storageKey?: string;
  onGameOver?: (result: SnakeResult) => void;
  className?: string;
}

interface Recording {
  score: number;
  start: number[]; // initial body cells, tail → head
  path: number[]; // head cell after every tick
  events: Array<[tick: number, length: number, score: number]>;
}

const PALETTES: Record<SnakeTheme, { bg: string; off: string; on: string; ghost: string; shell: string; key: string }> =
  {
    nokia: { bg: "#a7bd7a", off: "#9bb06f", on: "#1f2a12", ghost: "#4f6234", shell: "#1b2a4a", key: "#2a3d66" },
    amber: { bg: "#f2b84b", off: "#e3a93c", on: "#3a1f05", ghost: "#8a5512", shell: "#2b2420", key: "#43372f" },
    ice: { bg: "#b9e3f0", off: "#a8d4e2", on: "#0b2d3d", ghost: "#4a7f93", shell: "#d8dde4", key: "#bcc4cf" },
  };

const CELL = 10;
const START_LENGTH = 4;
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  "2": "up",
  "8": "down",
  "4": "left",
  "6": "right",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// The saved best run is an external store: read via useSyncExternalStore so the
// server (no storage) and the first client render agree.
const STORE_EVENT = "ls-ghost-snake-store";
function subscribeStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
}
function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function parseRecording(raw: string | null): Recording | null {
  if (!raw) return null;
  try {
    const rec = JSON.parse(raw) as Recording;
    return Array.isArray(rec.path) && Array.isArray(rec.start) ? rec : null;
  } catch {
    return null;
  }
}
/** Returns false when storage is unavailable (private mode etc.). */
function saveRecording(key: string, rec: Recording) {
  try {
    localStorage.setItem(key, JSON.stringify(rec));
    window.dispatchEvent(new Event(STORE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Deletes the saved best run (and its ghost) for a storage key. */
export function clearGhostRecord(storageKey = "ls-ghost-snake") {
  try {
    localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(STORE_EVENT));
  } catch {
    /* nothing stored */
  }
}

/** Ghost body + score at a given tick, rebuilt from the compact recording. */
function ghostAt(rec: Recording, tick: number) {
  const t = Math.min(tick, rec.path.length);
  let length = START_LENGTH;
  let score = 0;
  for (const [at, len, s] of rec.events) {
    if (at > t) break;
    length = len;
    score = s;
  }
  const heads = [...rec.start, ...rec.path.slice(0, t)];
  return { body: heads.slice(-length), score, finished: tick >= rec.path.length };
}

let audio: AudioContext | null = null;
function beep(freq: number, ms: number) {
  try {
    audio ??= new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + ms / 1000);
  } catch {
    /* audio blocked: play silently */
  }
}

export function GhostSnake({
  cols = 20,
  rows = 12,
  startLevel = 5,
  walls = true,
  ghost = true,
  sound = false,
  theme = "nokia",
  storageKey = "ls-ghost-snake",
  onGameOver,
  className,
}: GhostSnakeProps) {
  const uid = useId();
  const palette = PALETTES[theme];
  const level = Math.min(9, Math.max(1, Math.round(startLevel)));

  const [status, setStatus] = useState<Status>("ready");
  const [score, setScore] = useState(0);
  const storedRaw = useSyncExternalStore(
    subscribeStore,
    () => readRaw(storageKey),
    () => null,
  );
  const [memoryBest, setMemoryBest] = useState<Recording | null>(null);
  const bestRec = useMemo(() => parseRecording(storedRaw) ?? memoryBest, [storedRaw, memoryBest]);
  const best = bestRec?.score ?? 0;
  const [ghostScore, setGhostScore] = useState<number | null>(null);
  const [newRecord, setNewRecord] = useState(false);
  const [message, setMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const game = useRef({
    snake: [] as number[], // head first
    dir: "right" as Dir,
    queue: [] as Dir[],
    food: -1,
    tick: 0,
    score: 0,
    rec: null as Recording | null,
    best: null as Recording | null,
    seed: 1,
    alive: false,
  });
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  });
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = game.current;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Unlit LCD pixels.
    ctx.fillStyle = palette.off;
    for (let i = 0; i < cols * rows; i++) {
      ctx.fillRect((i % cols) * CELL + 1, Math.floor(i / cols) * CELL + 1, CELL - 2, CELL - 2);
    }

    const cell = (i: number, color: string, inset = 1) => {
      ctx.fillStyle = color;
      ctx.fillRect((i % cols) * CELL + inset, Math.floor(i / cols) * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    };

    // Ghost: a dithered, see-through snake.
    if (ghost && g.best && (status === "playing" || status === "paused")) {
      const { body } = ghostAt(g.best, g.tick);
      ctx.fillStyle = palette.ghost;
      for (const i of body) {
        const x = (i % cols) * CELL;
        const y = Math.floor(i / cols) * CELL;
        for (let py = 1; py < CELL - 1; py += 2) {
          for (let px = 1 + ((py >> 1) % 2); px < CELL - 1; px += 2) ctx.fillRect(x + px, y + py, 1, 1);
        }
      }
    }

    // Food: a little diamond.
    if (g.food >= 0) {
      const x = (g.food % cols) * CELL;
      const y = Math.floor(g.food / cols) * CELL;
      ctx.fillStyle = palette.on;
      ctx.fillRect(x + 4, y + 1, 2, 8);
      ctx.fillRect(x + 1, y + 4, 8, 2);
      ctx.fillRect(x + 3, y + 3, 4, 4);
    }

    g.snake.forEach((i, n) => cell(i, palette.on, n === 0 ? 0.5 : 1));
    // Eye on the head.
    if (g.snake.length) {
      const h = g.snake[0];
      ctx.fillStyle = palette.bg;
      const ex = (h % cols) * CELL + (g.dir === "left" ? 2 : g.dir === "right" ? 6 : 4);
      const ey = Math.floor(h / cols) * CELL + (g.dir === "up" ? 2 : g.dir === "down" ? 6 : 4);
      ctx.fillRect(ex, ey, 2, 2);
    }
  }, [cols, rows, palette, ghost, status]);

  const placeFood = useCallback(() => {
    const g = game.current;
    const taken = new Set(g.snake);
    const free: number[] = [];
    for (let i = 0; i < cols * rows; i++) if (!taken.has(i)) free.push(i);
    // Small deterministic LCG so food placement doesn't depend on Math.random in render paths.
    g.seed = (g.seed * 1664525 + 1013904223) % 4294967296;
    g.food = free.length ? free[g.seed % free.length] : -1;
  }, [cols, rows]);

  const start = useCallback(() => {
    const g = game.current;
    const y = Math.floor(rows / 2);
    const x0 = Math.floor(cols / 4);
    g.snake = Array.from({ length: START_LENGTH }, (_, n) => y * cols + x0 + START_LENGTH - 1 - n);
    g.dir = "right";
    g.queue = [];
    g.tick = 0;
    g.score = 0;
    g.seed = (Date.now() & 0xffff) + 1;
    g.best = bestRec;
    g.alive = true;
    g.rec = { score: 0, start: [...g.snake].reverse(), path: [], events: [] };
    placeFood();
    setScore(0);
    setGhostScore(ghost && bestRec ? 0 : null);
    setNewRecord(false);
    setMessage("Go!");
    setStatus("playing");
    screenRef.current?.focus();
  }, [cols, rows, ghost, placeFood, bestRec]);

  const steer = useCallback((dir: Dir) => {
    const g = game.current;
    const last = g.queue.at(-1) ?? g.dir;
    if (dir === last || dir === OPPOSITE[last] || g.queue.length >= 2) return;
    g.queue.push(dir);
  }, []);

  const finish = useCallback(() => {
    const g = game.current;
    if (!g.alive) return;
    g.alive = false;
    const rec = g.rec;
    const prevBest = g.best?.score ?? 0;
    const record = g.score > prevBest;
    if (record && rec) {
      rec.score = g.score;
      g.best = rec;
      if (!saveRecording(storageKey, rec)) setMemoryBest(rec);
    }
    setNewRecord(record);
    setStatus("over");
    setMessage(record ? `New record: ${g.score}. Your ghost now runs this route.` : `Game over. Score ${g.score}.`);
    if (sound) beep(110, 280);
    if ("vibrate" in navigator) navigator.vibrate?.(80);
    onGameOverRef.current?.({ score: g.score, best: Math.max(prevBest, g.score), newRecord: record, ticks: g.tick });
  }, [storageKey, sound]);

  // Game loop.
  useEffect(() => {
    if (status !== "playing") {
      draw();
      return;
    }
    const speed = Math.max(55, 240 - level * 20);
    const id = setInterval(() => {
      const g = game.current;
      if (!g.alive) return;
      const next = g.queue.shift();
      if (next) g.dir = next;
      const head = g.snake[0];
      let x = head % cols;
      let y = Math.floor(head / cols);
      if (g.dir === "up") y -= 1;
      if (g.dir === "down") y += 1;
      if (g.dir === "left") x -= 1;
      if (g.dir === "right") x += 1;
      if (walls && (x < 0 || y < 0 || x >= cols || y >= rows)) return finish();
      x = (x + cols) % cols;
      y = (y + rows) % rows;
      const cellIndex = y * cols + x;
      const eating = cellIndex === g.food;
      const body = eating ? g.snake : g.snake.slice(0, -1);
      if (body.includes(cellIndex)) return finish();

      g.snake = [cellIndex, ...body];
      g.tick += 1;
      g.rec?.path.push(cellIndex);
      if (eating) {
        g.score += level;
        g.rec?.events.push([g.tick, g.snake.length, g.score]);
        setScore(g.score);
        if (sound) beep(880, 60);
        placeFood();
      }
      if (ghost && g.best) setGhostScore(ghostAt(g.best, g.tick).score);
      draw();
    }, speed);
    return () => clearInterval(id);
  }, [status, level, cols, rows, walls, ghost, sound, draw, finish, placeFood]);

  const toggle = () => {
    if (status === "playing") {
      setStatus("paused");
      setMessage("Paused");
    } else if (status === "paused") {
      setStatus("playing");
      setMessage("Resumed");
    } else start();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const dir = KEY_DIRS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (dir) {
      event.preventDefault();
      if (status === "playing") steer(dir);
      else if (status !== "paused") start();
    } else if (event.key === " " || event.key === "Enter" || event.key === "5" || event.key === "p") {
      event.preventDefault();
      toggle();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = event.clientX - s.x;
    const dy = event.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return toggle();
    if (status !== "playing") return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  const press = (k: { dir?: Dir; action?: "toggle" }) => {
    if (k.action) toggle();
    else if (k.dir) {
      if (status === "playing") steer(k.dir);
      else if (status !== "paused") start();
    }
  };

  const diff = ghostScore === null ? null : score - ghostScore;
  const lcdText = { color: palette.on };
  const keypad: Array<{ label: string; sub?: string; dir?: Dir; action?: "toggle" }> = [
    { label: "1" },
    { label: "2", sub: "▲", dir: "up" },
    { label: "3" },
    { label: "4", sub: "◀", dir: "left" },
    { label: "5", sub: "●", action: "toggle" },
    { label: "6", sub: "▶", dir: "right" },
    { label: "7" },
    { label: "8", sub: "▼", dir: "down" },
    { label: "9" },
  ];

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[300px] rounded-[44px] p-4 pb-6 shadow-2xl select-none", className)}
      style={{
        background: `linear-gradient(160deg, ${palette.shell}, color-mix(in oklab, ${palette.shell} 70%, black))`,
      }}
    >
      <p className="text-center text-[11px] font-black tracking-[0.35em] text-white/70" aria-hidden="true">
        NOKIA
      </p>

      {/* Screen */}
      <div className="mt-2 rounded-[18px] bg-black/40 p-2.5 shadow-inner">
        <div
          ref={screenRef}
          role="application"
          aria-roledescription="game"
          aria-label="Ghost Snake. Arrow keys or W A S D to steer, Space to start or pause."
          aria-describedby={`${uid}-status`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="relative touch-none overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ background: palette.bg }}
        >
          <div
            className="flex items-center justify-between px-2 pt-1 font-mono text-[11px] font-bold tabular-nums"
            style={lcdText}
          >
            <span>{String(score).padStart(4, "0")}</span>
            {diff !== null && status !== "ready" && (
              <span className="rounded-sm px-1" style={{ background: palette.off }}>
                👻 {diff >= 0 ? `+${diff}` : diff}
              </span>
            )}
            <span>HI {String(best).padStart(4, "0")}</span>
          </div>
          <canvas
            ref={canvasRef}
            width={cols * CELL}
            height={rows * CELL}
            aria-hidden="true"
            className="block w-full [image-rendering:pixelated]"
          />

          {status !== "playing" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center font-mono"
              style={{ ...lcdText, background: `${palette.bg}e6` }}
            >
              {status === "ready" && (
                <>
                  <p className="text-2xl font-black tracking-[0.2em]">SNAKE</p>
                  <p className="text-[10px] font-bold">{best > 0 && ghost ? "RACE YOUR GHOST" : "SET A RECORD"}</p>
                  <p className="mt-2 text-[10px]">PRESS 5 · SPACE · TAP</p>
                </>
              )}
              {status === "paused" && (
                <>
                  <p className="text-lg font-black tracking-[0.2em]">PAUSED</p>
                  <p className="text-[10px]">PRESS 5 TO GO ON</p>
                </>
              )}
              {status === "over" && (
                <>
                  <p className="text-lg font-black tracking-[0.15em]">{newRecord ? "NEW RECORD!" : "GAME OVER"}</p>
                  <p className="text-[11px] font-bold tabular-nums">SCORE {score}</p>
                  <p className="text-[10px]">{newRecord ? "GHOST UPDATED" : `BEST ${best}`}</p>
                  <p className="mt-1.5 text-[10px]">PRESS 5 TO PLAY</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <p id={`${uid}-status`} className="sr-only" aria-live="polite">
        {message}
      </p>

      {/* Navi key */}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="h-9 w-28 rounded-full text-[11px] font-bold tracking-widest text-white/85 uppercase shadow-md transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ background: `color-mix(in oklab, ${palette.key} 80%, white)` }}
        >
          {status === "playing" ? "Pause" : status === "paused" ? "Resume" : "Play"}
        </button>
      </div>

      {/* Keypad */}
      <div className="mt-4 grid grid-cols-3 gap-2 px-3">
        {keypad.map((k) =>
          k.dir || k.action ? (
            <button
              key={k.label}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault(); // instant response, and keeps focus on the screen
                press(k);
              }}
              onClick={(e) => {
                if (e.detail === 0) press(k); // keyboard activation (Enter / Space)
              }}
              aria-label={k.action ? "Start or pause" : `Turn ${k.dir}`}
              className="flex h-10 flex-col items-center justify-center rounded-[14px] text-white shadow-md transition active:scale-95 active:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ background: palette.key }}
            >
              <span className="text-sm leading-none font-bold">{k.label}</span>
              <span className="text-[8px] leading-none opacity-70">{k.sub}</span>
            </button>
          ) : (
            <span
              key={k.label}
              aria-hidden="true"
              className="grid h-10 place-items-center rounded-[14px] text-sm font-bold text-white/35"
              style={{ background: `color-mix(in oklab, ${palette.key} 70%, transparent)` }}
            >
              {k.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
