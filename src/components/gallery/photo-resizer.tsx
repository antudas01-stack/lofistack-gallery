"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type PointerEvent,
  type Ref,
} from "react";

export type ResizeFit = "cover" | "contain" | "stretch";
export type ResizeFormat = "jpeg" | "png" | "webp";

export interface ResizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  /** File-size limit that comes with this preset, in KB. */
  maxKB?: number;
}

export interface PhotoResizerResult {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  bytes: number;
  format: ResizeFormat;
  /** Quality actually used, 0–1 (lowered automatically to meet the size limit). */
  quality: number;
}

export interface PhotoResizerProps {
  title?: string;
  /** Size shortcuts. A "Custom" option is always available by typing a size. */
  presets?: ResizePreset[];
  defaultPresetId?: string;
  defaultFit?: ResizeFit;
  defaultFormat?: ResizeFormat;
  /** Starting quality for JPG / WebP, 0.1–1. */
  defaultQuality?: number;
  /** Largest file accepted, in MB. */
  maxInputMB?: number;
  /** Image URL loaded on mount (useful for editing an existing photo). */
  initialImage?: string;
  /** Adds a "Try a sample photo" button that loads this URL. */
  sampleImage?: string;
  /** Called when the user downloads the resized photo. */
  onDownload?: (result: PhotoResizerResult) => void;
  className?: string;
}

interface SourceInfo {
  key: number;
  name: string;
  bytes: number | null;
  width: number;
  height: number;
}

interface Output {
  url: string;
  blob: Blob;
  bytes: number;
  quality: number;
  width: number;
  height: number;
  format: ResizeFormat;
  /** Settings this output was made from, to tell when a newer one is still being prepared. */
  signature: string;
}

const DEFAULT_PRESETS: ResizePreset[] = [
  { id: "job-photo", label: "Job photo", width: 300, height: 300, maxKB: 100 },
  { id: "signature", label: "Signature", width: 300, height: 80, maxKB: 60 },
  { id: "passport", label: "Passport 35×45 mm", width: 413, height: 531 },
  { id: "stamp", label: "2×2 inch", width: 600, height: 600 },
  { id: "hd", label: "HD 16:9", width: 1280, height: 720 },
];

const MIME: Record<ResizeFormat, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const EXTENSION: Record<ResizeFormat, string> = { jpeg: "jpg", png: "png", webp: "webp" };
const FORMAT_LABEL: Record<ResizeFormat, string> = { jpeg: "JPG", png: "PNG", webp: "WebP" };
const MIN_SIDE = 16;
const MAX_SIDE = 4000;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Pre-shrinks the photo into a chain of half-size copies. Drawing from the copy closest
 * to the target size keeps small outputs sharp (one big downscale looks jagged).
 */
function buildMips(image: HTMLImageElement) {
  const fit = Math.min(1, 3000 / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * fit));
  let height = Math.max(1, Math.round(image.naturalHeight * fit));
  const first = makeCanvas(width, height);
  const firstCtx = first.getContext("2d");
  if (firstCtx) {
    firstCtx.imageSmoothingQuality = "high";
    firstCtx.drawImage(image, 0, 0, width, height);
  }
  const mips = [first];
  while (Math.min(width, height) > 64) {
    width = Math.max(1, Math.round(width / 2));
    height = Math.max(1, Math.round(height / 2));
    const next = makeCanvas(width, height);
    const ctx = next.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(mips[mips.length - 1], 0, 0, width, height);
    }
    mips.push(next);
  }
  return mips;
}

interface PaintOptions {
  width: number;
  height: number;
  fit: ResizeFit;
  zoom: number;
  offsetX: number;
  offsetY: number;
  /** CSS color, or null for a transparent background. */
  background: string | null;
}

/** Size and position of the photo on the output canvas, in output pixels. */
function placement(sourceWidth: number, sourceHeight: number, o: PaintOptions) {
  if (o.fit === "stretch") return { dx: 0, dy: 0, dw: o.width, dh: o.height };
  const cover = o.fit === "cover";
  const scale = cover
    ? Math.max(o.width / sourceWidth, o.height / sourceHeight) * o.zoom
    : Math.min(o.width / sourceWidth, o.height / sourceHeight);
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  return cover
    ? { dx: -(dw - o.width) * (0.5 + o.offsetX / 2), dy: -(dh - o.height) * (0.5 + o.offsetY / 2), dw, dh }
    : { dx: (o.width - dw) / 2, dy: (o.height - dh) / 2, dw, dh };
}

function paint(canvas: HTMLCanvasElement, mips: HTMLCanvasElement[], o: PaintOptions) {
  canvas.width = o.width;
  canvas.height = o.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || mips.length === 0) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (o.background) {
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, o.width, o.height);
  }
  const { dx, dy, dw, dh } = placement(mips[0].width, mips[0].height, o);
  // Smallest pre-shrunk copy that is still at least as large as what we draw.
  let source = mips[0];
  for (const mip of mips) if (mip.width >= dw && mip.height >= dh) source = mip;
  ctx.drawImage(source, dx, dy, dw, dh);
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Encodes the canvas, lowering JPG / WebP quality until the file fits under maxBytes. */
async function encode(canvas: HTMLCanvasElement, format: ResizeFormat, quality: number, maxBytes: number) {
  const type = MIME[format];
  if (format === "png") return { blob: await toBlob(canvas, type), quality: 1 };
  const first = await toBlob(canvas, type, quality);
  if (!first || !maxBytes || first.size <= maxBytes) return { blob: first, quality };
  let low = 0.05;
  let high = quality;
  let best: Blob | null = null;
  let bestQuality = low;
  for (let i = 0; i < 7; i++) {
    const mid = (low + high) / 2;
    const attempt = await toBlob(canvas, type, mid);
    if (attempt && attempt.size <= maxBytes) {
      best = attempt;
      bestQuality = mid;
      low = mid;
    } else high = mid;
  }
  if (best) return { blob: best, quality: bestQuality };
  return { blob: await toBlob(canvas, type, 0.05), quality: 0.05 };
}

function SizeInput({
  label,
  value,
  onChange,
  inputRef,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (raw: string) => {
    const n = Math.round(Number(raw));
    if (raw.trim() !== "" && Number.isFinite(n)) onChange(clamp(n, MIN_SIDE, MAX_SIDE));
  };
  return (
    <div className="min-w-0 flex-1">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <div className="mt-1 flex h-10 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-900">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft ?? String(value)}
          onFocus={(event) => {
            setDraft(String(value));
            event.target.select();
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            const n = Math.round(Number(event.target.value));
            if (event.target.value.trim() !== "" && n >= MIN_SIDE && n <= MAX_SIDE) onChange(n);
          }}
          onBlur={() => {
            if (draft !== null) commit(draft);
            setDraft(null);
          }}
          className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-zinc-900 tabular-nums outline-none dark:text-zinc-50"
        />
        <span aria-hidden="true" className="text-xs text-zinc-500 dark:text-zinc-400">
          px
        </span>
      </div>
    </div>
  );
}

export function PhotoResizer({
  title = "Photo resizer",
  presets = DEFAULT_PRESETS,
  defaultPresetId,
  defaultFit = "cover",
  defaultFormat = "jpeg",
  defaultQuality = 0.9,
  maxInputMB = 25,
  initialImage,
  sampleImage,
  onDownload,
  className,
}: PhotoResizerProps) {
  const uid = useId();
  const startPreset = presets.find((p) => p.id === defaultPresetId) ?? presets[0];

  const [source, setSource] = useState<SourceInfo | null>(null);
  const [loading, setLoading] = useState(Boolean(initialImage));
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [width, setWidth] = useState(startPreset?.width ?? 300);
  const [height, setHeight] = useState(startPreset?.height ?? 300);
  const [maxKB, setMaxKB] = useState(startPreset?.maxKB ?? 0);
  const [fit, setFit] = useState<ResizeFit>(defaultFit);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [background, setBackground] = useState("#ffffff");
  const [format, setFormat] = useState<ResizeFormat>(defaultFormat);
  const [quality, setQuality] = useState(clamp(defaultQuality, 0.1, 1));
  const [output, setOutput] = useState<Output | null>(null);
  const [lockRatio, setLockRatio] = useState(false);
  const widthRef = useRef<HTMLInputElement>(null);

  const mipsRef = useRef<HTMLCanvasElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const sourceKey = useRef(0);
  const outputUrl = useRef<string | null>(null);
  const encodeRun = useRef(0);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const transparent = background === "transparent" && format !== "jpeg";
  const paintBackground = transparent ? null : background === "transparent" ? "#ffffff" : background;
  const signature = source
    ? [source.key, width, height, fit, zoom, offset.x, offset.y, paintBackground, format, quality, maxKB].join("|")
    : "";
  const processing = Boolean(source) && output?.signature !== signature;
  const activePreset = presets.find((p) => p.width === width && p.height === height);

  /** Decodes an image URL into the working copies. Sets state only from async callbacks. */
  const decode = useCallback((url: string, name: string, bytes: number | null, revoke: boolean) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      mipsRef.current = buildMips(image);
      sourceKey.current += 1;
      setSource({ key: sourceKey.current, name, bytes, width: image.naturalWidth, height: image.naturalHeight });
      setOffset({ x: 0, y: 0 });
      setZoom(1);
      setLoading(false);
      if (revoke) URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError("That file couldn't be opened as a photo. Try a JPG, PNG or WebP.");
      setLoading(false);
      if (revoke) URL.revokeObjectURL(url);
    };
    image.src = url;
  }, []);

  const openFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > maxInputMB * 1024 * 1024) {
      setError(`That photo is larger than ${maxInputMB} MB. Please choose a smaller one.`);
      return;
    }
    setError(null);
    setLoading(true);
    decode(URL.createObjectURL(file), file.name, file.size, true);
  };

  useEffect(() => {
    if (initialImage) decode(initialImage, "photo", null, false);
  }, [initialImage, decode]);

  useEffect(() => {
    return () => {
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
    };
  }, []);

  // Draw the result. The visible canvas is the real output, so the preview is exact.
  useEffect(() => {
    if (!source || !canvasRef.current) return;
    paint(canvasRef.current, mipsRef.current, {
      width,
      height,
      fit,
      zoom,
      offsetX: offset.x,
      offsetY: offset.y,
      background: paintBackground,
    });
  }, [source, width, height, fit, zoom, offset.x, offset.y, paintBackground]);

  // Encode shortly after the last change (so dragging stays smooth).
  useEffect(() => {
    if (!source) return;
    const run = ++encodeRun.current;
    const timer = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const result = await encode(canvas, format, quality, maxKB * 1024);
      if (run !== encodeRun.current || !result.blob) return;
      if (outputUrl.current) URL.revokeObjectURL(outputUrl.current);
      outputUrl.current = URL.createObjectURL(result.blob);
      setOutput({
        url: outputUrl.current,
        blob: result.blob,
        bytes: result.blob.size,
        quality: result.quality,
        width,
        height,
        format,
        signature,
      });
    }, 140);
    return () => clearTimeout(timer);
  }, [source, signature, width, height, format, quality, maxKB]);

  const reset = () => {
    setSource(null);
    setOutput(null);
    setError(null);
    mipsRef.current = [];
    if (fileRef.current) fileRef.current.value = "";
  };

  const choosePreset = (preset: ResizePreset) => {
    setLockRatio(false);
    setWidth(preset.width);
    setHeight(preset.height);
    setMaxKB(preset.maxKB ?? 0);
    setOffset({ x: 0, y: 0 });
  };

  // With "keep proportions" on, typing one side works out the other from the original photo.
  const changeWidth = (value: number) => {
    setWidth(value);
    if (lockRatio && source) setHeight(clamp(Math.round((value * source.height) / source.width), MIN_SIDE, MAX_SIDE));
  };
  const changeHeight = (value: number) => {
    setHeight(value);
    if (lockRatio && source) setWidth(clamp(Math.round((value * source.width) / source.height), MIN_SIDE, MAX_SIDE));
  };
  const toggleLock = () => {
    if (!lockRatio && source) setHeight(clamp(Math.round((width * source.height) / source.width), MIN_SIDE, MAX_SIDE));
    setLockRatio(!lockRatio);
  };

  // Drag the preview to reposition the crop.
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (fit !== "cover" || !source) return;
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already released: dragging still works while the pointer stays over the photo.
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    const base = mipsRef.current[0];
    if (!start || !base) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const toOutput = width / rect.width;
    const place = placement(base.width, base.height, {
      width,
      height,
      fit,
      zoom,
      offsetX: 0,
      offsetY: 0,
      background: null,
    });
    const spareX = place.dw - width;
    const spareY = place.dh - height;
    setOffset({
      x: spareX > 0.5 ? clamp(start.ox - (2 * (event.clientX - start.x) * toOutput) / spareX, -1, 1) : 0,
      y: spareY > 0.5 ? clamp(start.oy - (2 * (event.clientY - start.y) * toOutput) / spareY, -1, 1) : 0,
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragOver(false);
    openFile(event.dataTransfer.files?.[0]);
  };
  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    const file = [...event.clipboardData.files].find((f) => f.type.startsWith("image/"));
    if (file) {
      event.preventDefault();
      openFile(file);
    }
  };

  const baseName = source ? source.name.replace(/\.[^.]+$/, "") || "photo" : "photo";
  const fileName = `${baseName}-${width}x${height}.${EXTENSION[output?.format ?? format]}`;
  const overLimit = Boolean(output && maxKB > 0 && output.bytes > maxKB * 1024);
  const qualityLowered = Boolean(output && output.format !== "png" && output.quality < quality - 0.005);
  const saved = output && source?.bytes ? Math.round((1 - output.bytes / source.bytes) * 100) : null;

  const chip = (selected: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 dark:focus-visible:ring-offset-zinc-950",
      selected
        ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500"
        : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200",
    );
  const segment = (selected: boolean) =>
    cn(
      "flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
      selected
        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
    );
  const groupLabel = "text-xs font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400";

  return (
    <section
      aria-labelledby={`${uid}-title`}
      onPaste={onPaste}
      className={cn(
        "@container w-full max-w-4xl rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-900 shadow-xl shadow-black/5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={`${uid}-title`} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 10V8a6 6 0 1 1 12 0v2m-13 0h14v10H5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          Your photo never leaves this device
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event: ChangeEvent<HTMLInputElement>) => openFile(event.target.files?.[0])}
      />

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-700 dark:text-rose-300"
        >
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss message"
            className="shrink-0 rounded px-1 font-semibold hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            ✕
          </button>
        </p>
      )}

      {!source ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "mt-4 flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition",
            dragOver
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900",
          )}
        >
          {loading ? (
            <p role="status" className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              <svg className="size-4 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Opening photo…
            </p>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
              >
                <svg className="size-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 16V5m0 0-4 4m4-4 4 4M5 15v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="font-semibold">Drop a photo here</p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  or paste one. JPG, PNG or WebP, up to {maxInputMB} MB.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 dark:focus-visible:ring-offset-zinc-900"
                >
                  Choose photo
                </button>
                {sampleImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      decode(sampleImage, "sample-photo", null, false);
                    }}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 dark:border-zinc-700 dark:text-zinc-200"
                  >
                    Try a sample photo
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          {/* Preview */}
          <div className="flex min-w-0 flex-col gap-3">
            <div
              className="flex min-h-64 flex-1 items-center justify-center rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              style={{
                backgroundColor: "rgb(127 127 127 / 0.08)",
                backgroundImage:
                  "linear-gradient(45deg, rgb(127 127 127 / .14) 25%, transparent 25%, transparent 75%, rgb(127 127 127 / .14) 75%), linear-gradient(45deg, rgb(127 127 127 / .14) 25%, transparent 25%, transparent 75%, rgb(127 127 127 / .14) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
              }}
            >
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                  "max-w-full touch-none overflow-hidden rounded-md shadow-lg ring-1 ring-black/10 select-none",
                  fit === "cover" && "cursor-grab active:cursor-grabbing",
                )}
                style={{ width, aspectRatio: `${width} / ${height}` }}
              >
                <canvas
                  ref={canvasRef}
                  role="img"
                  aria-label={`Preview of the resized photo, ${width} by ${height} pixels`}
                  className="block size-full"
                />
              </div>
            </div>
            <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
              {fit === "cover"
                ? "Drag the photo to choose what stays in the frame."
                : "This is exactly what will be saved."}
            </p>
          </div>

          {/* Settings */}
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <p className={groupLabel}>Size (any size you need)</p>
              <div className="mt-2 flex items-end gap-2">
                <SizeInput label="Width" value={width} onChange={changeWidth} inputRef={widthRef} />
                <span aria-hidden="true" className="pb-2.5 text-zinc-400">
                  ×
                </span>
                <SizeInput label="Height" value={height} onChange={changeHeight} />
              </div>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  checked={lockRatio}
                  onChange={toggleLock}
                  className="size-4 cursor-pointer rounded accent-indigo-600 dark:accent-indigo-400"
                />
                Keep the photo&apos;s proportions (type one side, the other follows)
              </label>
              <p id={`${uid}-size`} className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Common sizes
              </p>
              <div role="radiogroup" aria-labelledby={`${uid}-size`} className="mt-1.5 flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={activePreset?.id === preset.id}
                    onClick={() => choosePreset(preset)}
                    className={chip(activePreset?.id === preset.id)}
                  >
                    {preset.label} · {preset.width}×{preset.height}
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={!activePreset}
                  onClick={() => widthRef.current?.focus()}
                  className={chip(!activePreset)}
                >
                  Custom
                </button>
              </div>
            </div>

            <div>
              <p id={`${uid}-fit`} className={groupLabel}>
                How to fit
              </p>
              <div
                role="radiogroup"
                aria-labelledby={`${uid}-fit`}
                className="mt-2 flex rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800"
              >
                {(
                  [
                    ["cover", "Crop to fill"],
                    ["contain", "Fit inside"],
                    ["stretch", "Stretch"],
                  ] as const
                ).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={fit === value}
                    onClick={() => setFit(value)}
                    className={segment(fit === value)}
                  >
                    {text}
                  </button>
                ))}
              </div>

              {fit === "cover" && (
                <div className="mt-3 grid gap-2">
                  {(
                    [
                      ["Zoom", zoom, 1, 3, 0.01, (v: number) => setZoom(v), `${zoom.toFixed(2)}×`],
                      [
                        "Move left / right",
                        offset.x,
                        -1,
                        1,
                        0.01,
                        (v: number) => setOffset((o) => ({ ...o, x: v })),
                        "",
                      ],
                      ["Move up / down", offset.y, -1, 1, 0.01, (v: number) => setOffset((o) => ({ ...o, y: v })), ""],
                    ] as const
                  ).map(([text, value, min, max, step, set, readout]) => (
                    <label key={text} className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="w-28 shrink-0">{text}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(event) => set(Number(event.target.value))}
                        className="h-1.5 w-full cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                      />
                      {readout && <span className="w-10 shrink-0 text-right tabular-nums">{readout}</span>}
                    </label>
                  ))}
                </div>
              )}

              {fit === "contain" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">Background</span>
                  {(
                    [
                      ["#ffffff", "White"],
                      ["#000000", "Black"],
                      ["transparent", "Transparent"],
                    ] as const
                  ).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={background === value}
                      disabled={value === "transparent" && format === "jpeg"}
                      title={
                        value === "transparent" && format === "jpeg"
                          ? "JPG can't be transparent. Choose PNG or WebP."
                          : undefined
                      }
                      onClick={() => setBackground(value)}
                      className={cn(chip(background === value), "disabled:cursor-not-allowed disabled:opacity-40")}
                    >
                      {text}
                    </button>
                  ))}
                  <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <input
                      type="color"
                      value={/^#[0-9a-f]{6}$/i.test(background) ? background : "#ffffff"}
                      onChange={(event) => setBackground(event.target.value)}
                      className="size-7 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-700"
                    />
                    Other
                  </label>
                </div>
              )}
            </div>

            <div>
              <p id={`${uid}-format`} className={groupLabel}>
                File
              </p>
              <div
                role="radiogroup"
                aria-labelledby={`${uid}-format`}
                className="mt-2 flex rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800"
              >
                {(["jpeg", "png", "webp"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={format === value}
                    onClick={() => setFormat(value)}
                    className={segment(format === value)}
                  >
                    {FORMAT_LABEL[value]}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2">
                <label
                  className={cn(
                    "flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400",
                    format === "png" && "opacity-50",
                  )}
                >
                  <span className="w-28 shrink-0">Quality</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.01}
                    value={quality}
                    disabled={format === "png"}
                    onChange={(event) => setQuality(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer accent-indigo-600 disabled:cursor-not-allowed dark:accent-indigo-400"
                  />
                  <span className="w-10 shrink-0 text-right tabular-nums">
                    {format === "png" ? "n/a" : `${Math.round(quality * 100)}%`}
                  </span>
                </label>
                <label className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="w-28 shrink-0">Max file size</span>
                  <span className="flex h-9 flex-1 items-center gap-1 rounded-xl border border-zinc-300 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      type="number"
                      min={0}
                      max={20000}
                      inputMode="numeric"
                      value={maxKB === 0 ? "" : maxKB}
                      placeholder="No limit"
                      onChange={(event) => setMaxKB(clamp(Math.round(Number(event.target.value) || 0), 0, 20000))}
                      className="h-full w-full min-w-0 bg-transparent text-sm font-semibold text-zinc-900 tabular-nums outline-none placeholder:font-normal placeholder:text-zinc-400 dark:text-zinc-50"
                    />
                    <span aria-hidden="true">KB</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Result */}
            <div className="mt-auto rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950 p-4 text-white shadow-lg ring-1 ring-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-[0.2em] text-indigo-200/80 uppercase">Result</p>
                {output && !processing && maxKB > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      overLimit ? "bg-rose-500/20 text-rose-200" : "bg-emerald-500/20 text-emerald-200",
                    )}
                  >
                    {overLimit ? `Over ${maxKB} KB` : `Under ${maxKB} KB ✓`}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
                {width} × {height} px
                <span className="ml-2 text-base font-normal text-zinc-300">
                  {output ? formatBytes(output.bytes) : "…"}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {processing
                  ? "Preparing your photo…"
                  : output
                    ? `${FORMAT_LABEL[output.format]}${output.format === "png" ? "" : ` · quality ${Math.round(output.quality * 100)}%`}${qualityLowered ? " (lowered to fit the limit)" : ""}`
                    : ""}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Original: {source.width} × {source.height} px
                {source.bytes ? ` · ${formatBytes(source.bytes)}` : ""}
                {saved !== null && saved > 0 ? ` · ${saved}% smaller` : ""}
              </p>
              {overLimit && !processing && (
                <p role="alert" className="mt-2 text-xs leading-relaxed text-rose-200">
                  {format === "png"
                    ? "PNG files can't be compressed further. Switch to JPG to get under the limit."
                    : "This is the smallest it can go at this size. Try a smaller width and height."}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={output?.url}
                  download={fileName}
                  aria-disabled={!output || processing}
                  onClick={(event) => {
                    if (!output || processing) {
                      event.preventDefault();
                      return;
                    }
                    onDownload?.({
                      blob: output.blob,
                      fileName,
                      width: output.width,
                      height: output.height,
                      bytes: output.bytes,
                      format: output.format,
                      quality: output.quality,
                    });
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 active:scale-95",
                    (!output || processing) && "pointer-events-none opacity-50",
                  )}
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:scale-95"
                >
                  Change photo
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full px-3 py-2 text-sm font-medium text-zinc-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="sr-only" role="status">
        {source && output && !processing
          ? `Ready: ${output.width} by ${output.height} pixels, ${formatBytes(output.bytes)}.${overLimit ? ` Over the ${maxKB} KB limit.` : ""}`
          : ""}
      </p>
    </section>
  );
}
