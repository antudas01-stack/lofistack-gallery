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
  {
    slug: "flip-invitation",
    name: "Flip Invitation",
    type: "card",
    week: 5,
    addedOn: "2026-11-03",
    summary: "An elegant event invitation with a gold-foil monogram that flips in 3D to reveal details, a live countdown and RSVP.",
    description:
      "A digital invitation for weddings, birthdays and launch parties. The front looks like printed stationery: framed borders, corner flourishes, a calligraphy monogram in shimmering gold foil, and engraved-style capitals. Tap it and the card flips in 3D to the details: date and time in the venue's time zone, the address with a map link, dress code, a live countdown, RSVP buttons, and an Add to Calendar link that downloads a real `.ics` file. It comes in four paper themes and tilts gently toward your mouse.",
    sourcePath: "src/components/gallery/flip-invitation.tsx",
    usage: `import { FlipInvitation } from "@/components/gallery/flip-invitation";

<FlipInvitation
  hosts="Aria Rahman & Leo Das"
  monogram="A & L"
  eventDate="2026-12-12T18:00:00+06:00"
  timeZone="Asia/Dhaka"
  venue="Rosewood Hall"
  address="Gulshan, Dhaka"
  mapUrl="https://maps.google.com/?q=Rosewood+Hall+Dhaka"
  dressCode="Black tie"
  rsvpNote="Kindly reply by Nov 30"
  theme="ivory"                       // ivory | midnight | blush | sage
  onRsvp={(answer) => saveRsvp(answer)} // "yes" | "maybe" | "no"
/>`,
    props: [
      { name: "hosts", type: "string", required: true, description: "Names on the front. Also used for the default monogram and the calendar title." },
      { name: "eventDate", type: "string", required: true, description: "ISO date-time with offset, e.g. 2026-12-12T18:00:00+06:00." },
      { name: "venue", type: "string", required: true, description: "Venue name on the back and in the calendar file." },
      { name: "timeZone", type: "string", default: `"UTC"`, description: "IANA zone of the event, so every guest sees the venue's local time." },
      { name: "monogram", type: "string", default: "initials", description: "Large foil text on the front, e.g. \"A & L\" or \"30\"." },
      { name: "preface / message", type: "string", description: "The small line above the monogram and the italic line under the names." },
      { name: "address / mapUrl / dressCode / rsvpNote", type: "string", description: "Optional detail rows and footer note." },
      { name: "durationHours", type: "number", default: "5", description: "Used for the calendar end time and the \"happening now\" state." },
      { name: "theme", type: `"ivory" | "midnight" | "blush" | "sage"`, default: `"ivory"`, description: "Paper, ink and foil palette." },
      { name: "onRsvp", type: "(response) => void | Promise", description: "Called with \"yes\", \"maybe\" or \"no\". A promise shows a saving spinner, and a rejection shows an error." },
      { name: "defaultResponse", type: `"yes" | "maybe" | "no"`, description: "Show a reply that was already given." },
      { name: "showCalendar", type: "boolean", default: "true", description: "Show the Add to calendar (.ics download) link." },
      { name: "defaultFlipped", type: "boolean", default: "false", description: "Start on the details side." },
      { name: "className", type: "string", description: "Extra classes for the wrapper (max 340px wide, 5:7 ratio)." },
      { name: "--inv-font-script / -serif / -caps", type: "CSS variables", description: "Optional font overrides. The gallery loads Pinyon Script, Cormorant Garamond and Cinzel via next/font." },
    ],
    states: ["Front (foil shimmer)", "Hover tilt (mouse)", "Flipping", "Back with countdown", "RSVP saving", "RSVP confirmed (with Change)", "RSVP error", "Happening now", "Past event (RSVP closed)", "4 themes"],
    accessibility: [
      "The whole front is one button with a clear label: “Invitation from … Open to see the details.”",
      "After flipping, focus moves to the “The Details” heading, and flipping back returns focus to the front.",
      "The hidden side is inert and aria-hidden, so keyboard users never tab into the face they can't see.",
      "The countdown is a role=\"timer\" that isn't announced every second. RSVP results use role=\"status\" and errors use role=\"alert\".",
      "Event times are formatted in the venue's time zone, so the server and every guest see the same time.",
      "The flip transition and foil shimmer are disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 card called FlipInvitation: an elegant digital event invitation that flips in 3D.

Props (typed): hosts, monogram (default: initials joined with "&"), preface, message, eventDate (ISO with offset), timeZone (IANA, default "UTC"), durationHours, venue, address, mapUrl, dressCode, rsvpNote, theme ("ivory" | "midnight" | "blush" | "sage"), onRsvp(response: "yes" | "maybe" | "no") (may return a promise), defaultResponse, showCalendar, defaultFlipped, className.

Front (printed stationery): 5:7 portrait card, max 340px. Double inset border (solid + dashed), SVG corner flourishes in all four corners, small spaced-caps preface, a huge italic serif monogram filled with an animated gold-foil gradient (background-clip:text, slow sheen), a diamond flourish divider, host names, an italic message, the date in spaced caps and a "Tap to open" pill. The whole face is one <button>.

Back: "The Details" heading with a flip-back button. A definition list for When (long date + time with zone name, formatted with Intl in the event's timeZone), Where (venue, address, "Open in Maps ↗") and Dress code. A 4-tile live countdown (days/hours/min/sec), driven by a shared 1-second clock via useSyncExternalStore with a null server snapshot, so SSR is stable. After the start time it shows "Happening right now ✦", and after the end "This celebration has passed" with RSVP disabled. RSVP: Accept (filled) / Maybe / Decline. A promise shows a spinner, a rejection shows an error, and success shows a confirmation message with "Change". The footer has rsvpNote plus "+ Add to calendar", a data:text/calendar .ics link with DTSTART/DTEND/SUMMARY/LOCATION.

3D: perspective wrapper, preserve-3d flipper rotating Y 180° over 900ms, faces with backface-visibility hidden. A mouse-only tilt sets CSS variables from the pointer position. The hidden face is inert + aria-hidden, and focus moves to the visible face after a flip.

Typography: three font roles read from CSS variables with fallbacks: --inv-font-script (Pinyon Script, for the monogram, names and heading), --inv-font-serif (Cormorant Garamond, for body and italics) and --inv-font-caps (Cinzel, for spaced labels). The app loads them with next/font (preload: false). Themes are CSS variables (paper, ink, muted, line, foil A/B, button). Self-contained keyframes via React 19 <style href precedence>, and reduced-motion disables the flip transition and sheen. No dependencies.`,
  },
  {
    slug: "day-night-map",
    name: "Day / Night World Map",
    type: "section",
    week: 5,
    addedOn: "2026-11-03",
    summary: "A dotted world map with a live day/night line worked out from the real position of the sun, plus city lights and a 24-hour time-lapse.",
    description:
      "A landing-page section that shows where in the world it's day or night right now. Continents are drawn from thousands of dots that glow warm in daylight and fade to cool blue at night, with a soft sun bloom over the sunlit side. The terminator is calculated from the sun's real position, so it shifts with the seasons too. Your locations glow like city lights after dark. Hover or tap one for its local time and the sun's angle, scrub the timeline, or press play to watch a whole day sweep across the planet.",
    sourcePath: "src/components/gallery/day-night-map.tsx",
    usage: `import { DayNightMap } from "@/components/gallery/day-night-map";

<DayNightMap
  title="Around the world, right now"
  defaultSelectedId="dhaka"
  locations={[
    { id: "dhaka", name: "Dhaka", country: "Bangladesh", lat: 23.81, lng: 90.41, timeZone: "Asia/Dhaka", note: "HQ · 42 people" },
    { id: "london", name: "London", country: "UK", lat: 51.51, lng: -0.13, timeZone: "Europe/London" },
    { id: "nyc", name: "New York", country: "USA", lat: 40.71, lng: -74.01, timeZone: "America/New_York" },
  ]}
  onSelect={(loc) => console.log(loc.name)}
/>`,
    props: [
      { name: "locations", type: "{ id; name; lat; lng; timeZone; country?; note? }[]", required: true, description: "Places to pin. timeZone is IANA, e.g. Asia/Dhaka, and drives the local clock." },
      { name: "title / description", type: "string", description: "Section heading and intro copy." },
      { name: "showControls", type: "boolean", default: "true", description: "Time-lapse play button, time scrubber (−12h to +24h) and Now button." },
      { name: "showList", type: "boolean", default: "true", description: "Location list under the map, synced with hover and selection." },
      { name: "defaultSelectedId", type: "string", description: "Location whose detail card shows first." },
      { name: "onSelect", type: "(location) => void", description: "Called when a pin or list item is clicked." },
      { name: "dayColor / nightColor / lightColor", type: "string (hex)", default: `"#fcd34d" / "#6d7bd8" / "#fde68a"`, description: "Daylit land, land at night, and the city-light glow." },
      { name: "className", type: "string", description: "Extra classes for the section." },
    ],
    states: ["Live (updates every 15s)", "Day / twilight / night pins", "Hover or focus detail card", "Selected location", "Scrubbing the timeline", "Playing the 24h time-lapse", "Map only (no controls or list)", "Server render (times appear after hydration)"],
    accessibility: [
      "A <section> labelled by its heading. The dotted canvas is decorative (aria-hidden).",
      "Every pin is a real button with a full label, e.g. “Dhaka, Bangladesh: 2:12 PM, daytime”, and aria-pressed for the selected one.",
      "The detail card uses role=\"status\", so the local time and day/night state are announced.",
      "The time slider has a readable aria-valuetext (“+3h 15m”), and Play/Pause has a clear label.",
      "Day/night is shown with icons and words (☀ Daytime, ☾ Night), never by color alone.",
      "Pin pulses are disabled under prefers-reduced-motion.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 landing-page section called DayNightMap: a dotted world map showing where it's day or night, from the real position of the sun.

Data: a land/water bitmask for an equirectangular grid (1.5° cells, lat 84° to −58°), generated once offline from Natural Earth 110m land polygons and embedded as base64. No runtime map libraries.

Sun math: compute the subsolar point from the timestamp with the NOAA low-precision formulas (mean anomaly, ecliptic longitude, obliquity → declination; right ascension → equation of time → subsolar longitude). Sun altitude anywhere: sin(alt) = sinφ·sinδ + cosφ·cosδ·cos(λ − λsun). Phase: day if alt > −0.833°, twilight down to −6°, otherwise night.

Rendering: a dark section (#060a16) with an indigo glow. A <canvas> (DPR-aware, width from a ResizeObserver, aspect 360:142) draws every land cell as a dot whose colour and opacity blend smoothly from nightColor to dayColor through twilight, plus a radial "sun bloom" around the subsolar point (wrapped across the date line). A glowing sun marker sits on top. Location pins are absolutely positioned buttons using percentage coordinates. At night they glow in lightColor with a pulsing ring like city lights; in daylight they're small white dots.

Interaction: hovering, focusing or selecting a pin shows a detail card (name, country, big local time via Intl with the location's timeZone, weekday, ☀/◐/☾ phase, sun angle up or below, optional note), flipped below the pin near the top edge. Controls: a play/pause button that sweeps a 24h time-lapse, a range slider (−12h to +24h, 15-minute steps) with "+3h 15m" labels, and a Now button. Header shows the UTC clock, a Day/Night legend and an "N/M asleep" count. The location list under the map is synced with hover and selection.

Time comes from a shared 15-second clock via useSyncExternalStore with a null server snapshot (SSR shows "--:--"). Accessibility: labelled pins with aria-pressed, a role=status card, aria-valuetext on the slider, icons + words for phase, and reduced-motion support.`,
  },
  {
    slug: "ghost-snake",
    name: "Ghost Snake",
    type: "section",
    week: 6,
    addedOn: "2026-11-11",
    summary: "The classic Nokia Snake in a retro phone, with a twist: race a ghost replay of your own best run.",
    description:
      "A playable remake of the Snake game from the Nokia 3310, drawn on a pixel LCD inside a phone shell with a working keypad. The twist is Ghost Race. Every run is recorded, and once you set a record your best run replays as a see-through ghost snake beside you, with a 👻 +/− badge showing whether you're ahead of or behind your past self. Beat it and the ghost updates. It plays with arrow keys, WASD, the keypad, or swipes on a phone, and has 9 speed levels, walls or wrap-around, three LCD colours and optional retro beeps.",
    sourcePath: "src/components/gallery/ghost-snake.tsx",
    usage: `import { GhostSnake, clearGhostRecord } from "@/components/gallery/ghost-snake";

<GhostSnake
  theme="nokia"          // nokia | amber | ice
  startLevel={5}         // 1–9, also points per apple
  walls                  // false = wrap around the edges
  ghost                  // race a replay of your best run
  sound={false}
  onGameOver={({ score, best, newRecord }) => saveScore(score)}
/>

// Wipe the saved record + ghost
clearGhostRecord("ls-ghost-snake");`,
    props: [
      { name: "cols / rows", type: "number", default: "20 / 12", description: "Board size in cells." },
      { name: "startLevel", type: "number (1–9)", default: "5", description: "Game speed. Each apple is worth this many points." },
      { name: "walls", type: "boolean", default: "true", description: "true: hitting an edge ends the run. false: wrap around to the other side." },
      { name: "ghost", type: "boolean", default: "true", description: "Replay your best run as a translucent ghost and show the +/− race badge." },
      { name: "sound", type: "boolean", default: "false", description: "Square-wave beeps on eating and crashing (Web Audio)." },
      { name: "theme", type: `"nokia" | "amber" | "ice"`, default: `"nokia"`, description: "LCD and phone-shell colours." },
      { name: "storageKey", type: "string", default: `"ls-ghost-snake"`, description: "localStorage key for the best score + ghost recording." },
      { name: "onGameOver", type: "(result) => void", description: "Called with { score, best, newRecord, ticks } when a run ends." },
      { name: "className", type: "string", description: "Extra classes for the phone shell." },
    ],
    states: ["Title screen", "Playing", "Racing the ghost (👻 +/−)", "Paused", "Game over", "New record (ghost updated)", "Wrap-around mode", "3 LCD themes"],
    accessibility: [
      "The screen is a focusable role=\"application\" with instructions in its label, so arrow keys work without scrolling the page.",
      "Keys: arrows / WASD / 2-4-6-8 to steer, Space / Enter / 5 to start or pause.",
      "Keypad direction and start buttons are real buttons with labels (“Turn up”, “Start or pause”).",
      "Score changes, pauses and game over are announced through a polite live region.",
      "The ghost race lead is shown as a number (+3 / −2), not by colour alone.",
      "It stores only a local best score. Nothing is sent anywhere.",
    ],
    prompt: `Build a reusable React 19 + TypeScript + Tailwind v4 game component called GhostSnake: the classic Nokia 3310 Snake, with a unique "Ghost Race" feature.

Look: a rounded phone shell (gradient body, "NOKIA" wordmark), an LCD screen with a top HUD (4-digit score, best score, ghost badge) and a <canvas> board (cols × rows cells at 10px, scaled with image-rendering: pixelated). Every cell draws as an unlit LCD pixel, the snake as dark pixels with an eye on the head, and food as a small pixel diamond. Under the screen are a Play/Pause navi key and a 3×3 keypad where 2/4/6/8 steer and 5 starts or pauses (other keys are decorative). There are three LCD palettes (nokia, amber, ice).

Game: a setInterval loop whose speed depends on level (1–9). Input is buffered (max 2 queued turns, no 180° reversals). Walls end the run, or wrap around when walls={false}. Self-collision ignores the tail when not growing. Each apple adds level points. Food is placed on a random free cell. Overlays show the title, paused and game over / new record states.

Ghost Race: record every run compactly (initial body, the head cell after each tick, and [tick, length, score] events when eating). When a run beats the best score, save the recording to localStorage (read back through useSyncExternalStore so SSR is stable, with an in-memory fallback if storage fails). On the next run, rebuild the ghost's body at the current tick from the recording and draw it as a dithered, see-through snake. The HUD shows 👻 +N / −N (your score minus the ghost's score at the same tick). Export clearGhostRecord(storageKey).

Input: focusable screen (role="application") with arrows / WASD / 2-4-6-8, Space / Enter / 5. Swipe gestures on touch (tap = start or pause). Keypad buttons respond on pointerdown, plus click for keyboard activation. Optional Web Audio square-wave beeps and navigator.vibrate on crash. A polite live region for status. onGameOver({ score, best, newRecord, ticks }). No dependencies.`,
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
