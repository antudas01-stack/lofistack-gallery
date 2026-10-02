# Week 01 submissions

Live site: https://lofistack-gallery.vercel.app
One post per submission, so three posts this week.

---

## Post 1 — Component

```
Week: 01
Type: loader
Component: Orbit Loader
Live: lofistack-gallery.vercel.app/components/orbit-loader
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/orbit-loader.tsx
Prompt:
Build a reusable React + TypeScript + Tailwind loader component called OrbitLoader.

Visual: an SVG (viewBox 100x100) with up to 3 concentric orbits (radii 44, 31, 18). Each orbit has a faint track (15% opacity) and a rounded arc segment with a solid "head" dot at its leading edge. Orbits rotate at different speeds and alternate direction so it feels like a small solar system.

Props (typed interface): size ("sm" | "md" | "lg" | number px), orbits (1–3), speed (seconds per outer revolution), color (default currentColor so it inherits text color), trackColor, progress (0–100), label, showLabel, paused, className.

Behaviour:
- No progress → indeterminate: role="status", aria-live polite, sr-only label.
- progress given → the outer orbit becomes a determinate progress ring (stroke-dashoffset, smooth transition) with the head dot at the end of the progress; role="progressbar" with aria-valuenow/min/max; caption shows "Label · 42%".
- paused freezes animation via animation-play-state.
- prefers-reduced-motion slows the animation 4x instead of removing it.
- Keep it self-contained: keyframes ship with the component via a React 19 <style href precedence> tag, no global CSS or dependencies.
- Clamp progress to 0–100 and orbits to 1–3. No hardcoded colors or sizes.
```

---

## Post 2 — Component

```
Week: 01
Type: input
Component: Signal Input
Live: lofistack-gallery.vercel.app/components/signal-input
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/signal-input.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 input component called SignalInput, designed for async validation (e.g. checking if a username is available).

Core idea: a 2px "signal bar" runs along the bottom edge of the field. It grows from the left on focus (indigo), shows an indeterminate sweeping segment while status="loading", fills emerald on success and rose on error. On error the field also does a short shake (disabled under prefers-reduced-motion).

Props (typed interface extending native input attributes, minus size/prefix): label (required, always visible), hint, status ("idle" | "loading" | "success" | "error"), statusMessage, size ("sm" | "md" | "lg"), leadingIcon (ReactNode), clearable + onClear, showCount (uses maxLength), className, ref (React 19 ref-as-prop, merged with an internal ref so the clear button can refocus the input).

Requirements:
- Works controlled (value + onChange) and uncontrolled (defaultValue).
- Trailing area: clear button (only when there is a value and the field is not disabled/read-only) + status icon (spinner / check / alert).
- States: hover, focus-within ring, loading, success, error, disabled (muted, not-allowed cursor), read-only, counter turns amber at the limit.
- Accessibility: label htmlFor/id via useId, aria-invalid, aria-busy, aria-describedby pointing to a polite live-region message, clear button with aria-label and focus-visible ring, AA contrast in light and dark mode.
- Self-contained: no dependencies, keyframes shipped with the component via a React 19 <style href precedence> tag.
```

---

## Post 3 — Agent log

```
Week: 01
Task: Set up and ship my component gallery site (Next.js + TS + Tailwind) with the first 2 components
Agent: Claude Code (Claude Opus 5.5)
Prompt or workflow:
1. Pasted the full 90 Day Challenge brief, then the Track A tech stack + quality standards, and asked the agent to read both carefully.
2. Prompt: "now start building"
3. The agent scaffolded Next.js 16 (App Router, TypeScript, Tailwind v4), designed a registry-driven gallery (one data file powers the homepage grid, type filter, every /components/<slug> page and these submission posts), built Orbit Loader + Signal Input with typed props, all UI states and a11y, then ran lint + production build and checked every page in a browser on desktop and mobile, in light and dark mode. It fixed the issues it found along the way (low-contrast selected states in dark mode, props table on mobile, a dev server path bug).
Result: A deployable gallery with a live playground, states grid, highlighted source, usage, props table, a11y notes and the build prompt on every component page, plus ready-to-paste Week 01 posts. Saved me the whole setup (scaffold, theming, page template, code highlighting, QA) in one session, and every future week only needs a new component file + one registry entry.
```
