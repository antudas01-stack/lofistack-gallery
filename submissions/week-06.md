# Week 06 submissions

Live site: https://antu-lofistack-gallery.vercel.app

---

## Post 1 — Component

```
Week: 06
Type: section
Component: Ghost Snake
Live: antu-lofistack-gallery.vercel.app/components/ghost-snake
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/ghost-snake.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 game component called GhostSnake: the classic Nokia 3310 Snake, with a unique "Ghost Race" feature.

Look: a rounded phone shell (gradient body, "NOKIA" wordmark), an LCD screen with a top HUD (4-digit score, best score, ghost badge) and a <canvas> board (cols × rows cells at 10px, scaled with image-rendering: pixelated). Every cell draws as an unlit LCD pixel, the snake as dark pixels with an eye on the head, and food as a small pixel diamond. Under the screen are a Play/Pause navi key and a 3×3 keypad where 2/4/6/8 steer and 5 starts or pauses (other keys are decorative). There are three LCD palettes (nokia, amber, ice).

Game: a setInterval loop whose speed depends on level (1–9). Input is buffered (max 2 queued turns, no 180° reversals). Walls end the run, or wrap around when walls={false}. Self-collision ignores the tail when not growing. Each apple adds level points. Food is placed on a random free cell. Overlays show the title, paused and game over / new record states.

Ghost Race: record every run compactly (initial body, the head cell after each tick, and [tick, length, score] events when eating). When a run beats the best score, save the recording to localStorage (read back through useSyncExternalStore so SSR is stable, with an in-memory fallback if storage fails). On the next run, rebuild the ghost's body at the current tick from the recording and draw it as a dithered, see-through snake. The HUD shows 👻 +N / −N (your score minus the ghost's score at the same tick). Export clearGhostRecord(storageKey).

Input: focusable screen (role="application") with arrows / WASD / 2-4-6-8, Space / Enter / 5. Swipe gestures on touch (tap = start or pause). Keypad buttons respond on pointerdown, plus click for keyboard activation. Optional Web Audio square-wave beeps and navigator.vibrate on crash. A polite live region for status. onGameOver({ score, best, newRecord, ticks }). No dependencies.
```

---

## Post 2 — Component

```
Week: 06
Type: form
Component: EMI Calculator
Live: antu-lofistack-gallery.vercel.app/components/emi-calculator
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/emi-calculator.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called EmiCalculator: a "buy now, pay monthly" installment calculator for product pages.

Inputs (each a labelled text field with a synced range slider; typing is free-form and clamps on blur, Arrow Up/Down steps):
- Product price (min / max / step props, currency symbol prefix)
- Down payment (0 to price, shows "% of price")
- Interest rate per year (0 to maxRate, 0.25 steps, "%" suffix)
- Period: radio chips for preset tenures (default 3, 6, 12, 18, 24, 36 months) plus a Custom chip that reveals a months field (1 to maxTenure) with a "2 years 6 mo" hint
- Interest method toggle: reducing | flat

Math (export it as a pure calculateEmi({ principal, annualRate, months, method })): principal = price − down payment, r = annualRate / 12 / 100.
- Reducing balance: EMI = P·r·(1+r)^n / ((1+r)^n − 1)
- Flat: EMI = (P + P·r·n) / n
- 0% interest: EMI = P / n
Build the full schedule (month, payment, principal, interest, balance); the last payment clears the remaining balance so rounding never leaves a remainder. Return emi, totalInterest, totalPayable and schedule.

Results panel (dark gradient card): big Monthly EMI, "every month for N", an SVG donut splitting principal and interest with animated stroke-dasharray, and a definition list with amount financed, total interest (+% extra), paid upfront and total you pay. A "Copy summary" button copies a plain-text summary. If the down payment covers the price, show a "Nothing to finance" state.

Below: a Compare plans table (every preset plus the current custom period: EMI, total interest, total payable; clicking a plan selects it) and a collapsible Payment schedule table with a sticky header and scroll.

Find my best plan (affordability advisor): an optional Monthly income field. Export a pure advisePlan({ income, principal, annualRate, tenures, method, comfortShare = 0.15, maxShare = 0.3 }). Rule: recommend the shortest preset plan whose EMI is within comfortShare of income (least interest while comfortable). If none is comfortable, recommend the plan with the lowest EMI as long as it is within maxShare, labelled tight. Otherwise report that no plan fits. When no plan is comfortable, also work out the extra down payment that would make the longest plan comfortable (EMI is linear in the amount financed), rounded up to the price step, and offer a one-click "Add it to the down payment". UI: a three-zone budget meter (green / amber / red with a marker for the selected plan), a status pill (Comfortable / Tight / Too high), a "Best for you" card with the plan, its EMI, the reason in plain words and a "Use this plan" button, and a note that it is a budgeting guide, not financial advice. When an income is entered, the compare table gains an "Of income" column and a Best badge on the suggested plan, and onChange also returns income, incomeShare and recommendedMonths.

Other requirements: format money with Intl.NumberFormat (currency + locale props, narrow symbol, whole amounts without decimals, otherwise 2 decimals). Layout uses a container query so it goes two-column based on its own width, not the viewport. onChange(result) fires on every change. Accessibility: labels, radiogroups, a role=status summary, real tables with scope, and a labelled donut. Light and dark mode. No dependencies.
```

---

## Post 3 — Agent log

(Week 06 agent log still to write. Use a new kind of task; used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
