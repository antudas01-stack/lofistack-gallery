"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface IslandMenuItem {
  label: string;
  description?: string;
  href?: string;
  icon?: ReactNode;
}

export interface IslandNavLink {
  id: string;
  label: string;
  href?: string;
  /** Sub-links shown in the expanded island. */
  menu?: IslandMenuItem[];
}

export interface IslandNotification {
  title: string;
  message?: string;
  icon?: ReactNode;
}

export interface DynamicIslandNavProps {
  links: IslandNavLink[];
  /** Controlled active link. */
  activeId?: string;
  defaultActiveId?: string;
  onNavigate?: (id: string) => void;
  /** Mark shown on the left, e.g. a logo. */
  logo?: ReactNode;
  /** Accessible name for the nav landmark. */
  label?: string;
  /** Show the search button; called with the query on Enter. */
  onSearch?: (query: string) => void;
  /** When set, the island expands to show it. Clear it to collapse. */
  notification?: IslandNotification | null;
  onDismissNotification?: () => void;
  className?: string;
}

type Panel = { type: "menu"; id: string } | { type: "search" } | { type: "notification" };

const KEYFRAMES = `
@keyframes ls-island-pop { 0% { transform: scale(1); } 45% { transform: scale(1.035); } 100% { transform: scale(1); } }
@keyframes ls-island-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.ls-island[data-alert="true"] { animation: ls-island-pop 420ms cubic-bezier(.2,.9,.3,1.2); }
.ls-island-panel > * { animation: ls-island-fade 260ms ease-out both; }
@media (prefers-reduced-motion: reduce) { .ls-island[data-alert="true"], .ls-island-panel > * { animation: none; } }`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SearchIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function DynamicIslandNav({
  links,
  activeId,
  defaultActiveId,
  onNavigate,
  logo,
  label = "Main",
  onSearch,
  notification = null,
  onDismissNotification,
  className,
}: DynamicIslandNavProps) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const [innerActive, setInnerActive] = useState(defaultActiveId ?? links[0]?.id);
  const active = activeId ?? innerActive;

  // `open` drives the morph; `panel` keeps the last content so it stays visible while collapsing.
  const [open, setOpen] = useState<Panel | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [lastNote, setLastNote] = useState<IslandNotification | null>(notification);
  const [query, setQuery] = useState("");

  const rootRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const highlightRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusFirst = useRef(false);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Remember the latest notification (adjusting state during render, per React docs).
  if (notification && notification !== lastNote) setLastNote(notification);

  const shown: Panel | null = notification ? { type: "notification" } : open;
  const content: Panel | null = notification ? { type: "notification" } : (open ?? panel);

  const show = (next: Panel | null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(next);
    if (next) setPanel(next);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Move focus into a menu opened from the keyboard.
  useEffect(() => {
    if (!focusFirst.current || !open) return;
    focusFirst.current = false;
    rootRef.current?.querySelector<HTMLElement>(`#${CSS.escape(panelId)} a, #${CSS.escape(panelId)} input`)?.focus();
  }, [open, panelId]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const navigate = (id: string) => {
    if (activeId === undefined) setInnerActive(id);
    onNavigate?.(id);
    show(null);
  };

  const onRootKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !open) return;
    const trigger = open.type === "menu" ? triggerRefs.current[open.id] : triggerRefs.current.__search;
    show(null);
    trigger?.focus();
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusFirst.current = true;
      show({ type: "menu", id });
    }
  };

  const menuLink = shown?.type === "menu" ? links.find((l) => l.id === shown.id) : null;
  const panelLink = content?.type === "menu" ? links.find((l) => l.id === content.id) : null;
  const highlightTarget = menuLink?.id ?? active;

  // Slide the highlight by writing styles directly: correct on first paint, no re-render per frame.
  useLayoutEffect(() => {
    const row = rowRef.current;
    const pill = highlightRef.current;
    if (!row || !pill) return;
    const place = () => {
      const tab = row.querySelector<HTMLElement>(`[data-tab="${CSS.escape(highlightTarget ?? "")}"]`);
      pill.style.opacity = tab ? "1" : "0";
      if (!tab) return;
      pill.style.left = `${tab.offsetLeft}px`;
      pill.style.width = `${tab.offsetWidth}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(row);
    return () => observer.disconnect();
  }, [highlightTarget, links]);
  const suggestions = links
    .flatMap((l) => [l.label, ...(l.menu ?? []).map((m) => m.label)])
    .filter((s) => query && s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);

  return (
    <nav
      ref={rootRef}
      aria-label={label}
      onKeyDown={onRootKeyDown}
      onPointerLeave={() => open?.type === "menu" && scheduleClose()}
      onPointerEnter={() => closeTimer.current && clearTimeout(closeTimer.current)}
      className={cn("relative inline-flex max-w-full min-w-0", className)}
    >
      <style href="ls-dynamic-island" precedence="default">
        {KEYFRAMES}
      </style>
      <div
        data-alert={Boolean(notification)}
        className="ls-island flex max-w-full min-w-0 flex-col overflow-hidden rounded-[28px] bg-zinc-950 text-zinc-100 shadow-2xl ring-1 shadow-black/30 ring-white/10"
      >
        <div className="flex min-w-0 items-center gap-1 p-1.5">
          {logo && (
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 [&_svg]:size-5"
            >
              {logo}
            </span>
          )}

          <ul ref={rowRef} className="relative flex min-w-0 items-center overflow-x-auto [scrollbar-width:none]">
            <li
              ref={highlightRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 h-full rounded-full bg-white/12 opacity-0 transition-[left,width] duration-300 ease-[cubic-bezier(.2,.9,.3,1.1)] motion-reduce:transition-none"
            />
            {links.map((link) => {
              const isActive = link.id === active;
              const expanded = shown?.type === "menu" && shown.id === link.id;
              const base =
                "relative z-10 flex h-10 items-center gap-1 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
              const tone = isActive || expanded ? "text-white" : "text-zinc-400 hover:text-zinc-100";
              return (
                <li key={link.id} data-tab={link.id}>
                  {link.menu ? (
                    <button
                      ref={(node) => {
                        triggerRefs.current[link.id] = node;
                      }}
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      aria-current={isActive ? "page" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && show({ type: "menu", id: link.id })}
                      onClick={() => show(expanded ? null : { type: "menu", id: link.id })}
                      onKeyDown={(e) => onTriggerKeyDown(e, link.id)}
                      className={cn(base, tone)}
                    >
                      {link.label}
                      <svg
                        className={cn("size-3.5 transition-transform duration-300", expanded && "rotate-180")}
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="m6 9 6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    <a
                      href={link.href ?? "#"}
                      aria-current={isActive ? "page" : undefined}
                      onPointerEnter={(e) => e.pointerType === "mouse" && open?.type === "menu" && show(null)}
                      onClick={(e) => {
                        if (!link.href) e.preventDefault();
                        navigate(link.id);
                      }}
                      className={cn(base, tone)}
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>

          {onSearch && (
            <button
              ref={(node) => {
                triggerRefs.current.__search = node;
              }}
              type="button"
              aria-label="Search"
              aria-expanded={shown?.type === "search"}
              aria-controls={panelId}
              onClick={() => {
                focusFirst.current = true;
                show(shown?.type === "search" ? null : { type: "search" });
              }}
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                shown?.type === "search" ? "bg-white/12 text-white" : "text-zinc-400 hover:bg-white/8 hover:text-white",
              )}
            >
              <SearchIcon />
            </button>
          )}
        </div>

        {/* Expanding panel: grid-rows 0fr → 1fr animates height without measuring. */}
        <div
          id={panelId}
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.9,.3,1)] motion-reduce:transition-none"
          style={{ gridTemplateRows: shown ? "1fr" : "0fr" }}
          inert={!shown}
        >
          <div className="min-h-0 overflow-hidden">
            <div key={content ? JSON.stringify(content) : "none"} className="ls-island-panel px-3 pb-3">
              {content?.type === "menu" && panelLink?.menu && (
                <ul
                  className="grid gap-1 border-t border-white/10 pt-3 sm:grid-cols-2"
                  aria-label={`${panelLink.label} links`}
                >
                  {panelLink.menu.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href ?? "#"}
                        onClick={(e) => {
                          if (!item.href) e.preventDefault();
                          navigate(panelLink.id);
                        }}
                        className="flex gap-3 rounded-2xl p-2.5 transition-colors hover:bg-white/8 focus-visible:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      >
                        {item.icon && (
                          <span
                            aria-hidden="true"
                            className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-zinc-200 [&_svg]:size-4"
                          >
                            {item.icon}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-white">{item.label}</span>
                          {item.description && (
                            <span className="block text-xs leading-snug text-zinc-400">{item.description}</span>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {content?.type === "search" && (
                <form
                  role="search"
                  className="border-t border-white/10 pt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim()) onSearch?.(query.trim());
                    setQuery("");
                    show(null);
                  }}
                >
                  <label className="flex h-11 items-center gap-2 rounded-full bg-white/8 px-4 text-zinc-400 focus-within:ring-2 focus-within:ring-white/50">
                    <SearchIcon />
                    <span className="sr-only">Search</span>
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search pages…"
                      className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                    <kbd className="font-sans text-[11px] text-zinc-500">↵</kbd>
                  </label>
                  {suggestions.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggestions">
                      {suggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => {
                              onSearch?.(s);
                              setQuery("");
                              show(null);
                            }}
                            className="rounded-full bg-white/8 px-3 py-1 text-xs text-zinc-200 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              )}

              {content?.type === "notification" && lastNote && (
                <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                  {lastNote.icon && (
                    <span
                      aria-hidden="true"
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 [&_svg]:size-5"
                    >
                      {lastNote.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{lastNote.title}</p>
                    {lastNote.message && <p className="truncate text-xs text-zinc-400">{lastNote.message}</p>}
                  </div>
                  {onDismissNotification && (
                    <button
                      type="button"
                      aria-label="Dismiss notification"
                      onClick={onDismissNotification}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {notification ? `${notification.title}. ${notification.message ?? ""}` : ""}
      </p>
    </nav>
  );
}
