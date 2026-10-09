import { COMPONENT_TYPES, type ComponentEntry, type ComponentType } from "./types";

export const components: ComponentEntry[] = [
  {
    slug: "orbit-loader",
    name: "Orbit Loader",
    type: "loader",
    week: 1,
    addedOn: "2026-10-02",
    summary: "Concentric orbiting arcs that switch to a determinate progress ring when you pass a value.",
    description:
      "An SVG loader with up to three counter-rotating orbits. Leave `progress` empty for an indeterminate spinner, or pass 0–100 and the outer orbit becomes a progress ring with a live percentage. It inherits text color, so it works on any surface and in both themes.",
    sourcePath: "src/components/gallery/orbit-loader.tsx",
    usage: `import { OrbitLoader } from "@/components/gallery/orbit-loader";

// Indeterminate — inherits the text color
<OrbitLoader className="text-indigo-500" label="Fetching orders" />

// Determinate — outer orbit becomes a progress ring
<OrbitLoader size="lg" progress={uploaded} label="Uploading" showLabel />

// Custom color, 2 orbits, slower, paused while queued
<OrbitLoader orbits={2} speed={2.4} color="#f59e0b" paused={isQueued} />`,
    props: [
      { name: "size", type: `"sm" | "md" | "lg" | number`, default: `"md"`, description: "Preset (32 / 48 / 72px) or an exact pixel size." },
      { name: "orbits", type: "1 | 2 | 3", default: "3", description: "How many concentric orbits to render." },
      { name: "speed", type: "number", default: "1.6", description: "Seconds per revolution of the outer orbit. Inner orbits run progressively slower." },
      { name: "color", type: "string", default: `"currentColor"`, description: "Arc and head color. Any CSS color." },
      { name: "trackColor", type: "string", default: "color", description: "Track color, rendered at 15% opacity." },
      { name: "progress", type: "number", description: "0–100. Switches the outer orbit to a determinate ring and the role to progressbar." },
      { name: "label", type: "string", default: `"Loading"`, description: "Accessible name. Also the visible caption when showLabel is on." },
      { name: "showLabel", type: "boolean", default: "false", description: "Show the caption (and percentage) under the loader." },
      { name: "paused", type: "boolean", default: "false", description: "Freeze the animation without unmounting." },
      { name: "className", type: "string", description: "Extra classes for the wrapper — e.g. a text color." },
    ],
    states: ["Indeterminate (1, 2 or 3 orbits)", "Determinate progress 0–100%", "Paused", "Sizes: sm, md, lg, custom px", "Reduced motion (4× slower)"],
    accessibility: [
      `Indeterminate mode uses role="status" with a polite live region and a screen-reader label.`,
      `Determinate mode uses role="progressbar" with aria-valuenow / min / max.`,
      "The SVG is aria-hidden; the label carries the meaning.",
      "prefers-reduced-motion slows the rotation 4× instead of removing the feedback.",
    ],
    prompt: `Build a reusable React + TypeScript + Tailwind loader component called OrbitLoader.

Visual: an SVG (viewBox 100x100) with up to 3 concentric orbits (radii 44, 31, 18). Each orbit has a faint track (15% opacity) and a rounded arc segment with a solid "head" dot at its leading edge. Orbits rotate at different speeds and alternate direction so it feels like a small solar system.

Props (typed interface): size ("sm" | "md" | "lg" | number px), orbits (1–3), speed (seconds per outer revolution), color (default currentColor so it inherits text color), trackColor, progress (0–100), label, showLabel, paused, className.

Behaviour:
- No progress → indeterminate: role="status", aria-live polite, sr-only label.
- progress given → the outer orbit becomes a determinate progress ring (stroke-dashoffset, smooth transition) with the head dot at the end of the progress; role="progressbar" with aria-valuenow/min/max; caption shows "Label · 42%".
- paused freezes animation via animation-play-state.
- prefers-reduced-motion slows the animation 4x instead of removing it.
- Keep it self-contained: keyframes ship with the component via a React 19 <style href precedence> tag, no global CSS or dependencies.
- Clamp progress to 0–100 and orbits to 1–3. No hardcoded colors or sizes.`,
  },
  {
    slug: "signal-input",
    name: "Signal Input",
    type: "input",
    week: 1,
    addedOn: "2026-10-02",
    summary: "A text field with a live signal bar that sweeps while validating and fills green or red with the result.",
    description:
      "A labelled text input built for async validation — username checks, coupon codes, invite links. A thin signal bar along the bottom edge shows focus, sweeps while loading, then fills with the result. It also supports a leading icon, a clear button, a character counter, three sizes, and works controlled or uncontrolled.",
    sourcePath: "src/components/gallery/signal-input.tsx",
    usage: `import { SignalInput } from "@/components/gallery/signal-input";

const [value, setValue] = useState("");
const status = useUsernameCheck(value); // "idle" | "loading" | "success" | "error"

<SignalInput
  label="Username"
  hint="3–20 characters. Letters, numbers and dashes."
  placeholder="lofi-builder"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  status={status}
  statusMessage={status === "error" ? "That name is taken" : "Nice — it's available"}
  leadingIcon={<AtIcon />}
  maxLength={20}
  showCount
  clearable
  onClear={() => setValue("")}
/>`,
    props: [
      { name: "label", type: "string", required: true, description: "Visible label, linked to the input via htmlFor." },
      { name: "hint", type: "string", description: "Helper text shown while idle or loading." },
      { name: "status", type: `"idle" | "loading" | "success" | "error"`, default: `"idle"`, description: "Drives the signal bar, trailing icon, border and message color." },
      { name: "statusMessage", type: "string", description: "Shown for success / error. Falls back to hint." },
      { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Field height and font size." },
      { name: "leadingIcon", type: "ReactNode", description: "Decorative icon before the text. Picks up the accent color on focus." },
      { name: "clearable", type: "boolean", default: "false", description: "Show a clear button when the field has a value." },
      { name: "onClear", type: "() => void", description: "Called after clearing. Reset value here when controlled." },
      { name: "showCount", type: "boolean", default: "false", description: "Live character counter. Requires maxLength." },
      { name: "ref", type: "Ref<HTMLInputElement>", description: "Forwarded to the native input (React 19 ref-as-prop)." },
      { name: "...rest", type: "InputHTMLAttributes", description: "Every native input attribute — type, name, placeholder, disabled, required, etc." },
    ],
    states: ["Default", "Hover", "Focus (accent ring + bar)", "Loading (sweeping bar + spinner)", "Success", "Error (shake + alert color)", "Disabled", "Read-only", "Counter at limit"],
    accessibility: [
      "Always-visible <label> bound with htmlFor / id.",
      "aria-invalid on error and aria-busy while loading.",
      "Hint and status messages are linked via aria-describedby and announced through a polite live region.",
      "The clear button is a real <button> with an aria-label and a visible focus ring.",
      "Shake animation is disabled under prefers-reduced-motion.",
      "Status colors meet WCAG AA contrast on light and dark surfaces.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 input component called SignalInput, designed for async validation (e.g. checking if a username is available).

Core idea: a 2px "signal bar" runs along the bottom edge of the field. It grows from the left on focus (indigo), shows an indeterminate sweeping segment while status="loading", fills emerald on success and rose on error. On error the field also does a short shake (disabled under prefers-reduced-motion).

Props (typed interface extending native input attributes, minus size/prefix): label (required, always visible), hint, status ("idle" | "loading" | "success" | "error"), statusMessage, size ("sm" | "md" | "lg"), leadingIcon (ReactNode), clearable + onClear, showCount (uses maxLength), className, ref (React 19 ref-as-prop, merged with an internal ref so the clear button can refocus the input).

Requirements:
- Works controlled (value + onChange) and uncontrolled (defaultValue).
- Trailing area: clear button (only when there is a value and the field is not disabled/read-only) + status icon (spinner / check / alert).
- States: hover, focus-within ring, loading, success, error, disabled (muted, not-allowed cursor), read-only, counter turns amber at the limit.
- Accessibility: label htmlFor/id via useId, aria-invalid, aria-busy, aria-describedby pointing to a polite live-region message, clear button with aria-label and focus-visible ring, AA contrast in light and dark mode.
- Self-contained: no dependencies, keyframes shipped with the component via a React 19 <style href precedence> tag.`,
  },
  {
    slug: "hold-to-confirm-button",
    name: "Hold-to-Confirm Button",
    type: "button",
    week: 2,
    addedOn: "2026-10-09",
    summary: "A button for risky actions: press and hold while it fills, and only a completed hold runs the action.",
    description:
      "Replaces the “Are you sure?” dialog for destructive or important actions. The user presses and holds while a solid fill sweeps across, revealing an inverted copy of the label. Let go early and it springs back; complete the hold and `onConfirm` runs. Works with mouse, touch, and Space or Enter, and shows a pending state when `onConfirm` returns a promise.",
    sourcePath: "src/components/gallery/hold-to-confirm-button.tsx",
    usage: `import { HoldToConfirmButton } from "@/components/gallery/hold-to-confirm-button";

<HoldToConfirmButton
  label="Delete project"
  holdingLabel="Keep holding…"
  confirmedLabel="Project deleted"
  icon={<TrashIcon />}
  duration={1500}
  onConfirm={() => api.deleteProject(id)} // a promise shows the pending state
/>

// Softer tone for non-destructive actions
<HoldToConfirmButton label="Publish" tone="primary" onConfirm={publish} />`,
    props: [
      { name: "label", type: "string", required: true, description: "Resting label." },
      { name: "onConfirm", type: "() => void | Promise<unknown>", required: true, description: "Runs when the hold completes. Return a promise to show a pending spinner; a rejected promise resets the button." },
      { name: "holdingLabel", type: "string", default: `"Keep holding…"`, description: "Shown while the user holds." },
      { name: "confirmedLabel", type: "string", default: `"Done"`, description: "Shown after the hold completes." },
      { name: "duration", type: "number", default: "1500", description: "Hold time in milliseconds." },
      { name: "tone", type: `"danger" | "primary" | "neutral"`, default: `"danger"`, description: "Color scheme for the base and fill." },
      { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Height, padding and font size." },
      { name: "icon", type: "ReactNode", description: "Icon shown before the resting label." },
      { name: "resetAfter", type: "number", default: "2000", description: "Milliseconds before returning to idle after confirming. 0 keeps it confirmed." },
      { name: "ref", type: "Ref<HTMLButtonElement>", description: "Forwarded to the native button (React 19 ref-as-prop)." },
      { name: "...rest", type: "ButtonHTMLAttributes", description: "Native button attributes such as disabled, className, aria-* and data-*." },
    ],
    states: ["Idle", "Hover", "Focus-visible ring", "Holding (fill progress + press-in)", "Cancelled (fill springs back)", "Pending (async onConfirm)", "Confirmed (check + pop)", "Disabled"],
    accessibility: [
      "A native <button>, so it's focusable and announced as a button.",
      "Hold with Space or Enter. Key repeat is ignored and releasing the key cancels.",
      "aria-describedby explains “Press and hold for 1.5 seconds to confirm.”",
      "A polite live region announces holding, working and confirmed.",
      "aria-disabled while pending or confirmed so a second action can't fire.",
      "The button keeps its width across labels, and the pop animation is disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 component called HoldToConfirmButton: a press-and-hold button that replaces "Are you sure?" dialogs for risky actions.

Interaction:
- pointerdown (primary button, with pointer capture) or keydown Space/Enter (ignore key repeat) starts the hold. A setTimeout decides completion after \`duration\` ms; requestAnimationFrame only paints the progress, so a throttled tab can't stall it.
- Progress drives a fill layer: an absolutely positioned, solid-colored copy of the button content revealed left-to-right with clip-path: inset(0 X% 0 0), so the label inverts as the fill passes it. No transition while holding; a 380ms ease back to 0 when cancelled.
- Releasing early (pointerup, pointercancel, lost capture, keyup, blur) cancels.
- On completion call onConfirm(). If it returns a promise show a pending spinner, and reset to idle if it rejects. Then show a confirmed state (check icon + scale pop + soft ring burst) and reset after \`resetAfter\` ms (0 = stay confirmed).

Props (typed, extending native button attributes minus children/onClick): label, holdingLabel, confirmedLabel, duration, onConfirm, tone ("danger" | "primary" | "neutral"), size ("sm" | "md" | "lg"), icon, resetAfter, ref (React 19 ref-as-prop).

Details:
- Stack all labels in one CSS grid cell (inactive ones invisible) so the width never jumps.
- Press-in scale while holding, touch-none and select-none, block the long-press context menu.
- Accessibility: native button, aria-describedby hint "Press and hold for N seconds to confirm" and a polite live region placed outside the button so they don't pollute its name, aria-disabled while pending/confirmed, focus-visible ring per tone, AA contrast in light and dark mode.
- Self-contained: no dependencies, keyframes shipped via a React 19 <style href precedence> tag, animations off under prefers-reduced-motion.`,
  },
  {
    slug: "morphing-area-chart",
    name: "Morphing Area Chart",
    type: "chart",
    week: 2,
    addedOn: "2026-10-09",
    summary: "A glowing analytics area chart that morphs smoothly between 7D, 30D and 90D, with a hover crosshair.",
    description:
      "A dashboard-style area chart with a smooth monotone curve, gradient fill and a glowing line. The headline number and the ▲/▼ change badge sit on top. Switch ranges and both the curve and the number animate to the new data instead of jumping. Hover, or focus and use the arrow keys, to get a crosshair and tooltip. It resizes to its container and works as a full chart or a tiny sparkline.",
    sourcePath: "src/components/gallery/morphing-area-chart.tsx",
    usage: `import { MorphingAreaChart } from "@/components/gallery/morphing-area-chart";

<MorphingAreaChart
  title="Revenue"
  valuePrefix="$"
  defaultRange="30d"
  ranges={[
    { id: "7d", label: "7D", points: last7 },   // [{ label: "Oct 9", value: 1920 }, …]
    { id: "30d", label: "30D", points: last30 },
    { id: "90d", label: "90D", points: last90 },
  ]}
/>

// Sparkline: no header, no axis
<MorphingAreaChart title="Visitors" ranges={ranges} height={90} showHeader={false} showAxis={false} />`,
    props: [
      { name: "title", type: "string", required: true, description: "Chart title. Also used for the accessible name and data table caption." },
      { name: "ranges", type: "{ id; label; points: { label; value }[] }[]", required: true, description: "One dataset per range tab. Ranges can have different lengths; the curve still morphs." },
      { name: "defaultRange", type: "string", default: "first range", description: "id of the range shown first." },
      { name: "summary", type: `"sum" | "average" | "last"`, default: `"sum"`, description: "What the headline number shows for the active range." },
      { name: "color", type: "string", default: `"#8b5cf6"`, description: "Line, glow, gradient fill and focus ring color." },
      { name: "valuePrefix / valueSuffix", type: "string", default: `""`, description: "Units around every value, e.g. \"$\" or \" ms\"." },
      { name: "higherIsBetter", type: "boolean", default: "true", description: "Set false for latency, cost or churn, so a rise turns the badge red." },
      { name: "height", type: "number", default: "240", description: "Plot height in px. Width follows the container." },
      { name: "showHeader", type: "boolean", default: "true", description: "Title, headline, change badge and range tabs." },
      { name: "showAxis", type: "boolean", default: "true", description: "Gridlines and axis labels. Turn off with showHeader for a sparkline." },
      { name: "morphDuration", type: "number", default: "700", description: "Morph animation length in ms. 0 disables it." },
      { name: "className", type: "string", description: "Extra classes for the wrapper." },
    ],
    states: ["Default", "Morphing between ranges", "Hover crosshair + tooltip", "Keyboard focus (arrow keys)", "Good change (green) / bad change (red), respecting higherIsBetter", "Single range (no tabs)", "Empty range", "Sparkline (no header or axis)", "Reduced motion (instant switch)"],
    accessibility: [
      "Range tabs are a radiogroup with aria-checked.",
      "The plot is focusable. Left and right arrows step through the points, and Home and End jump to the ends.",
      "A polite live region reads the active point, e.g. “Oct 9: $1,920”.",
      "A visually hidden data table gives screen readers the full series.",
      "The change badge has hidden text saying “Up” or “Down”, so meaning doesn't rely on color alone.",
      "prefers-reduced-motion switches ranges instantly with no morph.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 chart component called MorphingAreaChart: a premium analytics area chart that morphs between time ranges.

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
- A visually hidden <table> holds the full data. There's an empty state for ranges with no points. Dark and light mode. No dependencies.`,
  },
];

export function getComponent(slug: string) {
  return components.find((c) => c.slug === slug);
}

export function getNeighbours(slug: string) {
  const index = components.findIndex((c) => c.slug === slug);
  return {
    prev: index > 0 ? components[index - 1] : undefined,
    next: index >= 0 && index < components.length - 1 ? components[index + 1] : undefined,
  };
}

export function countByType(): Record<ComponentType, number> {
  const counts = Object.fromEntries(COMPONENT_TYPES.map((t) => [t, 0])) as Record<ComponentType, number>;
  for (const c of components) counts[c.type] += 1;
  return counts;
}

export function currentWeek() {
  return components.reduce((max, c) => Math.max(max, c.week), 1);
}
