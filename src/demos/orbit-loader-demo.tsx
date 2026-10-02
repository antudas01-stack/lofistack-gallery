"use client";

import { useEffect, useState } from "react";
import { OrbitLoader, type OrbitLoaderSize } from "@/components/gallery/orbit-loader";
import { ColorSwatches, Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Sky", value: "#0ea5e9" },
] as const;

export function OrbitLoaderPlayground() {
  const [size, setSize] = useState<OrbitLoaderSize>("lg");
  const [orbits, setOrbits] = useState<"1" | "2" | "3">("3");
  const [speed, setSpeed] = useState(1.6);
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [mode, setMode] = useState<"indeterminate" | "determinate">("indeterminate");
  const [progress, setProgress] = useState(64);
  const [autoplay, setAutoplay] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showLabel, setShowLabel] = useState(true);

  useEffect(() => {
    if (mode !== "determinate" || !autoplay) return;
    const timer = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 2)), 120);
    return () => clearInterval(timer);
  }, [mode, autoplay]);

  return (
    <PlaygroundShell
      stage={
        <OrbitLoader
          size={size}
          orbits={Number(orbits) as 1 | 2 | 3}
          speed={speed}
          color={color}
          progress={mode === "determinate" ? progress : undefined}
          label={mode === "determinate" ? "Uploading" : "Loading"}
          showLabel={showLabel}
          paused={paused}
          className="text-fg"
        />
      }
      controls={
        <>
          <Segmented label="Mode" options={["indeterminate", "determinate"] as const} value={mode} onChange={setMode} />
          <Segmented label="Size" options={["sm", "md", "lg"] as const} value={size} onChange={setSize} />
          <Segmented label="Orbits" options={["1", "2", "3"] as const} value={orbits} onChange={setOrbits} />
          <Slider label="Speed" value={speed} min={0.6} max={4} step={0.1} format={(v) => `${v.toFixed(1)}s`} onChange={setSpeed} />
          {mode === "determinate" && (
            <Slider label="Progress" value={progress} min={0} max={100} format={(v) => `${v}%`} onChange={setProgress} />
          )}
          <ColorSwatches label="Color" options={COLORS} value={color} onChange={setColor} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Show label" checked={showLabel} onChange={setShowLabel} />
            <Toggle label="Paused" checked={paused} onChange={setPaused} />
            {mode === "determinate" && <Toggle label="Auto-advance progress" checked={autoplay} onChange={setAutoplay} />}
          </div>
        </>
      }
    />
  );
}

export function OrbitLoaderStates() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StateTile label="1 orbit">
        <OrbitLoader orbits={1} className="text-indigo-500" />
      </StateTile>
      <StateTile label="2 orbits">
        <OrbitLoader orbits={2} className="text-sky-500" />
      </StateTile>
      <StateTile label="3 orbits">
        <OrbitLoader orbits={3} className="text-emerald-500" />
      </StateTile>
      <StateTile label="Progress 35%">
        <OrbitLoader progress={35} className="text-amber-500" />
      </StateTile>
      <StateTile label="Paused">
        <OrbitLoader paused className="text-rose-500" />
      </StateTile>
      <StateTile label="Small + label">
        <OrbitLoader size="sm" showLabel label="Syncing" className="text-fg" />
      </StateTile>
    </div>
  );
}

export function OrbitLoaderCard() {
  return <OrbitLoader size={84} className="text-accent" />;
}
