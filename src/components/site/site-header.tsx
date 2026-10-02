import Link from "next/link";
import { siteConfig } from "@/site.config";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span
            aria-hidden="true"
            className="bg-brand-strong grid size-8 place-items-center rounded-xl text-[11px] font-bold text-white shadow-md shadow-[var(--glow)]"
          >
            LS
          </span>
          <span>{siteConfig.name}</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/components"
            className="rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Components
          </Link>
          <a
            href={siteConfig.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-md px-2.5 py-1.5 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-block"
          >
            GitHub
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-line">
      <div aria-hidden="true" className="bg-brand absolute inset-x-0 -top-px mx-auto h-px max-w-3xl opacity-70" />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Built by {siteConfig.author} for the LofiStack 90 Day Build Challenge.
        </p>
        <p>Next.js · TypeScript · Tailwind CSS</p>
      </div>
    </footer>
  );
}
