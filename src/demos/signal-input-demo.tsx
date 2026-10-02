"use client";

import { useEffect, useState } from "react";
import { SignalInput, type SignalInputSize, type SignalInputStatus } from "@/components/gallery/signal-input";
import { Segmented, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const TAKEN = ["admin", "lofi", "lofistack", "antu", "root", "support"];
const PATTERN = /^[a-z0-9-]+$/i;

function AtIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="m3 7 9 6 9-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Simulates a debounced "is this username free?" request. */
function useUsernameCheck(value: string): { status: SignalInputStatus; message?: string } {
  const [result, setResult] = useState<{ value: string; ok: boolean } | null>(null);
  const trimmed = value.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < 3;
  const invalid = trimmed.length > 0 && !PATTERN.test(trimmed);

  useEffect(() => {
    if (trimmed.length < 3 || !PATTERN.test(trimmed)) return;
    const timer = setTimeout(() => {
      setResult({ value: trimmed, ok: !TAKEN.includes(trimmed.toLowerCase()) });
    }, 900);
    return () => clearTimeout(timer);
  }, [trimmed]);

  if (!trimmed) return { status: "idle" };
  if (invalid) return { status: "error", message: "Only letters, numbers and dashes." };
  if (tooShort) return { status: "idle" };
  if (!result || result.value !== trimmed) return { status: "loading" };
  return result.ok
    ? { status: "success", message: `Nice, @${trimmed} is available.` }
    : { status: "error", message: `@${trimmed} is already taken. Try another.` };
}

export function SignalInputPlayground() {
  const [value, setValue] = useState("");
  const [size, setSize] = useState<SignalInputSize>("md");
  const [override, setOverride] = useState<"live" | SignalInputStatus>("live");
  const [disabled, setDisabled] = useState(false);
  const [clearable, setClearable] = useState(true);
  const [showCount, setShowCount] = useState(true);
  const [withIcon, setWithIcon] = useState(true);

  const live = useUsernameCheck(value);
  const status = override === "live" ? live.status : override;
  const forcedMessages: Record<SignalInputStatus, string | undefined> = {
    idle: undefined,
    loading: undefined,
    success: "Nice, that one is available.",
    error: "That username is already taken.",
  };
  const message = override === "live" ? live.message : forcedMessages[override];

  return (
    <PlaygroundShell
      stage={
        <div className="w-full max-w-sm">
          <SignalInput
            label="Username"
            hint="3–20 characters. Try “lofi” to see an error."
            placeholder="lofi-builder"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            status={status}
            statusMessage={message}
            size={size}
            leadingIcon={withIcon ? <AtIcon /> : undefined}
            clearable={clearable}
            onClear={() => setValue("")}
            maxLength={20}
            showCount={showCount}
            disabled={disabled}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      }
      controls={
        <>
          <Segmented label="Status" options={["live", "idle", "loading", "success", "error"] as const} value={override} onChange={setOverride} />
          <Segmented label="Size" options={["sm", "md", "lg"] as const} value={size} onChange={setSize} />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Leading icon" checked={withIcon} onChange={setWithIcon} />
            <Toggle label="Clearable" checked={clearable} onChange={setClearable} />
            <Toggle label="Character count" checked={showCount} onChange={setShowCount} />
            <Toggle label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg">Live</span> runs a fake 900ms availability check after you stop typing.
          </p>
        </>
      }
    />
  );
}

export function SignalInputStates() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StateTile label="Default">
        <SignalInput label="Email" placeholder="you@studio.com" leadingIcon={<MailIcon />} hint="We never share it." />
      </StateTile>
      <StateTile label="Loading">
        <SignalInput label="Coupon" defaultValue="LOFI-2026" status="loading" hint="Checking code…" />
      </StateTile>
      <StateTile label="Success">
        <SignalInput label="Coupon" defaultValue="LOFI-2026" status="success" statusMessage="20% off applied." />
      </StateTile>
      <StateTile label="Error">
        <SignalInput label="Username" defaultValue="admin" status="error" statusMessage="That name is reserved." leadingIcon={<AtIcon />} />
      </StateTile>
      <StateTile label="Disabled">
        <SignalInput label="Workspace" defaultValue="lofistack" disabled hint="Contact an admin to rename." />
      </StateTile>
      <StateTile label="Counter at limit">
        <SignalInput label="Handle" defaultValue="twelve-chars" maxLength={12} showCount clearable />
      </StateTile>
    </div>
  );
}

export function SignalInputCard() {
  return (
    <div className="pointer-events-none w-full max-w-60" inert>
      <SignalInput label="Username" defaultValue="lofi-builder" status="success" statusMessage="Available" size="sm" leadingIcon={<AtIcon />} />
    </div>
  );
}
