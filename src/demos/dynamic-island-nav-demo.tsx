"use client";

import { useRef, useState, type ReactNode } from "react";
import { DynamicIslandNav, type IslandNavLink, type IslandNotification } from "@/components/gallery/dynamic-island-nav";
import { Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const icon = (d: string): ReactNode => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Logo = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

const LINKS: IslandNavLink[] = [
  { id: "home", label: "Home" },
  {
    id: "work",
    label: "Work",
    menu: [
      { label: "Case studies", description: "Deep dives into shipped projects", icon: icon("M4 5h16v14H4zM4 9h16") },
      {
        label: "Clients",
        description: "Who we've worked with",
        icon: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"),
      },
      { label: "Process", description: "How a project runs", icon: icon("M4 12h4l3-7 3 14 3-7h3") },
      { label: "Open source", description: "Things we give away", icon: icon("m8 8-5 4 5 4m8-8 5 4-5 4M14 4l-4 16") },
    ],
  },
  { id: "blog", label: "Blog" },
  { id: "about", label: "About" },
];

const NOTES: IslandNotification[] = [
  { title: "Deploy finished", message: "lofi-site is live on production", icon: icon("m5 12.5 4.5 4.5L19 7.5") },
  { title: "New message from Leo", message: "“Loved the new homepage!”", icon: icon("M4 5h16v11H8l-4 4z") },
  { title: "Payment received", message: "$420.00 from Aria Studio", icon: icon("M3 7h18v10H3zM3 11h18") },
];

const PAGE_COPY: Record<string, string> = {
  home: "We design and build calm, fast websites.",
  work: "Selected projects from the last few years.",
  blog: "Notes on design systems, motion and CSS.",
  about: "A tiny studio with a big love for details.",
};

export function DynamicIslandNavPlayground() {
  const [active, setActive] = useState("home");
  const [notification, setNotification] = useState<IslandNotification | null>(null);
  const [withLogo, setWithLogo] = useState(true);
  const [withSearch, setWithSearch] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const noteIndex = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const write = (msg: string) => setLog((l) => [msg, ...l].slice(0, 3));

  const notify = () => {
    if (timer.current) clearTimeout(timer.current);
    setNotification(NOTES[noteIndex.current % NOTES.length]);
    noteIndex.current += 1;
    timer.current = setTimeout(() => setNotification(null), 4000);
  };

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 self-start pt-2">
          <DynamicIslandNav
            links={LINKS}
            activeId={active}
            onNavigate={(id) => {
              setActive(id);
              write(`onNavigate("${id}")`);
            }}
            logo={withLogo ? <Logo /> : undefined}
            onSearch={withSearch ? (q) => write(`onSearch("${q}")`) : undefined}
            notification={notification}
            onDismissNotification={() => setNotification(null)}
          />
          <div className="w-full rounded-2xl border border-dashed border-line-strong p-6 text-center">
            <p className="text-xs font-semibold tracking-widest text-fg-muted uppercase">{active}</p>
            <p className="mt-2 text-lg font-semibold">{PAGE_COPY[active]}</p>
            <ul aria-label="Event log" className="mt-4 space-y-1 font-mono text-[11px] text-fg-muted">
              {log.length === 0 ? (
                <li>Hover “Work”, click the search icon, or send a notification.</li>
              ) : (
                log.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)
              )}
            </ul>
          </div>
        </div>
      }
      controls={
        <>
          <button
            type="button"
            onClick={notify}
            className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Send notification
          </button>
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Logo" checked={withLogo} onChange={setWithLogo} />
            <Toggle label="Search" checked={withSearch} onChange={setWithSearch} />
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            Keyboard: Tab to “Work” and press <span className="font-medium text-fg">↓</span> to open the menu,{" "}
            <span className="font-medium text-fg">Esc</span> to close it.
          </p>
        </>
      }
    />
  );
}

export function DynamicIslandNavStates() {
  const short = LINKS.filter((l) => l.id !== "about");
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Default · logo + search">
        <DynamicIslandNav links={short} logo={<Logo />} onSearch={() => {}} />
      </StateTile>
      <StateTile label="Active link on Blog">
        <DynamicIslandNav links={short} defaultActiveId="blog" />
      </StateTile>
      <StateTile label="Notification expanded">
        <div className="min-h-32 pt-2">
          <DynamicIslandNav links={short} logo={<Logo />} notification={NOTES[0]} onDismissNotification={() => {}} />
        </div>
      </StateTile>
      <StateTile label="Plain links (no menus)">
        <DynamicIslandNav
          links={[
            { id: "a", label: "Docs" },
            { id: "b", label: "Pricing" },
            { id: "c", label: "Changelog" },
          ]}
        />
      </StateTile>
    </div>
  );
}

export function DynamicIslandNavCard() {
  return (
    <DynamicIslandNav
      links={[
        { id: "home", label: "Home" },
        { id: "work", label: "Work" },
        { id: "blog", label: "Blog" },
      ]}
      logo={<Logo />}
      notification={NOTES[0]}
    />
  );
}
