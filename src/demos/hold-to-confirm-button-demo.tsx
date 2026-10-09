"use client";

import { useState } from "react";
import {
  HoldToConfirmButton,
  type HoldButtonSize,
  type HoldButtonTone,
} from "@/components/gallery/hold-to-confirm-button";
import { Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-3-7-7-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function HoldToConfirmButtonPlayground() {
  const [tone, setTone] = useState<HoldButtonTone>("danger");
  const [size, setSize] = useState<HoldButtonSize>("lg");
  const [duration, setDuration] = useState(1500);
  const [asyncConfirm, setAsyncConfirm] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [withIcon, setWithIcon] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const onConfirm = () => {
    const stamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLog((l) => [`${stamp} — onConfirm fired`, ...l].slice(0, 3));
    return asyncConfirm ? wait(1200) : undefined;
  };

  return (
    <PlaygroundShell
      stage={
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">Danger zone</p>
          <p className="mt-1 font-semibold">Delete “lofi-site”</p>
          <p className="mt-1 mb-5 text-sm text-fg-muted">
            This removes the project and all deployments. There is no undo.
          </p>
          <HoldToConfirmButton
            label="Delete project"
            holdingLabel="Keep holding…"
            confirmedLabel="Project deleted"
            tone={tone}
            size={size}
            duration={duration}
            disabled={disabled}
            icon={withIcon ? <TrashIcon /> : undefined}
            onConfirm={onConfirm}
            className="w-full"
          />
          <ul aria-label="Event log" className="mt-4 min-h-12 space-y-1 font-mono text-[11px] text-fg-muted">
            {log.length === 0 ? (
              <li>Press and hold the button (mouse, touch, Space or Enter).</li>
            ) : (
              log.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)
            )}
          </ul>
        </div>
      }
      controls={
        <>
          <Segmented label="Tone" options={["danger", "primary", "neutral"] as const} value={tone} onChange={setTone} />
          <Segmented label="Size" options={["sm", "md", "lg"] as const} value={size} onChange={setSize} />
          <Slider
            label="Hold duration"
            value={duration}
            min={500}
            max={4000}
            step={100}
            format={(v) => `${(v / 1000).toFixed(1)}s`}
            onChange={setDuration}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Async confirm (pending state)" checked={asyncConfirm} onChange={setAsyncConfirm} />
            <Toggle label="Icon" checked={withIcon} onChange={setWithIcon} />
            <Toggle label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
        </>
      }
    />
  );
}

export function HoldToConfirmButtonStates() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StateTile label="Danger (default)">
        <HoldToConfirmButton label="Delete" icon={<TrashIcon />} confirmedLabel="Deleted" onConfirm={() => {}} />
      </StateTile>
      <StateTile label="Primary + async">
        <HoldToConfirmButton
          label="Publish"
          tone="primary"
          icon={<SendIcon />}
          confirmedLabel="Published"
          onConfirm={() => wait(1000)}
        />
      </StateTile>
      <StateTile label="Neutral, 3s hold">
        <HoldToConfirmButton
          label="Reset settings"
          tone="neutral"
          duration={3000}
          confirmedLabel="Reset"
          onConfirm={() => {}}
        />
      </StateTile>
      <StateTile label="Small">
        <HoldToConfirmButton label="Remove" size="sm" onConfirm={() => {}} />
      </StateTile>
      <StateTile label="Stays confirmed">
        <HoldToConfirmButton
          label="Archive"
          tone="primary"
          confirmedLabel="Archived"
          resetAfter={0}
          onConfirm={() => {}}
        />
      </StateTile>
      <StateTile label="Disabled">
        <HoldToConfirmButton label="Delete" icon={<TrashIcon />} disabled onConfirm={() => {}} />
      </StateTile>
    </div>
  );
}

export function HoldToConfirmButtonCard() {
  return <HoldToConfirmButton label="Hold to delete" icon={<TrashIcon />} onConfirm={() => {}} tabIndex={-1} />;
}
