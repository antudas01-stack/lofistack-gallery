"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Demo } from "@/demos";
import { TYPE_STYLES } from "@/registry/type-styles";
import { COMPONENT_TYPES, type ComponentEntry, type ComponentType } from "@/registry/types";
import { Spotlight } from "./spotlight";

type Filter = "all" | ComponentType;

export function GalleryGrid({ items }: { items: ComponentEntry[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const map = new Map<ComponentType, number>();
    for (const item of items) map.set(item.type, (map.get(item.type) ?? 0) + 1);
    return map;
  }, [items]);

  const visible = filter === "all" ? items : items.filter((item) => item.type === filter);

  return (
    <div>
      <div role="group" aria-label="Filter by type" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" count={items.length} />
        {COMPONENT_TYPES.map((type) => (
          <FilterChip
            key={type}
            active={filter === type}
            onClick={() => setFilter(type)}
            label={type}
            count={counts.get(type) ?? 0}
            hue={TYPE_STYLES[type].hue}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-fg-muted">
          No <span className="font-medium text-fg">{filter}</span> components yet — coming in a future week.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <li key={item.slug}>
              <ComponentCard item={item} index={items.indexOf(item)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  hue,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  hue?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        active
          ? "border-transparent bg-fg text-bg shadow-md"
          : "border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg"
      } ${count === 0 && !active ? "opacity-55" : ""}`}
    >
      {hue && <span aria-hidden="true" className="size-2 rounded-full" style={{ background: hue }} />}
      {label}
      <span className={`text-xs tabular-nums ${active ? "opacity-70" : "text-fg-muted"}`}>{count}</span>
    </button>
  );
}

function ComponentCard({ item, index }: { item: ComponentEntry; index: number }) {
  const style = TYPE_STYLES[item.type];
  return (
    <Spotlight className="group h-full rounded-2xl transition duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 group-hover:shadow-2xl group-hover:shadow-[var(--glow)]">
        <div
          className="stage-grid relative flex h-48 items-center justify-center overflow-hidden border-b border-line px-6"
          aria-hidden="true"
          inert
        >
          <div
            className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: `radial-gradient(55% 65% at 50% 55%, ${style.hue}55, transparent 72%)` }}
          />
          <span className="absolute top-3 left-3 font-mono text-[11px] text-fg-muted">#{String(index + 1).padStart(2, "0")}</span>
          <div className="relative transition-transform duration-500 group-hover:scale-105">
            <Demo slug={item.slug} view="card" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <div className="flex items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-medium capitalize ring-1 ring-inset ${style.badge}`}>{item.type}</span>
            <span className="text-fg-muted">Week {String(item.week).padStart(2, "0")}</span>
          </div>
          <h3 className="flex items-center justify-between gap-3 text-lg font-semibold tracking-tight">
            <Link href={`/components/${item.slug}`} className="focus-visible:outline-none after:absolute after:inset-0 after:content-['']">
              {item.name}
            </Link>
            <svg
              className="size-4 shrink-0 -translate-x-1 text-accent opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </h3>
          <p className="text-sm leading-relaxed text-fg-muted">{item.summary}</p>
        </div>
      </article>
    </Spotlight>
  );
}
