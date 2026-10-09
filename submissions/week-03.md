# Week 03 submissions

Live site: https://antu-lofistack-gallery.vercel.app
One post per submission, so three posts this week.

---

## Post 1 — Component

```
Week: 03
Type: modal
Component: Command Palette
Live: antu-lofistack-gallery.vercel.app/components/command-palette
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/command-palette.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called CommandPalette: a ⌘K / Ctrl+K command launcher like Linear or Raycast.

Props (typed): items (CommandItem = { id, label, onSelect, group?, icon?, shortcut?: string[], keywords?: string[], hint?, disabled? }), open + onOpenChange (controlled) or uncontrolled, hotkey (letter used with ⌘/Ctrl, default "k", null disables), placeholder, recentIds, loading, closeOnSelect, className.

Behaviour:
- Built on the native <dialog> with showModal() for a real focus trap, Esc (via the cancel event) and an inert page. A blurred, dimmed ::backdrop. Clicking the backdrop closes it. Lock page scroll while open. Panel sits 12vh from the top, max 640px wide, with a scale + fade-in keyframe.
- Global keydown listener toggles it on ⌘/Ctrl + hotkey.
- Mount the body only while open so the query and active row reset every time.
- Fuzzy search: subsequence match on the label (bonus for consecutive letters, word starts and exact substrings), falling back to keywords at a lower score. Highlight matched letters with <mark>. Sort by score, then group by item.group. With an empty query, show a "Recent" group from recentIds, then all items grouped.
- Keyboard: ArrowUp/Down move the active row (wrapping, skipping disabled), Enter runs onSelect, then close if closeOnSelect. Hover also sets the active row. Keep the active row scrolled into view.
- Rows: icon tile, label + muted hint, <kbd> shortcut chips, and an ↵ icon on the active row. A footer shows ↑↓ navigate, ↵ select, esc close and the result count. A loading row and a "No results for …" empty state.

Accessibility: the input is a combobox (aria-controls, aria-activedescendant, aria-expanded). The list uses listbox/option/group roles with aria-selected and aria-disabled. Dark and light mode, no dependencies, animation off under prefers-reduced-motion.
```

---

## Post 2 — Component

```
Week: 03
Type: card
Component: Receipt Card
Live: antu-lofistack-gallery.vercel.app/components/receipt-card
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/receipt-card.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called ReceiptCard: an order confirmation styled as a thermal paper receipt.

Props (typed): merchant, items ({ name, price, quantity?, note? }[]), orderId, date, taxRate, discount ({ label, amount }), tip, currency, locale, paymentMethod, status ("paid" | "pending" | "refunded"), footer, logo, barcodeValue, animate, printer, className.

Math: subtotal = Σ price × quantity. Discount is capped at the subtotal. Tax = (subtotal − discount) × taxRate. Total = subtotal − discount + tax + tip. Format every amount with Intl.NumberFormat(locale, { style: "currency", currency }).

Look:
- Off-white paper (#fffdf7) with faint ruled lines, a monospace font and dashed dividers. Merchant in spaced uppercase, then order id · date.
- Bottom torn zig-zag edge made with a CSS mask (conic-gradient(from -45deg at bottom, …) repeated every 14px). A drop-shadow on the wrapper follows the torn shape, and gets deeper on hover.
- Items in a real <table> (sr-only header), totals in a <dl> with a bold Total row, optional "Paid with …".
- A decorative SVG barcode whose bar widths come from an FNV-style hash of the order id (deterministic), with the value printed below.
- Status stamp: rotated rubber stamp (Paid green / Pending amber / Refunded red, thick border, mix-blend-multiply) with sr-only "Status:".

Animation (keyframes via React 19 <style href precedence>): a dark printer slot bar at the top. The paper slides down out of it with a slight overshoot (1.5s), then the stamp thumps in (scale 2.2 → 1). animate=false or prefers-reduced-motion shows it instantly. Empty items show "No items". No dependencies.
```

---

## Post 3 — Agent log

Each agent log must be a different kind of task. Week 1 = coding (build + deploy site), Week 2 = browser automation (Vercel domain + redirect).
Fill this in with a real task from your work this week, e.g. summarizing a client call, cleaning a spreadsheet, writing a QA report.

```
Week: 03
Task: [what you needed done]
Agent: [Claude / Claude in Chrome / n8n / Zapier / …]
Prompt or workflow:
[paste the prompt or describe the steps]
Result: [what it produced and what it saved you]
```
