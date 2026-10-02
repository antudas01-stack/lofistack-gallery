import Link from "next/link";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { HeroShowcase } from "@/components/site/hero-showcase";
import { Roadmap } from "@/components/site/roadmap";
import { components, countByType, currentWeek } from "@/registry";
import { siteConfig } from "@/site.config";

export default function Home() {
  const built = components.length;
  const week = currentWeek();
  const typesCovered = Object.values(countByType()).filter((n) => n > 0).length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="aurora" aria-hidden="true">
          <span />
        </div>
        <div className="hero-grid absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-24 lg:pb-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur">
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              90 Day Build Challenge · Week {String(week).padStart(2, "0")} live
            </p>
            <h1 className="text-[2.75rem] leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Components that <span className="text-gradient">feel alive.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-fg-muted sm:text-lg">
              {siteConfig.description} Two new pieces every week, each with a live playground, every UI state and
              copy-ready code.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/components"
                className="group bg-brand-strong inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--glow)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
              >
                Explore components
                <svg className="size-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href={siteConfig.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
              >
                View source
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              <Stat label="Components" value={String(built)} suffix={`/${siteConfig.target}`} />
              <Stat label="Types covered" value={String(typesCovered)} suffix="/10" />
              <Stat label="Week" value={String(week)} suffix="/13" />
            </dl>
          </div>

          <HeroShowcase />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section aria-label="Challenge progress" className="-mt-8 relative z-10">
          <Roadmap items={components} currentWeek={week} target={siteConfig.target} />
        </section>

        <section aria-labelledby="all-components" className="py-16 sm:py-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold tracking-widest text-accent uppercase">The library</p>
              <h2 id="all-components" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                All components
              </h2>
            </div>
            <p className="text-sm text-fg-muted">Filter by type to see what&apos;s covered.</p>
          </div>
          <GalleryGrid items={components} />
        </section>
      </div>
    </>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="flex flex-col-reverse border-l-2 border-accent/40 pl-4">
      <dt className="mt-1 text-xs text-fg-muted">{label}</dt>
      <dd className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
        {value}
        <span className="text-lg text-fg-muted sm:text-xl">{suffix}</span>
      </dd>
    </div>
  );
}
