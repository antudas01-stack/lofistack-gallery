"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";

export type SignalInputStatus = "idle" | "loading" | "success" | "error";
export type SignalInputSize = "sm" | "md" | "lg";

export interface SignalInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  /** Visible label. Always rendered for accessibility. */
  label: string;
  /** Helper text shown under the field while status is idle or loading. */
  hint?: string;
  /** Drives the signal bar, the trailing icon and the message color. */
  status?: SignalInputStatus;
  /** Message shown for `success` / `error` (falls back to `hint`). */
  statusMessage?: string;
  size?: SignalInputSize;
  /** Decorative icon rendered before the text. */
  leadingIcon?: ReactNode;
  /** Shows a clear button when the field has a value. */
  clearable?: boolean;
  /** Called after the clear button is pressed. Reset `value` here when controlled. */
  onClear?: () => void;
  /** Shows a live character counter. Requires `maxLength`. */
  showCount?: boolean;
  /** Extra classes for the outer wrapper. */
  className?: string;
  ref?: Ref<HTMLInputElement>;
}

const SIZE_CLASSES: Record<SignalInputSize, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-sm sm:text-base",
  lg: "h-13 text-base",
};

const MESSAGE_CLASSES: Record<SignalInputStatus, string> = {
  idle: "text-zinc-500 dark:text-zinc-400",
  loading: "text-zinc-500 dark:text-zinc-400",
  success: "text-emerald-700 dark:text-emerald-400",
  error: "text-rose-600 dark:text-rose-400",
};

const KEYFRAMES = `
@keyframes ls-signal-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
@keyframes ls-signal-shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-4px); } 40%,80% { transform: translateX(4px); } }
.ls-signal-slide { animation: ls-signal-slide 1.1s ease-in-out infinite; }
.ls-signal-field[data-status="error"] { animation: ls-signal-shake 320ms ease-in-out 1; }
@media (prefers-reduced-motion: reduce) {
  .ls-signal-slide { animation-duration: 3s; }
  .ls-signal-field[data-status="error"] { animation: none; }
}`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function StatusIcon({ status }: { status: SignalInputStatus }) {
  if (status === "loading") {
    return (
      <svg className="size-4 animate-spin text-indigo-500 motion-reduce:animate-[spin_3s_linear_infinite]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "success") {
    return (
      <svg className="size-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "error") {
    return (
      <svg className="size-4 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7.5v5.5M12 16.5h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

export function SignalInput({
  label,
  hint,
  status = "idle",
  statusMessage,
  size = "md",
  leadingIcon,
  clearable = false,
  onClear,
  showCount = false,
  className,
  id,
  ref,
  value,
  defaultValue,
  onChange,
  disabled,
  readOnly,
  required,
  maxLength,
  ...inputProps
}: SignalInputProps) {
  const autoId = useId();
  const inputId = id ?? `signal-${autoId}`;
  const messageId = `${inputId}-message`;

  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(String(defaultValue ?? ""));
  const currentValue = isControlled ? String(value ?? "") : innerValue;

  const innerRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInnerValue(event.target.value);
    onChange?.(event);
  };

  const handleClear = () => {
    if (!isControlled) setInnerValue("");
    onClear?.();
    innerRef.current?.focus();
  };

  const message = status === "success" || status === "error" ? statusMessage ?? hint : hint;
  const showClear = clearable && currentValue.length > 0 && !disabled && !readOnly;
  const counterVisible = showCount && typeof maxLength === "number";

  return (
    <div className={cn("w-full", className)}>
      <style href="ls-signal-input" precedence="default">
        {KEYFRAMES}
      </style>

      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium text-zinc-800 dark:text-zinc-200",
            disabled && "opacity-60",
          )}
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-rose-600 dark:text-rose-400">
              *
            </span>
          )}
        </label>
        {counterVisible && (
          <span
            className={cn(
              "text-xs tabular-nums",
              currentValue.length >= maxLength
                ? "font-semibold text-amber-700 dark:text-amber-400"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {currentValue.length}/{maxLength}
          </span>
        )}
      </div>

      <div
        data-status={status}
        data-disabled={disabled || undefined}
        className={cn(
          "ls-signal-field group relative flex items-center overflow-hidden rounded-xl border bg-white shadow-sm transition-[border-color,box-shadow] duration-200",
          "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
          "focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 dark:focus-within:border-indigo-400",
          "data-[status=error]:border-rose-500 data-[status=error]:focus-within:ring-rose-500/15",
          "data-[status=success]:border-emerald-500 data-[status=success]:focus-within:ring-emerald-500/15",
          "data-disabled:cursor-not-allowed data-disabled:bg-zinc-100 data-disabled:opacity-60 data-disabled:hover:border-zinc-300 dark:data-disabled:bg-zinc-800/60",
          SIZE_CLASSES[size],
        )}
      >
        {leadingIcon && (
          <span
            aria-hidden="true"
            className="flex shrink-0 items-center pl-3 text-zinc-400 transition-colors group-focus-within:text-indigo-500 [&_svg]:size-4"
          >
            {leadingIcon}
          </span>
        )}

        <input
          {...inputProps}
          ref={setRefs}
          id={inputId}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          aria-invalid={status === "error" || undefined}
          aria-busy={status === "loading" || undefined}
          aria-describedby={message ? messageId : undefined}
          className="h-full w-full min-w-0 bg-transparent px-3 text-zinc-900 outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />

        <span className="flex shrink-0 items-center gap-1 pr-3">
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={`Clear ${label}`}
              className="grid size-6 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-90 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <StatusIcon status={status} />
        </span>

        {/* Signal bar: focus accent, loading sweep, success / error fill */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-indigo-500 transition-transform duration-300 group-focus-within:scale-x-100",
            "group-data-[status=success]:scale-x-100 group-data-[status=success]:bg-emerald-500",
            "group-data-[status=error]:scale-x-100 group-data-[status=error]:bg-rose-500",
            "group-data-[status=loading]:opacity-0",
          )}
        />
        {status === "loading" && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
            <span className="ls-signal-slide block h-full w-1/3 rounded-full bg-indigo-500" />
          </span>
        )}
      </div>

      <p
        id={messageId}
        aria-live="polite"
        className={cn("mt-1.5 min-h-4 text-xs leading-4", MESSAGE_CLASSES[status])}
      >
        {message}
      </p>
    </div>
  );
}
