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
Component: Morphing Area Chart
Live: antu-lofistack-gallery.vercel.app/components/morphing-area-chart
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/morphing-area-chart.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 chart component called MorphingAreaChart: a premium analytics area chart that morphs between time ranges.

Props (typed): title, ranges ({ id, label, points: { label, value }[] }[]), defaultRange, summary ("sum" | "average" | "last"), color, valuePrefix, valueSuffix, higherIsBetter, height, showHeader, showAxis, morphDuration, className.

Rendering (SVG, no chart library):
- Width follows the container via ResizeObserver; height from props. Padding leaves room for y labels (compact numbers like $1.2k) and x labels (first / middle / last, five when wide).
- Smooth curve with monotone cubic (Fritsch–Carlson) interpolation so it never overshoots. Sample the curve at a fixed 120 points so ranges with different lengths (7 / 30 / 90) can morph into each other.
- Glowing 2.5px line (drop-shadow in the line color), a vertical gradient area fill (38% → 0%), dashed gridlines at 0/25/50/75/100% of a "nice" rounded max.
- Header: title, big compact headline (sum/average/last of the range), ▲/▼ change badge (last vs first point; green when the change is good, red when bad, flipped by higherIsBetter=false; sr-only "Up"/"Down"), and segmented range tabs (radiogroup).

Morph: on tab click, animate from the currently shown shape to the new one over morphDuration ms with easeInOutCubic. Interpolate every sample, the y max and the headline number with requestAnimationFrame. Start it in the click handler (no setState in effects). Skip it under prefers-reduced-motion.

Interaction & accessibility:
- Pointer move picks the nearest data point: dashed crosshair, a dot with a soft halo, and a floating tooltip (full formatted value + label) clamped inside the chart.
- The plot is focusable (role="group" with instructions in its aria-label). ArrowLeft/Right step points, Home/End jump. Values are announced through a polite live region.
- A visually hidden <table> holds the full data. There's an empty state for ranges with no points. Dark and light mode. No dependencies.
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
