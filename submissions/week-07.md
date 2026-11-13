# Week 07 submissions

Live site: https://antu-lofistack-gallery.vercel.app

---

## Post 1 — Component

```
Week: 07
Type: input
Component: Photo Resizer
Live: antu-lofistack-gallery.vercel.app/components/photo-resizer
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/photo-resizer.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called PhotoResizer: resize a photo to an exact pixel size and file-size limit, fully in the browser, and download it. Use case: job portals that require, for example, a 300×300 px photo under 100 KB, but the size must be fully custom.

Input: a dropzone with a Choose photo button (hidden file input), drag and drop, paste from the clipboard, and an optional "Try a sample photo" button (sampleImage prop). Reject non-images and files over maxInputMB with a clear error. initialImage loads a URL on mount.

Size: Width and Height text fields accepting any value from 16 to 4000 px (free typing, clamped on blur), a "Keep the photo's proportions" checkbox (typing one side computes the other from the original), and preset chips ({ id, label, width, height, maxKB? }; defaults: Job photo 300×300 / 100 KB, Signature 300×80 / 60 KB, Passport 35×45 mm 413×531, 2×2 inch 600×600, HD 1280×720) plus a Custom chip.

Fit: Crop to fill (cover, with zoom 1–3× and a position you can drag on the preview or set with two sliders), Fit inside (contain, with a white / black / transparent / custom background), or Stretch.

Output: JPG, PNG or WebP, a quality slider, and a Max file size field in KB. Rendering: decode the image once and build a chain of half-size canvases (mipmaps, base capped at 3000 px); for each output draw from the smallest copy that is still at least as large as the drawn size, with imageSmoothingQuality "high", so big photos shrink without jagged edges. The visible canvas IS the output canvas, so the preview is exact. Encoding: canvas.toBlob, debounced about 140 ms after the last change; when a size limit is set, binary-search the JPG / WebP quality (7 steps) for the highest quality that fits. PNG has no quality, so if it is over the limit, say so and suggest JPG.

Result card: output size in px, file size, format and the quality actually used ("lowered to fit the limit"), an Under / Over N KB pill, original size and percent saved, and a Download link (blob URL, file name like name-300x300.jpg), plus Change photo and Remove. onDownload returns { blob, fileName, width, height, bytes, format, quality }. Revoke object URLs on replace and unmount.

Layout with a container query (two columns when wide). Accessibility: labelled fields, radiogroups, slider alternatives to dragging, role=alert errors, a role=status announcement of the result, light and dark mode. No dependencies, nothing uploaded to a server.
```

---

## Post 2 — Component

```
Week: 07
Type: chart
Component: Sun Compass
Live: antu-lofistack-gallery.vercel.app/components/sun-compass
Repo: github.com/antudas01-stack/lofistack-gallery/blob/main/src/components/gallery/sun-compass.tsx
Prompt:
Build a reusable React 19 + TypeScript + Tailwind v4 component called SunCompass: a compass that shows where the sun is right now for any place, its path across the sky today, and where and when it rises and sets. No dependencies.

Maths: compute the sun yourself with the NOAA low-precision formulas (subsolar point from the time, then azimuth clockwise from north and altitude for the observer's latitude and longitude). Export sunPosition(ms, lat, lon) and sunDay(dayStart, lat, lon), which samples the day every 2 minutes and returns sunrise, sunset (altitude crossing -0.833°, interpolated), the highest point and the path. Handle days where the sun never sets or never rises.

Dial (SVG): a sky chart drawn as a compass. The outer ring is the horizon, the centre is straight overhead, with dashed 30° and 60° height rings, tick marks every 10°, and N / E / S / W letters (N in red). Draw today's path as a glowing dotted line with a dot for every hour and a label every 3 hours, amber markers on the rim for sunrise and sunset with their times, the sun as a glowing disc at its current position (dimmed and pinned to the rim when it is below the horizon), and the shadow of a stick at the centre pointing away from the sun, longer when the sun is low. The sky colour changes for day, twilight and night.

Readout next to the dial: the sun's bearing in degrees with a 16-point compass name, its height above or below the horizon, a status line (sunrise in…, …of daylight left, the sun has set), and tiles for sunrise, sunset, highest point, day length, shadow direction and length, and coordinates. All times are shown in the place's own time zone using Intl.DateTimeFormat.

Controls: location chips (props: locations with id, name, latitude, longitude, timeZone; five world cities by default), a My location chip using browser geolocation with loading and error messages, a time-of-day slider with a Now button, and on touch devices a Use phone compass button that asks for motion permission where needed and rotates the dial with the real heading (webkitCompassHeading or absolute alpha), taking the shortest turn.

Props: title, locations, defaultLocationId, date (fixed moment; otherwise a live clock shared through useSyncExternalStore with a null server snapshot so hydration matches), showControls, allowGeolocation, allowDeviceCompass, onChange({ time, azimuth, altitude, sunrise, sunset }), className.

Layout with a container query (dial and readout side by side when wide, stacked on phones). Accessibility: the dial is role=img with a sentence describing the sun's position, every value is also plain text, chips are a radiogroup, the slider has aria-valuetext, errors use role=alert.
```

---

## Post 3 — Agent log

(Week 07 agent log still to write. Kinds used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
