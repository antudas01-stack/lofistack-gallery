# Week 04 submissions

Live site: https://antu-lofistack-gallery.vercel.app
One post per submission, so three posts this week.

---

## Post 1 — Component

```
Week: 04
Type: navbar
Component: Dynamic Island Nav
Live: antu-lofistack-gallery.vercel.app/components/dynamic-island-nav
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/dynamic-island-nav.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 navbar called DynamicIslandNav: a floating dark pill that morphs like the iPhone Dynamic Island.

Props (typed): links ({ id, label, href?, menu?: { label, description?, href?, icon? }[] }[]), activeId / defaultActiveId, onNavigate, logo, label, onSearch, notification ({ title, message?, icon? } | null), onDismissNotification, className.

Look: an inline pill (bg-zinc-950, white/10 ring, big soft shadow, rounded 28px) with a round logo slot, a row of links and a round search button. A white/12 highlight sits behind the active link and slides (left/width transition) to the new one. Measure tab positions with a ResizeObserver on the row (setState in the observer callback, not in the effect body).

Morph: under the row, a panel animates height with grid-template-rows 0fr → 1fr (no JS measuring). It shows one of:
- menu: a 2-column mega-menu of icon + label + description links (opens on mouse hover or click, closes on pointer-leave after 140ms, outside click or Esc)
- search: a rounded input with ↵ hint and suggestion chips matched from link and menu labels. Enter calls onSearch.
- notification: icon, title, message and a dismiss ×. The pill does a quick scale "pop" when it arrives.
Keep the last panel content in state while collapsing so it doesn't vanish mid-animation. Track the last notification with the "adjust state during render" pattern. Panel children fade in on change.

Accessibility: <nav aria-label>, aria-current on the active link, triggers with aria-expanded and aria-controls, ArrowDown opens a menu and focuses its first item, Esc closes and restores focus, the collapsed panel is inert, a polite live region for notifications, focus-visible rings, and reduced-motion support. No dependencies.
```

---

## Post 2 — Component

```
Week: 04
Type: form
Component: Conversational Form
Live: antu-lofistack-gallery.vercel.app/components/conversational-form
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/conversational-form.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called ConversationalForm: a form that asks one question at a time like a chat.

Props (typed): steps (ConversationalStep = { id, label?, question: string | (answers) => string, type?: "text" | "email" | "number" | "textarea" | "choice", options?, placeholder?, required? (default true), validate?: (value, answers) => string | null }), onComplete(answers) (may return a promise), title, avatar, doneMessage (string or function), typingDelay, initialAnswers, maxHeight, className.

Flow:
- State: answers, current index, status ("asking" | "review" | "sending" | "done"), typing, draft and error. Start at the first unanswered step (supports initialAnswers).
- On answer: validate (required, email regex, numeric, custom validate) and show the error inline. Otherwise save, show the "typing…" dots for typingDelay ms, then move to the next unanswered step, or to the review if none are left. Questions can use earlier answers (personalised or branching copy).
- "← Back" un-answers the previous step and prefills the draft. Optional steps show "Skip" and are saved as an empty answer, shown as "Skipped".
- Review: a bot bubble with a definition list of every answer (label: value) and an Edit button per row. Edit jumps to that step and then returns to the review. "Looks good, send it" calls onComplete. A promise shows a spinner and "Sending…", and a rejection shows an error. Done shows doneMessage and "Start over".

UI: card with title, "N of M" and a progress bar; a scrolling chat log (bot bubbles left with avatar, user bubbles right in indigo, slide-in keyframe, auto-scroll to bottom); a composer with input/textarea + round send button (Enter sends, Shift+Enter makes a new line); choice steps render chips instead.

Accessibility: role="log" aria-live, input aria-labelledby the question, aria-invalid + aria-describedby + role="alert" errors, labelled chip group, progressbar role, no autofocus on page load (only after interaction), reduced-motion support, dark mode. No dependencies.
```

---

## Post 3 — Agent log

Each agent log must be a different kind of task. Week 1 = coding, Week 2 = browser automation; Week 3 is still open.
Fill this in with a real task from your work this week.

```
Week: 04
Task: [what you needed done]
Agent: [Claude / Claude in Chrome / n8n / Zapier / …]
Prompt or workflow:
[paste the prompt or describe the steps]
Result: [what it produced and what it saved you]
```
