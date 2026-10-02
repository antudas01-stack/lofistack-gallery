import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeBlock } from "@/components/site/code-block";
import { CopyButton } from "@/components/site/copy-button";
import { Tabs } from "@/components/site/tabs";
import { Demo } from "@/demos";
import { components, getComponent, getNeighbours } from "@/registry";
import { TYPE_STYLES } from "@/registry/type-styles";
import { sourceUrl } from "@/site.config";

export const dynamicParams = false;

export function generateStaticParams() {
  return components.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getComponent(slug);
  if (!entry) return {};
  return { title: entry.name, description: entry.summary };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getComponent(slug);
  if (!entry) notFound();

  // Component sources all live in src/components/gallery — keep the read scoped there.
  const fileName = path.basename(entry.sourcePath);
  const source = await readFile(path.join(process.cwd(), "src", "components", "gallery", fileName), "utf8");
  const { prev, next } = getNeighbours(slug);

  return (
    <div className="relative">
      <div
        className="aurora h-[30rem] opacity-60 [mask-image:linear-gradient(#000_30%,transparent)]"
        aria-hidden="true"
      >
        <span />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-fg-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/"
                className="rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Gallery
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/components"
                className="rounded hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Components
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">
              {entry.name}
            </li>
          </ol>
        </nav>

        <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium capitalize ring-1 ring-inset ${TYPE_STYLES[entry.type].badge}`}
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full"
                  style={{ background: TYPE_STYLES[entry.type].hue }}
                />
                Type: {entry.type}
              </span>
              <span className="rounded-full border border-line px-2.5 py-0.5 text-fg-muted">
                Week {String(entry.week).padStart(2, "0")}
              </span>
              <time dateTime={entry.addedOn} className="text-fg-muted">
                Added{" "}
                {new Date(entry.addedOn).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </time>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              <span className="text-gradient">{entry.name}</span>
            </h1>
            <p className="mt-3 leading-relaxed text-fg-muted">{withInlineCode(entry.description)}</p>
          </div>
          <a
            href={sourceUrl(entry.sourcePath)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:self-auto"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
            View on GitHub
          </a>
        </header>

        <Tabs
          label={`${entry.name} preview and code`}
          items={[
            { id: "preview", label: "Preview", content: <Demo slug={entry.slug} view="playground" /> },
            { id: "code", label: "Code", content: <CodeBlock code={source} filename={fileName} maxHeight="36rem" /> },
          ]}
        />

        <Section id="usage" title="Usage">
          <CodeBlock code={entry.usage} filename="usage.tsx" />
        </Section>

        <Section id="states" title="States">
          <p className="mb-4 text-sm text-fg-muted">{entry.states.join(" · ")}</p>
          <Demo slug={entry.slug} view="states" />
        </Section>

        <Section id="props" title="Props">
          <ul className="grid gap-2 sm:hidden">
            {entry.props.map((prop) => (
              <li key={prop.name} className="rounded-xl border border-line bg-surface p-3.5 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-mono text-[13px] font-medium">
                    {prop.name}
                    {prop.required && (
                      <span className="ml-0.5 text-rose-600 dark:text-rose-400" aria-label="required">
                        *
                      </span>
                    )}
                  </span>
                  {prop.default && <span className="font-mono text-xs text-fg-muted">= {prop.default}</span>}
                </div>
                <p className="mt-1 font-mono text-[12.5px] break-words text-accent">{prop.type}</p>
                <p className="mt-2 leading-relaxed text-fg-muted">{prop.description}</p>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-surface sm:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-surface-sunken text-xs text-fg-muted">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Prop
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Default
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entry.props.map((prop) => (
                  <tr key={prop.name} className="align-top">
                    <th scope="row" className="px-4 py-3 font-mono text-[13px] font-medium whitespace-nowrap">
                      {prop.name}
                      {prop.required && (
                        <span className="ml-0.5 text-rose-600 dark:text-rose-400" aria-label="required">
                          *
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-3 font-mono text-[12.5px] text-accent">{prop.type}</td>
                    <td className="px-4 py-3 font-mono text-[12.5px] whitespace-nowrap text-fg-muted">
                      {prop.default ?? "—"}
                    </td>
                    <td className="px-4 py-3 leading-relaxed text-fg-muted">{prop.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="accessibility" title="Accessibility">
          <ul className="grid gap-2 sm:grid-cols-2">
            {entry.accessibility.map((note) => (
              <li
                key={note}
                className="flex gap-2.5 rounded-xl border border-line bg-surface p-3.5 text-sm leading-relaxed text-fg-muted"
              >
                <svg
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12.5 4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {note}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="prompt" title="Build prompt">
          <details className="group rounded-xl border border-line bg-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
              The final prompt used to build this component
              <svg
                className="size-4 text-fg-muted transition-transform group-open:rotate-180"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m6 9 6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <div className="border-t border-line p-4">
              <div className="mb-3 flex justify-end">
                <CopyButton text={entry.prompt} label="Copy prompt" />
              </div>
              <pre className="font-mono text-[13px] leading-6 whitespace-pre-wrap text-fg-muted">{entry.prompt}</pre>
            </div>
          </details>
        </Section>

        <nav aria-label="More components" className="mt-14 grid gap-3 border-t border-line pt-8 sm:grid-cols-2">
          {prev ? <PagerLink href={`/components/${prev.slug}`} direction="Previous" name={prev.name} /> : <span />}
          {next && <PagerLink href={`/components/${next.slug}`} direction="Next" name={next.name} alignEnd />}
        </nav>
      </div>
    </div>
  );
}

/** Renders `backtick` spans in registry copy as inline code. */
function withInlineCode(text: string) {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-[0.9em] text-fg">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-12">
      <h2 id={`${id}-heading`} className="mb-4 flex items-center gap-3 text-xl font-semibold tracking-tight">
        <span aria-hidden="true" className="bg-brand h-5 w-1 rounded-full" />
        <a
          href={`#${id}-heading`}
          className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

function PagerLink({
  href,
  direction,
  name,
  alignEnd,
}: {
  href: string;
  direction: string;
  name: string;
  alignEnd?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-2xl border border-line bg-surface px-5 py-4 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-[var(--glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${alignEnd ? "sm:col-start-2 sm:text-right" : ""}`}
    >
      <span className="block text-xs text-fg-muted">{direction}</span>
      <span className="font-medium">{name}</span>
    </Link>
  );
}
