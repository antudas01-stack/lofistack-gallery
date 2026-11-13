"use client";

import { useState, type ReactNode } from "react";
import { PhotoResizer, type PhotoResizerResult } from "@/components/gallery/photo-resizer";
import { Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

/** A drawn portrait, so the demo works without anyone uploading a real photo. */
const SAMPLE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#6366f1"/></linearGradient>
      <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e293b"/><stop offset="1" stop-color="#0f172a"/></linearGradient>
    </defs>
    <rect width="1200" height="1500" fill="url(#bg)"/>
    <circle cx="180" cy="220" r="120" fill="#ffffff" opacity=".18"/>
    <circle cx="1040" cy="380" r="70" fill="#ffffff" opacity=".14"/>
    <path d="M170 1500c0-330 190-520 430-520s430 190 430 520z" fill="url(#shirt)"/>
    <path d="M490 960h220l-40 150-70 60-70-60z" fill="#f1c8a8"/>
    <path d="M520 1010l80 160 80-160 60 30-140 250-140-250z" fill="#f8fafc"/>
    <ellipse cx="600" cy="700" rx="215" ry="260" fill="#f6d2b4"/>
    <path d="M385 650c-20-210 110-330 215-330s245 100 220 330c-40-110-110-170-220-180-90 10-170 60-215 180z" fill="#2b1d16"/>
    <ellipse cx="520" cy="720" rx="22" ry="26" fill="#1f2937"/>
    <ellipse cx="680" cy="720" rx="22" ry="26" fill="#1f2937"/>
    <path d="M525 835q75 60 150 0" stroke="#9a5b45" stroke-width="14" fill="none" stroke-linecap="round"/>
    <path d="M585 740q15 60 0 70" stroke="#d9a685" stroke-width="10" fill="none" stroke-linecap="round"/>
  </svg>`,
)}`;

export function PhotoResizerPlayground() {
  const [sample, setSample] = useState(true);
  const [last, setLast] = useState<PhotoResizerResult | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-4xl min-w-0 flex-col gap-3">
          <PhotoResizer sampleImage={sample ? SAMPLE : undefined} onDownload={setLast} />
          <p className="truncate font-mono text-[11px] text-fg-muted">
            {last
              ? `onDownload → ${last.fileName} · ${last.width}×${last.height} · ${(last.bytes / 1024).toFixed(1)} KB · quality ${Math.round(last.quality * 100)}%`
              : "Add a photo, set any size, then download. Nothing is uploaded anywhere."}
          </p>
        </div>
      }
      controls={
        <>
          <Toggle label="Sample photo button" checked={sample} onChange={setSample} />
          <p className="text-xs leading-relaxed text-fg-muted">
            Type <span className="font-medium text-fg">any width and height</span>, or pick a common size. Set a{" "}
            <span className="font-medium text-fg">Max file size</span> (for example 100 KB) and the quality is lowered
            automatically until the photo fits.
          </p>
          <p className="text-xs leading-relaxed text-fg-muted">
            <span className="font-medium text-fg">Crop to fill</span> lets you drag the photo inside the frame.{" "}
            <span className="font-medium text-fg">Fit inside</span> keeps the whole photo and adds a background.
          </p>
        </>
      }
    />
  );
}

/** Renders the tool at a fixed design width, scaled down to fit small tiles. */
function Mini({
  width,
  height,
  scale,
  children,
}: {
  width: number;
  height: number;
  scale: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden" style={{ width: width * scale, height: height * scale }}>
      <div className="origin-top-left" style={{ width, transform: `scale(${scale})` }}>
        {children}
      </div>
    </div>
  );
}

export function PhotoResizerStates() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="Empty: drop, choose or paste a photo">
        <Mini width={720} height={400} scale={0.62}>
          <PhotoResizer sampleImage={SAMPLE} />
        </Mini>
      </StateTile>
      <StateTile label="Job photo · 300×300 · under 100 KB">
        <Mini width={720} height={700} scale={0.62}>
          <PhotoResizer initialImage={SAMPLE} />
        </Mini>
      </StateTile>
      <StateTile label="Signature size · fit inside on white">
        <Mini width={720} height={640} scale={0.62}>
          <PhotoResizer initialImage={SAMPLE} defaultPresetId="signature" defaultFit="contain" />
        </Mini>
      </StateTile>
      <StateTile label="Over the size limit (PNG can't shrink)">
        <Mini width={720} height={760} scale={0.62}>
          <PhotoResizer
            initialImage={SAMPLE}
            defaultFormat="png"
            presets={[{ id: "banner", label: "Banner", width: 1280, height: 720, maxKB: 5 }]}
          />
        </Mini>
      </StateTile>
    </div>
  );
}

export function PhotoResizerCard() {
  return (
    <Mini width={720} height={520} scale={0.36}>
      <PhotoResizer initialImage={SAMPLE} />
    </Mini>
  );
}
