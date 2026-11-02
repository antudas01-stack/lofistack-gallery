# Week 05 submissions

Live site: https://antu-lofistack-gallery.vercel.app

---

## Post 1 — Component

```
Week: 05
Type: card
Component: Flip Invitation
Live: antu-lofistack-gallery.vercel.app/components/flip-invitation
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/flip-invitation.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 card called FlipInvitation: an elegant digital event invitation that flips in 3D.

Props (typed): hosts, monogram (default: initials joined with "&"), preface, message, eventDate (ISO with offset), timeZone (IANA, default "UTC"), durationHours, venue, address, mapUrl, dressCode, rsvpNote, theme ("ivory" | "midnight" | "blush" | "sage"), onRsvp(response: "yes" | "maybe" | "no") (may return a promise), defaultResponse, showCalendar, defaultFlipped, className.

Front (printed stationery): 5:7 portrait card, max 340px. Double inset border (solid + dashed), SVG corner flourishes in all four corners, small spaced-caps preface, a huge italic serif monogram filled with an animated gold-foil gradient (background-clip:text, slow sheen), a diamond flourish divider, host names, an italic message, the date in spaced caps and a "Tap to open" pill. The whole face is one <button>.

Back: "The Details" heading with a flip-back button. A definition list for When (long date + time with zone name, formatted with Intl in the event's timeZone), Where (venue, address, "Open in Maps ↗") and Dress code. A 4-tile live countdown (days/hours/min/sec), driven by a shared 1-second clock via useSyncExternalStore with a null server snapshot, so SSR is stable. After the start time it shows "Happening right now ✦", and after the end "This celebration has passed" with RSVP disabled. RSVP: Accept (filled) / Maybe / Decline. A promise shows a spinner, a rejection shows an error, and success shows a confirmation message with "Change". The footer has rsvpNote plus "+ Add to calendar", a data:text/calendar .ics link with DTSTART/DTEND/SUMMARY/LOCATION.

3D: perspective wrapper, preserve-3d flipper rotating Y 180° over 900ms, faces with backface-visibility hidden. A mouse-only tilt sets CSS variables from the pointer position. The hidden face is inert + aria-hidden, and focus moves to the visible face after a flip.

Typography: three font roles read from CSS variables with fallbacks: --inv-font-script (Pinyon Script, for the monogram, names and heading), --inv-font-serif (Cormorant Garamond, for body and italics) and --inv-font-caps (Cinzel, for spaced labels). The app loads them with next/font (preload: false). Themes are CSS variables (paper, ink, muted, line, foil A/B, button). Self-contained keyframes via React 19 <style href precedence>, and reduced-motion disables the flip transition and sheen. No dependencies.
```

---

## Post 2 — Component

(Second Week 05 component still to build.)

---

## Post 3 — Agent log

(Week 05 agent log: use a new kind of task, e.g. writing/docs, data cleanup, or summarising a call.)
