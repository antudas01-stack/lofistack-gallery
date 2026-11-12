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
  /** Monthly income, when the customer entered one. */
  income?: number;
  /** EMI as a share of income (0.15 = 15%). */
  incomeShare?: number;
  /** Plan suggested for that income, in months. null when no plan fits. */
  recommendedMonths?: number | null;
}

export type Affordability = "comfortable" | "tight" | "over";

export interface PlanAdvice {
  /** Suggested period in months, or null when even the longest plan is over the limit. */
  months: number | null;
  /** EMI of the suggested plan (or of the longest plan when nothing fits). */
  emi: number;
  /** That EMI as a share of income. */
  share: number;
  level: Affordability;
  /** Extra down payment that would make the longest plan comfortable. null when not needed. */
  extraDownPayment: number | null;
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
  /** "Find my best plan": suggests a plan from the customer's monthly income. */
  showAffordability?: boolean;
  defaultIncome?: number;
  maxIncome?: number;
  /** An EMI up to this share of income counts as comfortable (0.15 = 15%). */
  comfortShare?: number;
  /** An EMI above this share of income counts as too high (0.3 = 30%). */
  maxShare?: number;
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

const levelFor = (share: number, comfortShare: number, maxShare: number): Affordability =>
  share <= comfortShare + 1e-9 ? "comfortable" : share <= maxShare + 1e-9 ? "tight" : "over";

/**
 * Picks a plan from monthly income. Rule: the shortest plan whose EMI stays within the
 * comfortable share (least interest while comfortable). If none is comfortable, the plan
 * with the lowest EMI, as long as it is within the limit. Otherwise no plan.
 */
export function advisePlan(input: {
  income: number;
  principal: number;
  annualRate: number;
  tenures: number[];
  method?: EmiMethod;
  comfortShare?: number;
  maxShare?: number;
}): PlanAdvice | null {
  const { income, principal, annualRate, method = "reducing", comfortShare = 0.15, maxShare = 0.3 } = input;
  if (income <= 0 || principal <= 0 || input.tenures.length === 0) return null;
  const options = [...new Set(input.tenures)]
    .sort((a, b) => a - b)
    .map((months) => ({ months, emi: calculateEmi({ principal, annualRate, months, method }).emi }));
  const comfortable = options.find((o) => o.emi <= income * comfortShare + 1e-9);
  const lowest = options[options.length - 1];
  const pick = comfortable ?? (lowest.emi <= income * maxShare + 1e-9 ? lowest : null);
  const shown = pick ?? lowest;
  // EMI scales linearly with the amount financed, so the comfortable amount is a simple ratio.
  const comfortablePrincipal = (income * comfortShare) / (lowest.emi / principal);
  return {
    months: pick ? pick.months : null,
    emi: shown.emi,
    share: shown.emi / income,
    level: levelFor(shown.emi / income, comfortShare, maxShare),
    extraDownPayment: comfortable ? null : Math.max(0, principal - comfortablePrincipal),
  };
}

const LEVELS: Record<Affordability, { label: string; pill: string; card: string }> = {
  comfortable: {
    label: "Comfortable",
    pill: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    card: "border-emerald-500/40 bg-emerald-500/10",
  },
  tight: {
    label: "Tight",
    pill: "bg-amber-500/20 text-amber-800 dark:text-amber-300",
    card: "border-amber-500/50 bg-amber-500/10",
  },
  over: {
    label: "Too high",
    pill: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    card: "border-rose-500/40 bg-rose-500/10",
  },
};

const percent = (share: number) => `${share >= 0.995 ? Math.round(share * 100) : +(share * 100).toFixed(1)}%`;

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
  showAffordability = true,
  defaultIncome = 0,
  maxIncome,
  comfortShare = 0.15,
  maxShare = 0.3,
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
  const [income, setIncome] = useState(defaultIncome);
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

  const advice = useMemo(
    () =>
      showAffordability
        ? advisePlan({ income, principal, annualRate: rate, tenures, method, comfortShare, maxShare })
        : null,
    [showAffordability, income, principal, rate, tenures, method, comfortShare, maxShare],
  );

  const result = useMemo<EmiResult>(() => {
    const base = calculateEmi({ principal, annualRate: rate, months, method });
    return {
      price,
      downPayment,
      principal,
      annualRate: rate,
      months,
      method,
      ...base,
      ...(showAffordability && income > 0
        ? { income, incomeShare: base.emi / income, recommendedMonths: advice ? advice.months : null }
        : {}),
    };
  }, [price, downPayment, principal, rate, months, method, showAffordability, income, advice]);

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

  // Affordability, relative to the income the customer entered.
  const hasIncome = showAffordability && income > 0;
  const selectedShare = hasIncome ? result.emi / income : 0;
  const selectedLevel = levelFor(selectedShare, comfortShare, maxShare);
  const scaleMax = maxShare * 1.5;
  const recommended =
    advice && advice.months !== null ? plans.find((plan) => plan.months === advice.months) : undefined;
  const longestTenure = Math.max(...tenures);
  const extraDown =
    advice && advice.extraDownPayment !== null && advice.extraDownPayment > 0
      ? Math.ceil(advice.extraDownPayment / priceStep) * priceStep
      : 0;
  const canAddDown = extraDown > 0 && downPayment + extraDown < price;

  const summary = [
    `${title}`,
    `Price: ${money.format(price)}`,
    downPayment > 0 ? `Down payment: ${money.format(downPayment)}` : null,
    `Financed: ${money.format(principal)} at ${rate}% (${method === "flat" ? "flat" : "reducing balance"}) for ${months} months`,
    `Monthly EMI: ${money.format(result.emi)}`,
    `Total interest: ${money.format(result.totalInterest)}`,
    `Total payable: ${money.format(totalCost)}`,
    hasIncome && !nothingToFinance
      ? `EMI is ${percent(selectedShare)} of monthly income (${LEVELS[selectedLevel].label.toLowerCase()})`
      : null,
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
        {hasIncome &&
          !nothingToFinance &&
          ` That is ${percent(selectedShare)} of your income: ${LEVELS[selectedLevel].label.toLowerCase()}.`}
        {advice &&
          (advice.months !== null
            ? ` Best plan for your income: ${advice.months} months.`
            : " No plan fits your income yet.")}
      </p>

      {showAffordability && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-5 @2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
            <div>
              <h3 className="text-sm font-semibold">Find my best plan</h3>
              <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Enter your monthly income and we&apos;ll suggest the plan that fits your budget.
              </p>
              <NumberField
                label="Monthly income"
                value={income}
                onChange={setIncome}
                min={0}
                max={maxIncome ?? maxPrice}
                step={priceStep}
                prefix={money.symbol}
                hint="Optional"
                locale={locale}
              />
              <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Guide used: an EMI up to {percent(comfortShare)} of income is comfortable, and above {percent(maxShare)}{" "}
                is too high. This is a budgeting guide, not financial advice.
              </p>
            </div>

            <div className="min-w-0">
              {!hasIncome ? (
                <p className="grid h-full min-h-24 place-items-center rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Your suggested plan will appear here.
                </p>
              ) : nothingToFinance || !advice ? (
                <p className="grid h-full min-h-24 place-items-center rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  No EMI needed: your down payment covers the full price.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      Your selected plan uses{" "}
                      <span className="font-semibold tabular-nums">{percent(selectedShare)}</span> of your income
                    </span>
                    <span
                      className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", LEVELS[selectedLevel].pill)}
                    >
                      {LEVELS[selectedLevel].label}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label="EMI as a share of monthly income"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(scaleMax * 100)}
                    aria-valuenow={Math.min(Math.round(scaleMax * 100), Math.round(selectedShare * 100))}
                    aria-valuetext={`${percent(selectedShare)} of income, ${LEVELS[selectedLevel].label.toLowerCase()}`}
                    className="relative mt-3"
                  >
                    <div className="flex h-2.5 overflow-hidden rounded-full">
                      <span className="bg-emerald-500" style={{ width: `${(comfortShare / scaleMax) * 100}%` }} />
                      <span
                        className="bg-amber-400"
                        style={{ width: `${((maxShare - comfortShare) / scaleMax) * 100}%` }}
                      />
                      <span className="flex-1 bg-rose-500" />
                    </div>
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 h-4.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-900 ring-2 ring-white transition-[left] duration-500 motion-reduce:transition-none dark:bg-white dark:ring-zinc-900"
                      style={{ left: `${Math.min(1, selectedShare / scaleMax) * 100}%` }}
                    />
                    <div
                      aria-hidden="true"
                      className="relative mt-1.5 h-4 text-[10px] text-zinc-500 tabular-nums dark:text-zinc-400"
                    >
                      <span className="absolute left-0">0%</span>
                      <span
                        className="absolute -translate-x-1/2"
                        style={{ left: `${(comfortShare / scaleMax) * 100}%` }}
                      >
                        {percent(comfortShare)}
                      </span>
                      <span className="absolute -translate-x-1/2" style={{ left: `${(maxShare / scaleMax) * 100}%` }}>
                        {percent(maxShare)}
                      </span>
                    </div>
                  </div>

                  <div className={cn("mt-3 rounded-xl border p-3.5", LEVELS[advice.level].card)}>
                    <p className="text-[11px] font-semibold tracking-wider uppercase">
                      {advice.months === null ? "No plan fits yet" : "Best for you"}
                    </p>
                    {advice.months !== null ? (
                      <>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {advice.months} months · {money.format(advice.emi)}
                          <span className="text-sm font-normal"> / month</span>
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          {advice.level === "comfortable"
                            ? `The shortest plan that keeps your EMI within ${percent(comfortShare)} of your income (it uses ${percent(advice.share)}), so you pay the least interest${recommended ? `: ${money.format(recommended.totalInterest)}` : ""}.`
                            : `No plan stays within ${percent(comfortShare)} of your income. This one has the lowest monthly payment, at ${percent(advice.share)}. It fits, but leaves less room in your budget.`}
                        </p>
                        <button
                          type="button"
                          disabled={months === advice.months}
                          onClick={() => {
                            setMonths(advice.months as number);
                            setCustom(false);
                          }}
                          className="mt-3 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-95 disabled:cursor-default disabled:bg-transparent disabled:px-0 disabled:text-emerald-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900 dark:disabled:bg-transparent dark:disabled:text-emerald-300"
                        >
                          {months === advice.months ? "✓ This plan is selected" : "Use this plan"}
                        </button>
                      </>
                    ) : (
                      <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                        Even the longest plan ({longestTenure} months) needs {money.format(advice.emi)} a month, which
                        is {percent(advice.share)} of your income.
                      </p>
                    )}
                    {canAddDown && (
                      <p className="mt-3 border-t border-black/10 pt-3 text-sm leading-relaxed text-zinc-700 dark:border-white/10 dark:text-zinc-300">
                        Tip: paying {money.format(extraDown)} more upfront makes the {longestTenure}-month plan
                        comfortable.{" "}
                        <button
                          type="button"
                          onClick={() => setDown(downPayment + extraDown)}
                          className="rounded font-semibold text-indigo-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300"
                        >
                          Add it to the down payment
                        </button>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCompare && !nothingToFinance && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Compare plans</h3>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className={cn("w-full text-left text-sm", hasIncome ? "min-w-[34rem]" : "min-w-[26rem]")}>
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
                  {hasIncome && (
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">
                      Of income
                    </th>
                  )}
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
                        {advice?.months === plan.months && (
                          <span className="ml-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                            Best
                          </span>
                        )}
                      </th>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{money.format(plan.emi)}</td>
                      <td className="px-4 py-2 text-right text-zinc-600 tabular-nums dark:text-zinc-300">
                        {money.format(plan.totalInterest)}
                      </td>
                      <td className="px-4 py-2 text-right text-zinc-600 tabular-nums dark:text-zinc-300">
                        {money.format(downPayment + plan.totalPayable)}
                      </td>
                      {hasIncome && (
                        <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              LEVELS[levelFor(plan.emi / income, comfortShare, maxShare)].pill,
                            )}
                          >
                            {percent(plan.emi / income)} ·{" "}
                            {LEVELS[levelFor(plan.emi / income, comfortShare, maxShare)].label}
                          </span>
                        </td>
                      )}
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
