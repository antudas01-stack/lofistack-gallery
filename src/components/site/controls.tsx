"use client";

import { useId, type ReactNode } from "react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function ControlGroup({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-medium text-fg-muted">
          {label}
        </label>
      ) : (
        <span className="text-xs font-medium text-fg-muted">{label}</span>
      )}
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ControlGroup label={label}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface-sunken p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={cn(
              "flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              option.length <= 2 ? "uppercase" : "capitalize",
              value === option ? "bg-accent-soft text-accent shadow-sm ring-1 ring-accent/40" : "text-fg-muted hover:text-fg",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </ControlGroup>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format = (v) => String(v),
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <ControlGroup label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer accent-[var(--accent)]"
        />
        <span className="w-12 shrink-0 text-right text-xs tabular-nums text-fg-muted">{format(value)}</span>
      </div>
    </ControlGroup>
  );
}

export function ColorSwatches({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { name: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ControlGroup label={label}>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            aria-label={option.name}
            title={option.name}
            onClick={() => onChange(option.value)}
            className={cn(
              "size-7 rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              value === option.value ? "scale-110 border-fg" : "border-transparent hover:scale-105",
            )}
            style={{ background: option.value }}
          />
        ))}
      </div>
    </ControlGroup>
  );
}
