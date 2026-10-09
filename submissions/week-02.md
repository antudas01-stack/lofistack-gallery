# Week 02 submissions

Live site: https://antu-lofistack-gallery.vercel.app
One post per submission, so three posts this week.

---

## Post 1 — Component

```
Week: 02
Type: button
Component: Hold-to-Confirm Button
Live: antu-lofistack-gallery.vercel.app/components/hold-to-confirm-button
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/hold-to-confirm-button.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called HoldToConfirmButton: a press-and-hold button that replaces "Are you sure?" dialogs for risky actions.

Interaction:
- pointerdown (primary button, with pointer capture) or keydown Space/Enter (ignore key repeat) starts the hold. A setTimeout decides completion after `duration` ms; requestAnimationFrame only paints the progress, so a throttled tab can't stall it.
- Progress drives a fill layer: an absolutely positioned, solid-colored copy of the button content revealed left-to-right with clip-path: inset(0 X% 0 0), so the label inverts as the fill passes it. No transition while holding; a 380ms ease back to 0 when cancelled.
- Releasing early (pointerup, pointercancel, lost capture, keyup, blur) cancels.
- On completion call onConfirm(). If it returns a promise show a pending spinner, and reset to idle if it rejects. Then show a confirmed state (check icon + scale pop + soft ring burst) and reset after `resetAfter` ms (0 = stay confirmed).

Props (typed, extending native button attributes minus children/onClick): label, holdingLabel, confirmedLabel, duration, onConfirm, tone ("danger" | "primary" | "neutral"), size ("sm" | "md" | "lg"), icon, resetAfter, ref (React 19 ref-as-prop).

Details:
- Stack all labels in one CSS grid cell (inactive ones invisible) so the width never jumps.
- Press-in scale while holding, touch-none and select-none, block the long-press context menu.
- Accessibility: native button, aria-describedby hint "Press and hold for N seconds to confirm" and a polite live region placed outside the button so they don't pollute its name, aria-disabled while pending/confirmed, focus-visible ring per tone, AA contrast in light and dark mode.
- Self-contained: no dependencies, keyframes shipped via a React 19 <style href precedence> tag, animations off under prefers-reduced-motion.
```

---

## Post 2 — Component

```
Week: 02
Type: chart
Component: Streak Heatmap
Live: antu-lofistack-gallery.vercel.app/components/streak-heatmap
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/streak-heatmap.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 chart component called StreakHeatmap: a GitHub-style activity calendar.

Data: props.data is { date: "YYYY-MM-DD", value: number }[] (sum duplicates). Show `days` days (default 91 = 13 weeks) ending at `end` (default: latest date in data). Do all date math in UTC so server and client render identically.

Layout:
- CSS grid with 7 rows (weekdays) and grid-auto-flow: column (one column per week). Pad the start with empty cells so rows line up with weekStartsOn (0 = Sun, 1 = Mon).
- Month labels above the columns that contain the 1st of a month, and Mon/Wed/Fri labels on the left (toggle with showLabels).
- Five intensity levels from `levels` thresholds (default [1,3,6,10]). Level colors come from one `color` prop via color-mix(in oklab, color N%, transparent). Level 0 is a neutral gray.
- Optional stats row (showStats): current streak (counting back from the last day, where an empty last day doesn't break it yet), longest streak, and total.
- Footer: a live readout ("Fri, Oct 9 · 6 commits") that follows hover and focus, plus a Less → More legend (showLegend).

Interaction & accessibility:
- Each day is a <button> with a full aria-label ("Friday, October 9, 2026: 6 commits"). Use a roving tabindex: one Tab stop, ArrowLeft/Right = ±1 week, ArrowUp/Down = ±1 day, Home/End jump to the ends. Focus-visible outline and hover scale.
- onSelect(day) fires on click / Enter / Space.
- The readout is aria-live="polite". The group has an aria-label that explains the arrow keys.
- Wide ranges scroll horizontally inside the component. No dependencies, and no hardcoded data or colors.
```

---

## Post 3 — Agent log

```
Week: 02
Task: Give my live gallery a personal domain and redirect the old link
Agent: Claude in Chrome (Claude Opus 5.5 driving my browser)
Prompt or workflow:
"The Vercel link shows lofistack-gallery.vercel.app but it should be named by my name: antu-lofistack-gallery.vercel.app."
The agent opened my Vercel project's Domains settings in Chrome, added antu-lofistack-gallery.vercel.app to Production, then switched the old lofistack-gallery.vercel.app to a 308 permanent redirect pointing at the new one. It checked every page on both URLs with curl (200 on the new domain, 308 → new domain on the old one) and updated the README and submission files in the repo.
Result: My gallery now lives at a URL with my name, and every link I'd already shared still works. Browser work like this used to mean clicking through dashboards myself; this time I only described the outcome.
```
