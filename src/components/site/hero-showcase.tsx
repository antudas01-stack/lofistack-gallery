"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { OrbitLoader } from "@/components/gallery/orbit-loader";
import { SignalInput, type SignalInputStatus } from "@/components/gallery/signal-input";

const SCRIPT: Array<{ value: string; status: SignalInputStatus; message?: string }> = [
  { value: "lofi", status: "loading" },
  { value: "lofi", status: "error", message: "@lofi is already taken." },
  { value: "night-owl", status: "loading" },
  { value: "night-owl", status: "success", message: "Nice, @night-owl is available." },
];

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const query = matchMedia(MOTION_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, () => matchMedia(MOTION_QUERY).matches, () => false);
}

/** Live, self-running preview of the real gallery components for the hero. */
export function HeroShowcase() {
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(18);
  const [step, setStep] = useState(3);

  useEffect(() => {
    if (reduced) return;
    const progressTimer = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 1)), 70);
    const scriptTimer = setInterval(() => setStep((s) => (s + 1) % SCRIPT.length), 1600);
    return () => {
      clearInterval(progressTimer);
      clearInterval(scriptTimer);
    };
  }, [reduced]);

  const frame = SCRIPT[step];

  return (
    <div aria-hidden="true" inert className="relative mx-auto w-full max-w-md select-none lg:max-w-none">
      {/* Main card */}
      <div className="gradient-ring float-slow rounded-3xl shadow-2xl shadow-[var(--glow)]">
        <div className="rounded-[calc(1.5rem-1px)] bg-surface/95 p-6 backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] text-accent">live preview</span>
          </div>

          <div className="stage-glow flex flex-col items-center gap-3 rounded-2xl border border-line py-8">
            <OrbitLoader size={96} progress={progress} label="Uploading" className="text-accent" />
            <span className="font-mono text-xs text-fg-muted tabular-nums">uploading assets · {progress}%</span>
          </div>

          <div className="mt-6">
            <SignalInput
              label="Claim your handle"
              value={frame.value}
              onChange={() => {}}
              status={frame.status}
              statusMessage={frame.message}
              hint="Checking availability…"
              tabIndex={-1}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Floating mini cards */}
      <div className="float-slower absolute -top-6 -left-4 hidden rounded-2xl border border-line bg-surface/90 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block lg:-left-10">
        <div className="flex items-center gap-2.5">
          <OrbitLoader size={28} orbits={2} className="text-grad-2" />
          <div className="leading-tight">
            <p className="text-xs font-semibold">Syncing</p>
            <p className="text-[11px] text-fg-muted">3 orbits · 1.6s</p>
          </div>
        </div>
      </div>
      <div className="float-slow absolute -right-3 -bottom-5 hidden rounded-2xl border border-line bg-surface/90 px-3.5 py-2.5 shadow-xl backdrop-blur sm:block lg:-right-8">
        <p className="font-mono text-[11px] text-fg-muted">
          <span className="text-grad-1">&lt;SignalInput</span> status=<span className="text-grad-3">&quot;success&quot;</span>{" "}
          <span className="text-grad-1">/&gt;</span>
        </p>
      </div>
    </div>
  );
}
