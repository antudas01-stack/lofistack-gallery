import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Component not found</h1>
      <p className="mt-3 text-fg-muted">That page doesn&apos;t exist yet — it might be coming in a future week.</p>
      <Link
        href="/components"
        className="mt-8 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Browse components
      </Link>
    </div>
  );
}
