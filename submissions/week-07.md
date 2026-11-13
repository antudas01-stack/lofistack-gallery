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

(Second Week 07 component still to build. `table` is the only unused type.)

---

## Post 3 — Agent log

(Week 07 agent log still to write. Kinds used so far: coding, browser automation, ideation, QA testing, troubleshooting.)
