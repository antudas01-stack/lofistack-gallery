"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface CommandItem {
  id: string;
  label: string;
  /** Group heading, e.g. "Actions" or "Pages". */
  group?: string;
  icon?: ReactNode;
  /** Keys shown on the right, e.g. ["⌘", "D"]. Display only. */
  shortcut?: string[];
  /** Extra words that should match, e.g. ["ship", "release"]. */
  keywords?: string[];
  /** Muted text after the label. */
  hint?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  /** Controlled open state. Leave undefined to let the palette manage itself. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Letter that opens the palette with ⌘ / Ctrl. Set to null to disable. */
  hotkey?: string | null;
  placeholder?: string;
  /** Item ids shown under "Recent" while the search is empty. */
  recentIds?: string[];
  /** Shows a loading row (e.g. while remote results load). */
  loading?: boolean;
  closeOnSelect?: boolean;
  className?: string;
}

interface Match {
  item: CommandItem;
  score: number;
  indices: number[];
}

const KEYFRAMES = `
@keyframes ls-cmdk-in { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
@keyframes ls-cmdk-fade { from { opacity: 0; } to { opacity: 1; } }
.ls-cmdk[open] { animation: ls-cmdk-in 200ms cubic-bezier(.2,.8,.2,1); }
.ls-cmdk[open]::backdrop { animation: ls-cmdk-fade 200ms ease-out; }
@media (prefers-reduced-motion: reduce) { .ls-cmdk[open], .ls-cmdk[open]::backdrop { animation: none; } }`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Subsequence fuzzy match with bonuses for consecutive letters and word starts. */
function fuzzy(query: string, text: string) {
  const q = query.toLowerCase().replace(/\s+/g, "");
  const t = text.toLowerCase();
  if (!q) return { score: 0, indices: [] as number[] };
  const indices: number[] = [];
  let from = 0;
  let score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, from);
    if (found === -1) return null;
    const prev = indices.at(-1);
    score += prev !== undefined && found === prev + 1 ? 3 : 1;
    if (found === 0 || /[\s\-_/.]/.test(t[found - 1])) score += 2;
    indices.push(found);
    from = found + 1;
  }
  if (t.includes(query.toLowerCase().trim())) score += 6;
  return { score: score - indices[0] * 0.05, indices };
}

function rank(items: CommandItem[], query: string): Match[] {
  const results: Match[] = [];
  for (const item of items) {
    const label = fuzzy(query, item.label);
    if (label) {
      results.push({ item, ...label });
      continue;
    }
    const keyword = (item.keywords ?? []).map((k) => fuzzy(query, k)).find(Boolean);
    if (keyword) results.push({ item, score: keyword.score * 0.6, indices: [] });
  }
  return results.sort((a, b) => b.score - a.score);
}

function groupMatches(matches: Match[]) {
  const groups = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.item.group ?? "Results";
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.entries()].map(([heading, entries]) => ({ heading, entries }));
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const set = new Set(indices);
  return (
    <>
      {[...text].map((ch, i) =>
        set.has(i) ? (
          <mark key={i} className="bg-transparent font-semibold text-indigo-600 dark:text-indigo-300">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

function PaletteBody({
  items,
  placeholder,
  recentIds,
  loading,
  onPick,
}: {
  items: CommandItem[];
  placeholder: string;
  recentIds: string[];
  loading: boolean;
  onPick: (item: CommandItem) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => {
    if (query.trim()) return groupMatches(rank(items, query));
    const recent = recentIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is CommandItem => Boolean(i))
      .map((item) => ({ item, score: 0, indices: [] }));
    const all = groupMatches(items.map((item) => ({ item, score: 0, indices: [] })));
    return recent.length ? [{ heading: "Recent", entries: recent }, ...all] : all;
  }, [items, query, recentIds]);

  const flat = groups.flatMap((g) => g.entries);
  // Clamp to the list and never rest on a disabled row.
  const clamped = Math.min(active, Math.max(0, flat.length - 1));
  const firstEnabled = flat.findIndex((m, i) => i >= clamped && !m.item.disabled);
  const safeActive =
    firstEnabled === -1
      ? Math.max(
          0,
          flat.findIndex((m) => !m.item.disabled),
        )
      : firstEnabled;
  const optionId = (i: number) => `${listId}-opt-${i}`;

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${safeActive}"]`)?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const move = (dir: 1 | -1) => {
    if (flat.length === 0) return;
    let next = safeActive;
    for (let step = 0; step < flat.length; step++) {
      next = (next + dir + flat.length) % flat.length;
      if (!flat[next].item.disabled) break;
    }
    setActive(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = flat[safeActive];
      if (match && !match.item.disabled) onPick(match.item);
    }
  };

  // Flat option index where each group starts.
  const groupStarts = groups.map((_, gi) => groups.slice(0, gi).reduce((n, g) => n + g.entries.length, 0));

  return (
    <>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <svg className="size-5 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={flat.length ? optionId(safeActive) : undefined}
          aria-autocomplete="list"
          aria-label="Search commands"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          className="h-14 w-full bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
        />
        <kbd className="hidden rounded-md border border-zinc-200 px-1.5 py-0.5 font-sans text-[11px] text-zinc-500 sm:block dark:border-zinc-700 dark:text-zinc-400">
          esc
        </kbd>
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Commands"
        className="max-h-[min(60vh,380px)] overflow-y-auto p-2"
      >
        {loading && (
          <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-500 dark:text-zinc-400" role="status">
            <svg
              className="size-4 animate-spin text-indigo-500 motion-reduce:animate-[spin_3s_linear_infinite]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Loading more results…
          </div>
        )}
        {flat.length === 0 && !loading && (
          <p className="px-3 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400" role="status">
            No results for “{query}”
          </p>
        )}
        {groups.map((group, gi) => {
          const headingId = `${listId}-${group.heading.replace(/\W+/g, "-")}`;
          return (
            <div key={group.heading} role="group" aria-labelledby={headingId} className="mb-1 last:mb-0">
              <p
                id={headingId}
                className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400"
              >
                {group.heading}
              </p>
              {group.entries.map(({ item, indices }, ei) => {
                const i = groupStarts[gi] + ei;
                const selected = i === safeActive;
                return (
                  <div
                    key={`${group.heading}-${item.id}`}
                    id={optionId(i)}
                    data-index={i}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={item.disabled || undefined}
                    onPointerMove={() => !item.disabled && setActive(i)}
                    onClick={() => !item.disabled && onPick(item)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                      selected
                        ? "bg-indigo-50 text-zinc-900 dark:bg-indigo-500/15 dark:text-white"
                        : "text-zinc-700 dark:text-zinc-300",
                      item.disabled && "cursor-not-allowed opacity-45",
                    )}
                  >
                    {item.icon && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg border [&_svg]:size-4",
                          selected
                            ? "border-indigo-200 bg-white text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/20 dark:text-indigo-200"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      <Highlight text={item.label} indices={indices} />
                      {item.hint && <span className="ml-2 text-zinc-400 dark:text-zinc-500">{item.hint}</span>}
                    </span>
                    {item.shortcut && (
                      <span
                        className="hidden shrink-0 gap-1 sm:flex"
                        aria-label={`Shortcut ${item.shortcut.join(" ")}`}
                      >
                        {item.shortcut.map((k) => (
                          <kbd
                            key={k}
                            className="min-w-6 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 text-center font-sans text-[11px] text-zinc-500 shadow-[0_1px_0] shadow-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:shadow-zinc-950"
                          >
                            {k}
                          </kbd>
                        ))}
                      </span>
                    )}
                    {selected && (
                      <svg
                        className="size-4 shrink-0 text-indigo-500 dark:text-indigo-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M9 10 4 15l5 5M20 4v7a4 4 0 0 1-4 4H4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center gap-4 border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
        aria-hidden="true"
      >
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-zinc-200 px-1 font-sans dark:border-zinc-700">↑</kbd>
          <kbd className="rounded border border-zinc-200 px-1 font-sans dark:border-zinc-700">↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-zinc-200 px-1 font-sans dark:border-zinc-700">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-zinc-200 px-1 font-sans dark:border-zinc-700">esc</kbd>
          close
        </span>
        <span className="ml-auto tabular-nums">{flat.length} results</span>
      </div>
    </>
  );
}

export function CommandPalette({
  items,
  open,
  onOpenChange,
  hotkey = "k",
  placeholder = "Type a command or search…",
  recentIds = [],
  loading = false,
  closeOnSelect = true,
  className,
}: CommandPaletteProps) {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const dialogRef = useRef<HTMLDialogElement>(null);

  const setOpen = (next: boolean) => {
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    setOpenRef.current = setOpen;
  });

  // Keep the native <dialog> (focus trap, Esc, inert background) in sync with state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    document.documentElement.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === hotkey.toLowerCase()) {
        event.preventDefault();
        setOpenRef.current(!dialogRef.current?.open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  const pick = (item: CommandItem) => {
    item.onSelect();
    if (closeOnSelect) setOpen(false);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Command palette"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      className={cn(
        "ls-cmdk m-auto mt-[12vh] w-[min(640px,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl shadow-black/25",
        "backdrop:bg-zinc-950/40 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
        className,
      )}
    >
      <style href="ls-command-palette" precedence="default">
        {KEYFRAMES}
      </style>
      {isOpen && (
        <PaletteBody items={items} placeholder={placeholder} recentIds={recentIds} loading={loading} onPick={pick} />
      )}
    </dialog>
  );
}
