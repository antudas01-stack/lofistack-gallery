import type { ReactNode } from "react";

export function PlaygroundShell({ stage, controls }: { stage: ReactNode; controls: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-3xl border border-line bg-surface shadow-xl shadow-[var(--glow)] lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="stage-glow relative flex min-h-72 min-w-0 items-center justify-center p-6 sm:min-h-[26rem] sm:p-10">
        {stage}
      </div>
      <aside
        aria-label="Playground controls"
        className="flex flex-col gap-4 border-t border-line bg-surface p-5 lg:border-t-0 lg:border-l"
      >
        <p className="text-xs font-semibold tracking-wider text-fg-muted uppercase">Controls</p>
        {controls}
      </aside>
    </div>
  );
}

export function StateTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-line-strong">
      <div className="stage-grid flex min-h-28 flex-1 items-center justify-center p-4">{children}</div>
      <figcaption className="border-t border-line px-3 py-2 text-xs font-medium text-fg-muted">{label}</figcaption>
    </figure>
  );
}
