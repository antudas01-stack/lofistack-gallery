"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { CommandPalette, type CommandItem } from "@/components/gallery/command-palette";
import { Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const icon = (d: string): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONS = {
  rocket: icon("M12 15l-3-3a19 19 0 0 1 9-9c0 4-1 7-6 12Zm-3-3H5l2-4h4m1 7v4l4-2v-4M5 19l2-2"),
  redo: icon("M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"),
  plus: icon("M12 5v14M5 12h14"),
  user: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"),
  chart: icon("M4 20V10m6 10V4m6 16v-7m4 7H2"),
  gear: icon(
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  ),
  moon: icon("M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"),
  doc: icon("M7 3h7l5 5v13H7zM14 3v5h5"),
  logout: icon("M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"),
  trash: icon("M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"),
};

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
function useModKey() {
  return useSyncExternalStore(
    () => () => {},
    () => (isMac() ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}

function buildItems(log: (msg: string) => void, mod: string): CommandItem[] {
  return [
    {
      id: "deploy",
      label: "Deploy to production",
      group: "Actions",
      icon: ICONS.rocket,
      shortcut: [mod, "D"],
      keywords: ["ship", "release", "publish"],
      onSelect: () => log("Deploying to production…"),
    },
    {
      id: "redeploy",
      label: "Redeploy last build",
      group: "Actions",
      icon: ICONS.redo,
      keywords: ["retry", "rebuild"],
      onSelect: () => log("Redeploying last build…"),
    },
    {
      id: "new",
      label: "Create new project",
      group: "Actions",
      icon: ICONS.plus,
      shortcut: [mod, "N"],
      keywords: ["add", "start"],
      onSelect: () => log("New project created"),
    },
    {
      id: "invite",
      label: "Invite teammate",
      group: "Actions",
      icon: ICONS.user,
      hint: "Pro plan",
      disabled: true,
      onSelect: () => log("Invite sent"),
    },
    {
      id: "analytics",
      label: "Analytics",
      group: "Pages",
      icon: ICONS.chart,
      keywords: ["stats", "traffic", "metrics"],
      onSelect: () => log("Opened Analytics"),
    },
    {
      id: "settings",
      label: "Settings",
      group: "Pages",
      icon: ICONS.gear,
      shortcut: [mod, ","],
      keywords: ["preferences", "config"],
      onSelect: () => log("Opened Settings"),
    },
    {
      id: "docs",
      label: "Documentation",
      group: "Pages",
      icon: ICONS.doc,
      keywords: ["help", "guide"],
      onSelect: () => log("Opened Documentation"),
    },
    {
      id: "theme",
      label: "Toggle dark mode",
      group: "Preferences",
      icon: ICONS.moon,
      keywords: ["theme", "light", "appearance"],
      onSelect: () => log("Theme toggled"),
    },
    {
      id: "signout",
      label: "Sign out",
      group: "Account",
      icon: ICONS.logout,
      keywords: ["log out", "exit"],
      onSelect: () => log("Signed out"),
    },
  ];
}

function TriggerButton({
  onClick,
  mod,
  label = "Search or jump to…",
}: {
  onClick: () => void;
  mod: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-fg-muted shadow-sm transition hover:border-line-strong hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.99]"
    >
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="flex-1">{label}</span>
      <kbd className="rounded-md border border-line bg-surface-sunken px-1.5 py-0.5 font-sans text-[11px]">{mod} K</kbd>
    </button>
  );
}

export function CommandPalettePlayground() {
  const mod = useModKey();
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(["analytics"]);
  const [loading, setLoading] = useState(false);
  const [withRecent, setWithRecent] = useState(true);
  const [closeOnSelect, setCloseOnSelect] = useState(true);

  const items = useMemo(() => {
    const write = (msg: string) => setLog((l) => [msg, ...l].slice(0, 4));
    return buildItems(write, mod).map((item) => ({
      ...item,
      onSelect: () => {
        item.onSelect();
        setRecent((r) => [item.id, ...r.filter((id) => id !== item.id)].slice(0, 3));
      },
    }));
  }, [mod]);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <TriggerButton onClick={() => setOpen(true)} mod={mod} />
          <p className="text-center text-xs text-fg-muted">
            Click it or press <kbd className="rounded border border-line px-1 font-sans">{mod}</kbd> +{" "}
            <kbd className="rounded border border-line px-1 font-sans">K</kbd> anywhere on this page. Try typing “dpl”
            or “stats”.
          </p>
          <ul aria-label="Selected commands" className="min-h-20 w-full space-y-1 font-mono text-[11px] text-fg-muted">
            {log.length === 0 ? (
              <li className="text-center">Selected commands appear here.</li>
            ) : (
              log.map((line, i) => <li key={`${line}-${i}`}>→ {line}</li>)
            )}
          </ul>
          <CommandPalette
            items={items}
            open={open}
            onOpenChange={setOpen}
            recentIds={withRecent ? recent : []}
            loading={loading}
            closeOnSelect={closeOnSelect}
          />
        </div>
      }
      controls={
        <div className="flex flex-col gap-1">
          <Toggle label="Recent group" checked={withRecent} onChange={setWithRecent} />
          <Toggle label="Loading row" checked={loading} onChange={setLoading} />
          <Toggle label="Close on select" checked={closeOnSelect} onChange={setCloseOnSelect} />
          <p className="mt-3 text-xs leading-relaxed text-fg-muted">
            “Invite teammate” is <span className="font-medium text-fg">disabled</span>, so arrow keys skip it. Selecting
            a command moves it to Recent.
          </p>
        </div>
      }
    />
  );
}

/** Static, always-open preview for the states grid and gallery card. */
function InlinePreview({
  query,
  rows,
}: {
  query: string;
  rows: Array<{ label: string; group?: string; active?: boolean; disabled?: boolean; mark?: string }>;
}) {
  return (
    <div
      aria-hidden="true"
      inert
      className="w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 bg-white text-left text-zinc-800 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
    >
      <div className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3 text-sm dark:border-zinc-800">
        <svg className="size-4 text-zinc-400" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {query ? <span>{query}</span> : <span className="text-zinc-400">Type a command or search…</span>}
      </div>
      <div className="p-1.5">
        {rows.length === 0 && <p className="py-6 text-center text-xs text-zinc-500">No results for “{query}”</p>}
        {rows.map((row, i) => {
          const heading = row.group && (i === 0 || rows[i - 1].group !== row.group) ? row.group : null;
          return (
            <div key={row.label}>
              {heading && (
                <p className="px-2 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                  {heading}
                </p>
              )}
              <p
                className={`rounded-lg px-2 py-1.5 text-xs ${row.active ? "bg-indigo-50 dark:bg-indigo-500/15" : ""} ${row.disabled ? "opacity-45" : ""}`}
              >
                {row.mark ? (
                  <>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-300">{row.mark}</span>
                    {row.label.slice(row.mark.length)}
                  </>
                ) : (
                  row.label
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommandPaletteStates() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StateTile label="Empty query + Recent">
        <InlinePreview
          query=""
          rows={[
            { label: "Analytics", group: "Recent", active: true },
            { label: "Deploy to production", group: "Actions" },
            { label: "Redeploy last build", group: "Actions" },
          ]}
        />
      </StateTile>
      <StateTile label="Fuzzy match highlighted">
        <InlinePreview
          query="dep"
          rows={[
            { label: "Deploy to production", group: "Actions", active: true, mark: "Dep" },
            { label: "Redeploy last build", group: "Actions" },
          ]}
        />
      </StateTile>
      <StateTile label="Disabled item (skipped)">
        <InlinePreview
          query="inv"
          rows={[{ label: "Invite teammate", group: "Actions", disabled: true, mark: "Inv" }]}
        />
      </StateTile>
      <StateTile label="No results">
        <InlinePreview query="xyz" rows={[]} />
      </StateTile>
    </div>
  );
}

export function CommandPaletteCard() {
  return (
    <InlinePreview
      query="dep"
      rows={[
        { label: "Deploy to production", group: "Actions", active: true, mark: "Dep" },
        { label: "Redeploy last build", group: "Actions" },
      ]}
    />
  );
}
