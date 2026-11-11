"use client";

import { useState } from "react";
import { GhostSnake, clearGhostRecord, type SnakeResult, type SnakeTheme } from "@/components/gallery/ghost-snake";
import { Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const KEY = "ls-ghost-snake";

export function GhostSnakePlayground() {
  const [theme, setTheme] = useState<SnakeTheme>("nokia");
  const [level, setLevel] = useState(5);
  const [walls, setWalls] = useState(true);
  const [ghost, setGhost] = useState(true);
  const [sound, setSound] = useState(false);
  const [last, setLast] = useState<SnakeResult | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full flex-col items-center gap-4">
          <GhostSnake
            theme={theme}
            startLevel={level}
            walls={walls}
            ghost={ghost}
            sound={sound}
            storageKey={KEY}
            onGameOver={setLast}
          />
          <p className="max-w-xs text-center font-mono text-[11px] text-fg-muted">
            {last
              ? `onGameOver → score ${last.score}, best ${last.best}${last.newRecord ? ", new record!" : ""}`
              : "Click the screen, then use arrow keys / WASD (or swipe). Beat your score once, then race your ghost."}
          </p>
        </div>
      }
      controls={
        <>
          <Segmented label="Screen" options={["nokia", "amber", "ice"] as const} value={theme} onChange={setTheme} />
          <Slider label="Speed level" value={level} min={1} max={9} onChange={setLevel} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Ghost race" checked={ghost} onChange={setGhost} />
            <Toggle label="Walls (off = wrap around)" checked={walls} onChange={setWalls} />
            <Toggle label="Beeps" checked={sound} onChange={setSound} />
          </div>
          <button
            type="button"
            onClick={() => clearGhostRecord(KEY)}
            className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Clear record & ghost
          </button>
          <p className="text-xs leading-relaxed text-fg-muted">
            Your best run is saved in this browser. The 👻 badge shows how far ahead (+) or behind (−) your ghost you
            are.
          </p>
        </>
      }
    />
  );
}

export function GhostSnakeStates() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StateTile label="Nokia green">
        <GhostSnake theme="nokia" storageKey="ls-ghost-snake-tile" className="scale-90" />
      </StateTile>
      <StateTile label="Amber LCD">
        <GhostSnake theme="amber" storageKey="ls-ghost-snake-tile" className="scale-90" />
      </StateTile>
      <StateTile label="Ice LCD · wrap-around">
        <GhostSnake theme="ice" walls={false} storageKey="ls-ghost-snake-tile" className="scale-90" />
      </StateTile>
    </div>
  );
}

export function GhostSnakeCard() {
  return (
    <div className="h-44 w-56 overflow-hidden pt-2">
      <div className="origin-top scale-[0.62]">
        <GhostSnake storageKey="ls-ghost-snake-card" />
      </div>
    </div>
  );
}
