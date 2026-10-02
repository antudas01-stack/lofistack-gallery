import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { components } from "@/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "Every component in the gallery, filterable by type.",
};

export default function ComponentsIndex() {
  return (
    <div className="relative">
      <div className="aurora h-[26rem] opacity-60 [mask-image:linear-gradient(#000_30%,transparent)]" aria-hidden="true">
        <span />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="mb-2 text-xs font-semibold tracking-widest text-accent uppercase">The library</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Every <span className="text-gradient">component</span>
        </h1>
        <p className="mt-4 mb-10 max-w-2xl text-fg-muted">
          Filter by type to see coverage. Each card opens the component&apos;s own page with a playground, states and code.
        </p>
        <GalleryGrid items={components} />
      </div>
    </div>
  );
}
