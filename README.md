# LofiStack Gallery

**Live:** https://antu-lofistack-gallery.vercel.app

My component gallery for the **LofiStack 90 Day Build Challenge**: 2 new components every week, 30 across the cycle.

Every component gets its own page at `/components/<slug>` with:

- a live **playground** with controls for every prop
- a **States** grid (hover, focus, loading, success, error, disabled…)
- copy-ready **source code** and a **usage** example
- a **props table**, accessibility notes and the **final build prompt**

**Stack:** Next.js (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Shiki for code highlighting.

## Components

| Week | Type | Component | Route |
| --- | --- | --- | --- |
| 01 | loader | Orbit Loader | [/components/orbit-loader](https://antu-lofistack-gallery.vercel.app/components/orbit-loader) |
| 01 | input | Signal Input | [/components/signal-input](https://antu-lofistack-gallery.vercel.app/components/signal-input) |
| 02 | button | Hold-to-Confirm Button | [/components/hold-to-confirm-button](https://antu-lofistack-gallery.vercel.app/components/hold-to-confirm-button) |
| 02 | chart | Morphing Area Chart | [/components/morphing-area-chart](https://antu-lofistack-gallery.vercel.app/components/morphing-area-chart) |
| 03 | modal | Command Palette | [/components/command-palette](https://antu-lofistack-gallery.vercel.app/components/command-palette) |
| 03 | card | Receipt Card | [/components/receipt-card](https://antu-lofistack-gallery.vercel.app/components/receipt-card) |
| 04 | navbar | Dynamic Island Nav | [/components/dynamic-island-nav](https://antu-lofistack-gallery.vercel.app/components/dynamic-island-nav) |
| 04 | form | Conversational Form | [/components/conversational-form](https://antu-lofistack-gallery.vercel.app/components/conversational-form) |

## Run locally

```bash
npm install
npm run dev
```

## Adding a component (weekly routine)

1. Build it in `src/components/gallery/<slug>.tsx`. Keep it self-contained: typed props, no hardcoded values, no extra deps.
2. Add a demo in `src/demos/<slug>-demo.tsx` that exports `Playground`, `States` and `Card` views, then register it in `src/demos/index.tsx`.
3. Add the entry to `src/registry/index.ts`: name, slug, `type`, week, props, states, accessibility notes and the final prompt.
4. Run `npm run lint` and `npm run build`, then push. The page appears at `/components/<slug>`.
5. Copy the post from `submissions/week-XX.md` into the channel.

Check the type filter on the homepage before picking a new component so types stay varied and nothing repeats.

## Deploy

- **Vercel / Netlify:** import the repo. No config needed.
- **GitHub Pages:** build with `GITHUB_PAGES=true BASE_PATH=/lofistack-gallery npm run build` and publish the `out/` folder.
