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
  {
    slug: "command-palette",
    name: "Command Palette",
    type: "modal",
    week: 3,
    addedOn: "2026-10-09",
    summary: "A ⌘K / Ctrl+K launcher with fuzzy search, highlighted matches, groups, shortcuts and full keyboard control.",
    description:
      "The quick-action search popup you know from Linear, Vercel and Raycast. Press ⌘K or Ctrl+K anywhere, type a few letters, and fuzzy search finds commands even with gaps (“dpl” finds “Deploy”). Matched letters are highlighted, results are grouped, and a Recent group appears when the search is empty. It's built on the native `<dialog>` element, so you get a real focus trap, Esc to close and an inert background for free.",
    sourcePath: "src/components/gallery/command-palette.tsx",
    usage: `import { CommandPalette } from "@/components/gallery/command-palette";

<CommandPalette
  hotkey="k"                       // ⌘K / Ctrl+K toggles it
  recentIds={["analytics"]}
  items={[
    {
      id: "deploy",
      label: "Deploy to production",
      group: "Actions",
      icon: <RocketIcon />,
      shortcut: ["⌘", "D"],
      keywords: ["ship", "release"],
      onSelect: () => deploy(),
    },
    { id: "settings", label: "Settings", group: "Pages", onSelect: () => router.push("/settings") },
  ]}
/>

// Controlled, e.g. from your own search button
<CommandPalette items={items} open={open} onOpenChange={setOpen} />`,
    props: [
      { name: "items", type: "CommandItem[]", required: true, description: "{ id, label, onSelect, group?, icon?, shortcut?, keywords?, hint?, disabled? }" },
      { name: "open / onOpenChange", type: "boolean / (open) => void", description: "Controlled mode. Leave open undefined and the palette manages itself." },
      { name: "hotkey", type: "string | null", default: `"k"`, description: "Letter that toggles the palette with ⌘ or Ctrl. null disables it." },
      { name: "placeholder", type: "string", default: `"Type a command or search…"`, description: "Search input placeholder." },
      { name: "recentIds", type: "string[]", default: "[]", description: "Item ids shown under Recent while the search is empty." },
      { name: "loading", type: "boolean", default: "false", description: "Shows a loading row, e.g. while remote results load." },
      { name: "closeOnSelect", type: "boolean", default: "true", description: "Close after a command runs." },
      { name: "className", type: "string", description: "Extra classes for the dialog panel." },
    ],
    states: ["Closed", "Open (blur backdrop + scale-in)", "Empty query with Recent", "Typing (fuzzy matches highlighted)", "Active row (hover or arrow keys)", "Disabled item (skipped)", "Loading row", "No results"],
    accessibility: [
      "Native modal <dialog>: focus is trapped inside, Esc closes it, and the page behind is inert.",
      "The input is a combobox with aria-controls and aria-activedescendant pointing at the active option.",
      "Results use the listbox / option / group roles, with aria-selected and aria-disabled.",
      "Arrow keys wrap around and skip disabled items. Enter runs the active command.",
      "Shortcut keys have a readable label, e.g. “Shortcut ⌘ D”.",
      "Clicking the backdrop closes it, and the open animation is disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 component called CommandPalette: a ⌘K / Ctrl+K command launcher like Linear or Raycast.

Props (typed): items (CommandItem = { id, label, onSelect, group?, icon?, shortcut?: string[], keywords?: string[], hint?, disabled? }), open + onOpenChange (controlled) or uncontrolled, hotkey (letter used with ⌘/Ctrl, default "k", null disables), placeholder, recentIds, loading, closeOnSelect, className.

Behaviour:
- Built on the native <dialog> with showModal() for a real focus trap, Esc (via the cancel event) and an inert page. A blurred, dimmed ::backdrop. Clicking the backdrop closes it. Lock page scroll while open. Panel sits 12vh from the top, max 640px wide, with a scale + fade-in keyframe.
- Global keydown listener toggles it on ⌘/Ctrl + hotkey.
- Mount the body only while open so the query and active row reset every time.
- Fuzzy search: subsequence match on the label (bonus for consecutive letters, word starts and exact substrings), falling back to keywords at a lower score. Highlight matched letters with <mark>. Sort by score, then group by item.group. With an empty query, show a "Recent" group from recentIds, then all items grouped.
- Keyboard: ArrowUp/Down move the active row (wrapping, skipping disabled), Enter runs onSelect, then close if closeOnSelect. Hover also sets the active row. Keep the active row scrolled into view.
- Rows: icon tile, label + muted hint, <kbd> shortcut chips, and an ↵ icon on the active row. A footer shows ↑↓ navigate, ↵ select, esc close and the result count. A loading row and a "No results for …" empty state.

Accessibility: the input is a combobox (aria-controls, aria-activedescendant, aria-expanded). The list uses listbox/option/group roles with aria-selected and aria-disabled. Dark and light mode, no dependencies, animation off under prefers-reduced-motion.`,
  },
  {
    slug: "receipt-card",
    name: "Receipt Card",
    type: "card",
    week: 3,
    addedOn: "2026-10-09",
    summary: "A paper receipt that prints out of a slot, with a torn zig-zag edge, totals, a barcode and a status stamp.",
    description:
      "An order confirmation that looks like a real thermal receipt. It slides out of a printer slot, then a PAID, PENDING or REFUNDED stamp thumps on. You pass the items and it does the math: subtotal, discount, tax on the discounted amount, tip and total, all formatted for any currency and locale. The torn edge is a pure-CSS mask, and the barcode is generated from the order id, so each order looks unique.",
    sourcePath: "src/components/gallery/receipt-card.tsx",
    usage: `import { ReceiptCard } from "@/components/gallery/receipt-card";

<ReceiptCard
  merchant="Lofi Coffee Co."
  orderId="#1042"
  date="Oct 9, 2026 · 9:41 AM"
  items={[
    { name: "Oat latte", quantity: 2, price: 4.5, note: "Extra shot" },
    { name: "Almond croissant", price: 3.75 },
  ]}
  discount={{ label: "LOFI10", amount: 2 }}
  taxRate={0.08}
  tip={2}
  paymentMethod="Visa •••• 4242"
  status="paid"
/>`,
    props: [
      { name: "merchant", type: "string", required: true, description: "Shop name in the header." },
      { name: "items", type: "{ name; price; quantity?; note? }[]", required: true, description: "Line items. Quantity defaults to 1." },
      { name: "orderId / date", type: "string", description: "Shown under the merchant name. orderId also seeds the barcode." },
      { name: "taxRate", type: "number", default: "0", description: "Applied after discounts, e.g. 0.08 = 8%." },
      { name: "discount", type: "{ label; amount }", description: "Discount line, capped at the subtotal." },
      { name: "tip", type: "number", default: "0", description: "Added after tax." },
      { name: "currency / locale", type: "string", default: `"USD" / "en-US"`, description: "Passed to Intl.NumberFormat for every amount." },
      { name: "paymentMethod", type: "string", description: "e.g. “Visa •••• 4242”." },
      { name: "status", type: `"paid" | "pending" | "refunded"`, description: "Adds the rubber stamp." },
      { name: "footer", type: "string", default: `"Thank you!"`, description: "Closing line. Empty string hides it." },
      { name: "logo", type: "ReactNode", description: "Icon above the merchant name." },
      { name: "barcodeValue", type: "string", default: "orderId", description: "Text encoded into the decorative barcode." },
      { name: "animate", type: "boolean", default: "true", description: "Print-out + stamp animation on mount." },
      { name: "printer", type: "boolean", default: "true", description: "Show the printer slot the receipt comes out of." },
      { name: "className", type: "string", description: "Extra classes for the wrapper." },
    ],
    states: ["Printing (slides out of the slot)", "Paid / Pending / Refunded stamp", "With discount, tax and tip", "Empty order", "Hover (deeper shadow)", "No printer slot", "Static (animate=false)", "Reduced motion (no animation)"],
    accessibility: [
      "An <article> labelled “Receipt from …”.",
      "Items are a real table with screen-reader-only column headers, and totals are a definition list.",
      "The stamp includes hidden text, “Status: Paid”.",
      "The barcode graphic is decorative (aria-hidden); its value is printed as text.",
      "The paper stays light in dark mode with dark text, so contrast is always high.",
      "The print and stamp animations are disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 component called ReceiptCard: an order confirmation styled as a thermal paper receipt.

Props (typed): merchant, items ({ name, price, quantity?, note? }[]), orderId, date, taxRate, discount ({ label, amount }), tip, currency, locale, paymentMethod, status ("paid" | "pending" | "refunded"), footer, logo, barcodeValue, animate, printer, className.

Math: subtotal = Σ price × quantity. Discount is capped at the subtotal. Tax = (subtotal − discount) × taxRate. Total = subtotal − discount + tax + tip. Format every amount with Intl.NumberFormat(locale, { style: "currency", currency }).

Look:
- Off-white paper (#fffdf7) with faint ruled lines, a monospace font and dashed dividers. Merchant in spaced uppercase, then order id · date.
- Bottom torn zig-zag edge made with a CSS mask (conic-gradient(from -45deg at bottom, …) repeated every 14px). A drop-shadow on the wrapper follows the torn shape, and gets deeper on hover.
- Items in a real <table> (sr-only header), totals in a <dl> with a bold Total row, optional "Paid with …".
- A decorative SVG barcode whose bar widths come from an FNV-style hash of the order id (deterministic), with the value printed below.
- Status stamp: rotated rubber stamp (Paid green / Pending amber / Refunded red, thick border, mix-blend-multiply) with sr-only "Status:".

Animation (keyframes via React 19 <style href precedence>): a dark printer slot bar at the top. The paper slides down out of it with a slight overshoot (1.5s), then the stamp thumps in (scale 2.2 → 1). animate=false or prefers-reduced-motion shows it instantly. Empty items show "No items". No dependencies.`,
  },
  {
    slug: "dynamic-island-nav",
    name: "Dynamic Island Nav",
    type: "navbar",
    week: 4,
    addedOn: "2026-10-09",
    summary: "A floating pill navbar that morphs like the iPhone Dynamic Island for menus, search and live notifications.",
    description:
      "A dark floating pill for site navigation. A soft highlight slides to the active link. Hover or open a link that has a sub-menu and the island grows downward into a mega-menu. Tap search and it grows into a search box with suggestions. Push a `notification` and it pops and expands to show the alert, then shrinks back when cleared. The height animates with a CSS grid trick, so there's no measuring and no layout jank.",
    sourcePath: "src/components/gallery/dynamic-island-nav.tsx",
    usage: `import { DynamicIslandNav } from "@/components/gallery/dynamic-island-nav";

<DynamicIslandNav
  logo={<Logo />}
  activeId={page}
  onNavigate={setPage}
  onSearch={(q) => router.push(\`/search?q=\${q}\`)}
  links={[
    { id: "home", label: "Home", href: "/" },
    {
      id: "work",
      label: "Work",
      menu: [
        { label: "Case studies", description: "Deep dives", href: "/work", icon: <BookIcon /> },
        { label: "Clients", href: "/clients", icon: <UserIcon /> },
      ],
    },
    { id: "blog", label: "Blog", href: "/blog" },
  ]}
  notification={toast}               // { title, message?, icon? } or null
  onDismissNotification={() => setToast(null)}
/>`,
    props: [
      { name: "links", type: "{ id; label; href?; menu?: { label; description?; href?; icon? }[] }[]", required: true, description: "Top-level links. A link with a menu becomes a button that expands the island." },
      { name: "activeId / defaultActiveId", type: "string", description: "Controlled or initial active link. The highlight slides to it." },
      { name: "onNavigate", type: "(id) => void", description: "Called when a link or menu item is chosen." },
      { name: "logo", type: "ReactNode", description: "Mark in the circle on the left." },
      { name: "label", type: "string", default: `"Main"`, description: "Accessible name of the <nav> landmark." },
      { name: "onSearch", type: "(query) => void", description: "Adds the search button. Called on Enter or when a suggestion is clicked." },
      { name: "notification", type: "{ title; message?; icon? } | null", description: "When set, the island pops and expands to show it. Set null to collapse." },
      { name: "onDismissNotification", type: "() => void", description: "Adds a dismiss button to the notification." },
      { name: "className", type: "string", description: "Extra classes for the nav wrapper." },
    ],
    states: ["Resting pill", "Active highlight sliding", "Hover / focus on links", "Menu expanded (mega-menu)", "Search expanded with suggestions", "Notification pop + expand", "Collapsing back", "Narrow screens (links scroll inside the pill)"],
    accessibility: [
      "A <nav> landmark with a label. The active link has aria-current=\"page\".",
      "Menu and search triggers are buttons with aria-expanded and aria-controls pointing at the panel.",
      "ArrowDown on a menu trigger opens it and moves focus to the first item. Esc closes it and returns focus to the trigger.",
      "The collapsed panel is inert, so hidden links can't be tabbed to.",
      "Notifications are announced through a polite live region, and the dismiss button has a label.",
      "All morphing and sliding motion is disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 navbar called DynamicIslandNav: a floating dark pill that morphs like the iPhone Dynamic Island.

Props (typed): links ({ id, label, href?, menu?: { label, description?, href?, icon? }[] }[]), activeId / defaultActiveId, onNavigate, logo, label, onSearch, notification ({ title, message?, icon? } | null), onDismissNotification, className.

Look: an inline pill (bg-zinc-950, white/10 ring, big soft shadow, rounded 28px) with a round logo slot, a row of links and a round search button. A white/12 highlight sits behind the active link and slides (left/width transition) to the new one. Measure tab positions with a ResizeObserver on the row (setState in the observer callback, not in the effect body).

Morph: under the row, a panel animates height with grid-template-rows 0fr → 1fr (no JS measuring). It shows one of:
- menu: a 2-column mega-menu of icon + label + description links (opens on mouse hover or click, closes on pointer-leave after 140ms, outside click or Esc)
- search: a rounded input with ↵ hint and suggestion chips matched from link and menu labels. Enter calls onSearch.
- notification: icon, title, message and a dismiss ×. The pill does a quick scale "pop" when it arrives.
Keep the last panel content in state while collapsing so it doesn't vanish mid-animation. Track the last notification with the "adjust state during render" pattern. Panel children fade in on change.

Accessibility: <nav aria-label>, aria-current on the active link, triggers with aria-expanded and aria-controls, ArrowDown opens a menu and focuses its first item, Esc closes and restores focus, the collapsed panel is inert, a polite live region for notifications, focus-visible rings, and reduced-motion support. No dependencies.`,
  },
  {
    slug: "conversational-form",
    name: "Conversational Form",
    type: "form",
    week: 4,
    addedOn: "2026-10-09",
    summary: "A form that feels like a chat: one question at a time, typing dots, validation, going back, and a review before sending.",
    description:
      "Turns a boring multi-field form into a conversation. The bot asks one question, shows a typing indicator, and your answer appears as a chat bubble. Questions can use earlier answers (“Nice to meet you, Antu”) or branch on them. It supports text, email, number, multi-line and choice-chip steps. Optional steps get a Skip button, there's a progress bar, and you can go back. At the end, a review card lets you edit any answer before sending.",
    sourcePath: "src/components/gallery/conversational-form.tsx",
    usage: `import { ConversationalForm } from "@/components/gallery/conversational-form";

<ConversationalForm
  title="Start a project"
  steps={[
    { id: "name", label: "Name", question: "Hi! What should I call you?" },
    { id: "email", label: "Email", type: "email", question: (a) => \`Nice to meet you, \${a.name}. Your email?\` },
    { id: "role", label: "Role", type: "choice", question: "Which sounds like you?", options: ["Designer", "Developer", "Founder"] },
    { id: "message", label: "Message", type: "textarea", required: false, question: "Anything else?" },
  ]}
  onComplete={(answers) => fetch("/api/lead", { method: "POST", body: JSON.stringify(answers) })}
  doneMessage={(a) => \`Thanks \${a.name}! We'll reply to \${a.email}.\`}
/>`,
    props: [
      { name: "steps", type: "ConversationalStep[]", required: true, description: "{ id, question, label?, type?, options?, placeholder?, required?, validate? }. question can be a function of earlier answers." },
      { name: "onComplete", type: "(answers) => void | Promise", required: true, description: "Called from the review step. A promise shows “Sending…”, and a rejection shows an error so you can retry." },
      { name: "title", type: "string", default: `"Let's get started"`, description: "Header title and accessible name." },
      { name: "avatar", type: "ReactNode", default: `"✦"`, description: "Bot avatar in the bubbles." },
      { name: "doneMessage", type: "string | (answers) => string", description: "Final bot message after sending." },
      { name: "typingDelay", type: "number", default: "650", description: "Milliseconds of “typing…” before each question. 0 disables it." },
      { name: "initialAnswers", type: "Record<string, string>", description: "Resume a conversation. It starts at the first unanswered step." },
      { name: "maxHeight", type: "number", default: "360", description: "Max height of the chat log in px. It scrolls after that." },
      { name: "className", type: "string", description: "Extra classes for the card." },
    ],
    states: ["Asking (text / email / number / textarea)", "Choice chips", "Typing indicator", "Validation error", "Optional step with Skip", "Going back to edit", "Review summary with Edit", "Sending (spinner)", "Done + Start over"],
    accessibility: [
      "The message area is a role=\"log\" live region, so new questions are read aloud.",
      "The input is labelled by the current question (aria-labelledby).",
      "Errors set aria-invalid, are linked with aria-describedby, and are announced with role=\"alert\".",
      "Choice chips are a labelled group of real buttons.",
      "The progress bar has role=\"progressbar\" with aria-valuenow.",
      "The input doesn't grab focus on page load, only after you start answering. Motion is disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 component called ConversationalForm: a form that asks one question at a time like a chat.

Props (typed): steps (ConversationalStep = { id, label?, question: string | (answers) => string, type?: "text" | "email" | "number" | "textarea" | "choice", options?, placeholder?, required? (default true), validate?: (value, answers) => string | null }), onComplete(answers) (may return a promise), title, avatar, doneMessage (string or function), typingDelay, initialAnswers, maxHeight, className.

Flow:
- State: answers, current index, status ("asking" | "review" | "sending" | "done"), typing, draft and error. Start at the first unanswered step (supports initialAnswers).
- On answer: validate (required, email regex, numeric, custom validate) and show the error inline. Otherwise save, show the "typing…" dots for typingDelay ms, then move to the next unanswered step, or to the review if none are left. Questions can use earlier answers (personalised or branching copy).
- "← Back" un-answers the previous step and prefills the draft. Optional steps show "Skip" and are saved as an empty answer, shown as "Skipped".
- Review: a bot bubble with a definition list of every answer (label: value) and an Edit button per row. Edit jumps to that step and then returns to the review. "Looks good, send it" calls onComplete. A promise shows a spinner and "Sending…", and a rejection shows an error. Done shows doneMessage and "Start over".

UI: card with title, "N of M" and a progress bar; a scrolling chat log (bot bubbles left with avatar, user bubbles right in indigo, slide-in keyframe, auto-scroll to bottom); a composer with input/textarea + round send button (Enter sends, Shift+Enter makes a new line); choice steps render chips instead.

Accessibility: role="log" aria-live, input aria-labelledby the question, aria-invalid + aria-describedby + role="alert" errors, labelled chip group, progressbar role, no autofocus on page load (only after interaction), reduced-motion support, dark mode. No dependencies.`,
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
