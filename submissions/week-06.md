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

(Second Week 06 component still to build. Only `table` is unused so far.)

---

## Post 3 — Agent log

(Week 06 agent log still to write. Use a new kind of task; used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
