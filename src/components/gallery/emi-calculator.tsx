"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type EmiMethod = "reducing" | "flat";

export interface EmiScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  /** Amount still owed after this payment. */
  balance: number;
}

export interface EmiResult {
  price: number;
  downPayment: number;
  /** Amount financed: price minus down payment. */
  principal: number;
  annualRate: number;
  months: number;
  method: EmiMethod;
  emi: number;
  totalInterest: number;
  /** Everything paid in installments (principal + interest). */
  totalPayable: number;
  schedule: EmiScheduleRow[];
}

export interface EmiCalculatorProps {
  title?: string;
  /** ISO currency code, e.g. "USD", "BDT", "INR". */
  currency?: string;
  locale?: string;
  defaultPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  priceStep?: number;
  defaultDownPayment?: number;
  /** Yearly interest rate in percent. */
  defaultRate?: number;
  maxRate?: number;
  /** Preset plans, in months. */
  tenures?: number[];
  defaultTenure?: number;
  /** Longest custom plan, in months. */
  maxTenure?: number;
  /** "reducing" = interest on the remaining balance (bank EMI). "flat" = interest on the full amount. */
  defaultMethod?: EmiMethod;
  /** Compare-all-plans table. */
  showCompare?: boolean;
  /** Month-by-month payment schedule. */
  showSchedule?: boolean;
  /** Called with the full result whenever any input changes. */
  onChange?: (result: EmiResult) => void;
  className?: string;
}

const DEFAULT_TENURES = [3, 6, 12, 18, 24, 36];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Pure EMI math, usable without the UI. */
export function calculateEmi(input: {
  principal: number;
  annualRate: number;
  months: number;
  method?: EmiMethod;
}): Pick<EmiResult, "emi" | "totalInterest" | "totalPayable" | "schedule"> {
  const method = input.method ?? "reducing";
  const P = Math.max(0, input.principal);
  const n = Math.max(1, Math.round(input.months));
  const r = Math.max(0, input.annualRate) / 12 / 100; // monthly rate

  let emi = 0;
  if (P > 0) {
    if (r === 0) emi = P / n;
    else if (method === "flat") emi = (P + P * r * n) / n;
    else {
      const growth = Math.pow(1 + r, n);
      emi = (P * r * growth) / (growth - 1);
    }
  }

  const schedule: EmiScheduleRow[] = [];
  let balance = P;
  for (let month = 1; month <= n; month++) {
    const interest = method === "flat" ? P * r : balance * r;
    // The last payment clears whatever is left, so rounding drift never leaves a balance.
    const principal = month === n ? balance : method === "flat" ? P / n : emi - interest;
    balance = Math.max(0, balance - principal);
    schedule.push({ month, payment: principal + interest, principal, interest, balance });
  }
  const totalPayable = schedule.reduce((sum, row) => sum + row.payment, 0);
  return { emi, totalInterest: Math.max(0, totalPayable - P), totalPayable, schedule };
}

function tenureLabel(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} ${months === 1 ? "month" : "months"}`;
  return `${years} ${years === 1 ? "year" : "years"}${rest ? ` ${rest} mo` : ""}`;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  locale: string;
}

/** Text box + slider bound to one number. Typing is free-form; the value is clamped on blur. */
function NumberField({ label, value, onChange, min, max, step, prefix, suffix, hint, locale }: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const parse = (raw: string) => {
    const n = Number(raw.replace(/[,\s]/g, ""));
    return raw.trim() !== "" && Number.isFinite(n) ? n : null;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const next = clamp(value + (event.key === "ArrowUp" ? step : -step), min, max);
    onChange(Number(next.toFixed(4)));
    setDraft(String(Number(next.toFixed(4))));
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {label}
        </label>
        {hint && <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{hint}</span>}
      </div>
      <div className="mt-1.5 flex h-11 items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600">
        {prefix && (
          <span aria-hidden="true" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={shown}
          onFocus={(event) => {
            setDraft(String(value));
            event.target.select();
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            const n = parse(event.target.value);
            if (n !== null && n >= min && n <= max) onChange(n);
          }}
          onBlur={() => {
            const n = draft === null ? null : parse(draft);
            if (n !== null) onChange(clamp(n, min, max));
            setDraft(null);
          }}
          onKeyDown={onKeyDown}
          className="h-full w-full min-w-0 bg-transparent text-base font-semibold text-zinc-900 tabular-nums outline-none dark:text-zinc-50"
        />
        {suffix && (
          <span aria-hidden="true" className="shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {suffix}
          </span>
        )}
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={clamp(value, min, max)}
        onChange={(event) => {
          setDraft(null);
          onChange(Number(event.target.value));
        }}
        className="mt-2.5 h-1.5 w-full cursor-pointer accent-indigo-600 dark:accent-indigo-400"
      />
    </div>
  );
}

export function EmiCalculator({
  title = "EMI calculator",
  currency = "USD",
  locale = "en-US",
  defaultPrice = 1200,
  minPrice = 100,
  maxPrice = 10000,
  priceStep = 50,
  defaultDownPayment = 0,
  defaultRate = 12,
  maxRate = 36,
  tenures = DEFAULT_TENURES,
  defaultTenure = 12,
  maxTenure = 120,
  defaultMethod = "reducing",
  showCompare = true,
  showSchedule = true,
  onChange,
  className,
}: EmiCalculatorProps) {
  const uid = useId();
  const [price, setPrice] = useState(defaultPrice);
  const [down, setDown] = useState(defaultDownPayment);
  const [rate, setRate] = useState(defaultRate);
  const [months, setMonths] = useState(defaultTenure);
  const [custom, setCustom] = useState(!tenures.includes(defaultTenure));
  const [method, setMethod] = useState<EmiMethod>(defaultMethod);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const money = useMemo(() => {
    const whole = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    const cents = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const symbol = whole.formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
    // Whole amounts stay clean ("$1,200"); anything with cents shows both digits ("$106.62").
    const format = (value: number) =>
      Math.abs(value - Math.round(value)) < 0.005 ? whole.format(Math.round(value)) : cents.format(value);
    return { format, symbol };
  }, [locale, currency]);

  const downPayment = Math.min(down, price);
  const principal = price - downPayment;

  const result = useMemo<EmiResult>(
    () => ({
      price,
      downPayment,
      principal,
      annualRate: rate,
      months,
      method,
      ...calculateEmi({ principal, annualRate: rate, months, method }),
    }),
    [price, downPayment, principal, rate, months, method],
  );

  const plans = useMemo(() => {
    const list = [...new Set([...tenures, months])].sort((a, b) => a - b);
    return list.map((m) => ({ months: m, ...calculateEmi({ principal, annualRate: rate, months: m, method }) }));
  }, [tenures, months, principal, rate, method]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(result);
  }, [result]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const nothingToFinance = principal <= 0;
  const interestShare = result.totalPayable > 0 ? result.totalInterest / result.totalPayable : 0;
  const extraPercent = principal > 0 ? (result.totalInterest / principal) * 100 : 0;
  const totalCost = downPayment + result.totalPayable;
  const CIRC = 2 * Math.PI * 42;

  const summary = [
    `${title}`,
    `Price: ${money.format(price)}`,
    downPayment > 0 ? `Down payment: ${money.format(downPayment)}` : null,
    `Financed: ${money.format(principal)} at ${rate}% (${method === "flat" ? "flat" : "reducing balance"}) for ${months} months`,
    `Monthly EMI: ${money.format(result.emi)}`,
    `Total interest: ${money.format(result.totalInterest)}`,
    `Total payable: ${money.format(totalCost)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const chip = (selected: boolean) =>
    cn(
      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 dark:focus-visible:ring-offset-zinc-950",
      selected
        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-500"
        : "border-zinc-300 bg-white text-zinc-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200",
    );

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className={cn(
        "@container w-full max-w-4xl rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-zinc-900 shadow-xl shadow-black/5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-6 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
        {/* Inputs */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`${uid}-title`} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <div
              role="radiogroup"
              aria-label="Interest method"
              className="flex rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-800"
            >
              {(["reducing", "flat"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={method === m}
                  title={
                    m === "reducing"
                      ? "Interest is charged on the remaining balance (bank-style EMI)"
                      : "Interest is charged on the full amount for the whole period"
                  }
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    method === m
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <NumberField
            label="Product price"
            value={price}
            onChange={setPrice}
            min={minPrice}
            max={maxPrice}
            step={priceStep}
            prefix={money.symbol}
            locale={locale}
          />
          <NumberField
            label="Down payment"
            value={downPayment}
            onChange={setDown}
            min={0}
            max={price}
            step={priceStep}
            prefix={money.symbol}
            hint={price > 0 ? `${Math.round((downPayment / price) * 100)}% of price` : undefined}
            locale={locale}
          />
          <NumberField
            label="Interest rate (per year)"
            value={rate}
            onChange={setRate}
            min={0}
            max={maxRate}
            step={0.25}
            suffix="%"
            hint={rate === 0 ? "0% interest plan" : undefined}
            locale={locale}
          />

          <div>
            <p id={`${uid}-tenure`} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Pay over
            </p>
            <div role="radiogroup" aria-labelledby={`${uid}-tenure`} className="mt-2 flex flex-wrap gap-2">
              {tenures.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={!custom && months === m}
                  onClick={() => {
                    setMonths(m);
                    setCustom(false);
                  }}
                  className={chip(!custom && months === m)}
                >
                  {m} mo
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={custom}
                onClick={() => setCustom(true)}
                className={chip(custom)}
              >
                Custom
              </button>
            </div>
            {custom && (
              <div className="mt-3">
                <NumberField
                  label="Custom period"
                  value={months}
                  onChange={(v) => setMonths(Math.round(v))}
                  min={1}
                  max={maxTenure}
                  step={1}
                  suffix="months"
                  hint={tenureLabel(months)}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="@container/result flex flex-col rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-indigo-950 p-5 text-white shadow-lg ring-1 ring-white/10 sm:p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-200/80 uppercase">Monthly EMI</p>
            <svg
              viewBox="0 0 100 100"
              className="size-11 shrink-0 -rotate-90 @xs/result:row-span-3 @xs/result:size-20"
              role="img"
              aria-label={`Interest is ${Math.round(interestShare * 100)}% of everything you repay`}
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#818cf8"
                strokeWidth="10"
                strokeDasharray={`${CIRC * (nothingToFinance ? 0 : 1 - interestShare)} ${CIRC}`}
                className="transition-[stroke-dasharray] duration-500 motion-reduce:transition-none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="10"
                strokeDasharray={`${CIRC * interestShare} ${CIRC}`}
                strokeDashoffset={-CIRC * (1 - interestShare)}
                className="transition-[stroke-dasharray,stroke-dashoffset] duration-500 motion-reduce:transition-none"
              />
            </svg>
            <p className="col-span-2 mt-1 text-3xl font-semibold tracking-tight break-words tabular-nums @xs/result:col-span-1 @xs/result:text-4xl">
              {money.format(result.emi)}
            </p>
            <p className="col-span-2 mt-1 text-sm text-zinc-400 @xs/result:col-span-1">
              {nothingToFinance
                ? "Nothing to finance: the down payment covers the price."
                : `every month for ${tenureLabel(months)}`}
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-3 border-t border-white/10 pt-4 text-sm @3xs/result:grid-cols-2">
            <div>
              <dt className="flex items-center gap-1.5 text-zinc-400">
                <span aria-hidden="true" className="size-2 rounded-full bg-indigo-400" />
                Amount financed
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums">{money.format(principal)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-zinc-400">
                <span aria-hidden="true" className="size-2 rounded-full bg-amber-400" />
                Total interest
              </dt>
              <dd className="mt-0.5 font-semibold tabular-nums">
                {money.format(result.totalInterest)}
                {extraPercent > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-amber-200/90">+{extraPercent.toFixed(1)}%</span>
                )}
              </dd>
            </div>
            {downPayment > 0 && (
              <div>
                <dt className="text-zinc-400">Paid upfront</dt>
                <dd className="mt-0.5 font-semibold tabular-nums">{money.format(downPayment)}</dd>
              </div>
            )}
            <div className={downPayment > 0 ? "" : "@3xs/result:col-span-2"}>
              <dt className="text-zinc-400">Total you pay</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">{money.format(totalCost)}</dd>
            </div>
          </dl>

          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <p className="text-xs leading-snug text-zinc-400">
              {method === "flat"
                ? "Flat rate: interest on the full amount."
                : "Reducing balance: interest on what you still owe."}
            </p>
            <button
              type="button"
              onClick={copySummary}
              className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/15 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:scale-95"
            >
              <span aria-live="polite">{copied ? "Copied ✓" : "Copy summary"}</span>
            </button>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status">
        Monthly EMI {money.format(result.emi)} for {months} months. Total interest {money.format(result.totalInterest)}.
        Total you pay {money.format(totalCost)}.
      </p>

      {showCompare && !nothingToFinance && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Compare plans</h3>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Plan
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Monthly EMI
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Total interest
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    Total payable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {plans.map((plan) => {
                  const selected = plan.months === months;
                  return (
                    <tr key={plan.months} className={selected ? "bg-indigo-50 dark:bg-indigo-500/10" : undefined}>
                      <th scope="row" className="px-4 py-2 font-medium">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setMonths(plan.months);
                            setCustom(!tenures.includes(plan.months));
                          }}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                            selected && "text-indigo-700 dark:text-indigo-300",
                          )}
                        >
                          {plan.months} months
                        </button>
                      </th>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{money.format(plan.emi)}</td>
                      <td className="px-4 py-2 text-right text-zinc-600 tabular-nums dark:text-zinc-300">
                        {money.format(plan.totalInterest)}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-600 tabular-nums dark:text-zinc-300">
                        {money.format(downPayment + plan.totalPayable)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSchedule && !nothingToFinance && (
        <details className="group mt-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
            Payment schedule ({months} {months === 1 ? "payment" : "payments"})
            <svg
              className="size-4 text-zinc-500 transition-transform group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <div className="max-h-80 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[26rem] text-right text-sm tabular-nums">
              <thead className="sticky top-0 bg-white text-xs text-zinc-500 shadow-[0_1px_0] shadow-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-zinc-800">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-medium">
                    Month
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Principal
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Interest
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    Balance left
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {result.schedule.map((row) => (
                  <tr key={row.month}>
                    <th scope="row" className="px-4 py-1.5 text-left font-medium text-zinc-500 dark:text-zinc-400">
                      {row.month}
                    </th>
                    <td className="px-4 py-1.5 font-medium">{money.format(row.payment)}</td>
                    <td className="px-4 py-1.5 text-zinc-600 dark:text-zinc-300">{money.format(row.principal)}</td>
                    <td className="px-4 py-1.5 text-amber-700 dark:text-amber-300">{money.format(row.interest)}</td>
                    <td className="px-4 py-1.5 text-zinc-600 dark:text-zinc-300">{money.format(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
