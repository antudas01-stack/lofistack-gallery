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
