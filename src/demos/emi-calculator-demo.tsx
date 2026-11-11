"use client";

import { useState, type ReactNode } from "react";
import { EmiCalculator, type EmiResult } from "@/components/gallery/emi-calculator";
import { Segmented, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

const CURRENCIES = {
  BDT: { defaultPrice: 85000, minPrice: 5000, maxPrice: 500000, priceStep: 1000, defaultDownPayment: 10000 },
  USD: { defaultPrice: 1200, minPrice: 100, maxPrice: 10000, priceStep: 50, defaultDownPayment: 200 },
  INR: { defaultPrice: 60000, minPrice: 5000, maxPrice: 500000, priceStep: 1000, defaultDownPayment: 5000 },
  EUR: { defaultPrice: 1100, minPrice: 100, maxPrice: 10000, priceStep: 50, defaultDownPayment: 100 },
} as const;
type Currency = keyof typeof CURRENCIES;

export function EmiCalculatorPlayground() {
  const [currency, setCurrency] = useState<Currency>("BDT");
  const [showCompare, setShowCompare] = useState(true);
  const [showSchedule, setShowSchedule] = useState(true);
  const [last, setLast] = useState<EmiResult | null>(null);

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full max-w-4xl min-w-0 flex-col gap-3">
          <EmiCalculator
            key={currency}
            title="Buy now, pay monthly"
            currency={currency}
            {...CURRENCIES[currency]}
            showCompare={showCompare}
            showSchedule={showSchedule}
            onChange={setLast}
          />
          <p className="truncate font-mono text-[11px] text-fg-muted">
            {last
              ? `onChange → { emi: ${last.emi.toFixed(2)}, totalInterest: ${last.totalInterest.toFixed(2)}, months: ${last.months}, method: "${last.method}" }`
              : "Change any value to see the result object."}
          </p>
        </div>
      }
      controls={
        <>
          <Segmented
            label="Currency"
            options={Object.keys(CURRENCIES) as Currency[]}
            value={currency}
            onChange={setCurrency}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Compare plans table" checked={showCompare} onChange={setShowCompare} />
            <Toggle label="Payment schedule" checked={showSchedule} onChange={setShowSchedule} />
          </div>
          <p className="text-xs leading-relaxed text-fg-muted">
            Try <span className="font-medium text-fg">Custom</span> for any number of months, set interest to{" "}
            <span className="font-medium text-fg">0%</span>, or switch between{" "}
            <span className="font-medium text-fg">Reducing</span> and <span className="font-medium text-fg">Flat</span>{" "}
            to see how much the method changes the cost.
          </p>
        </>
      }
    />
  );
}

/** Renders the calculator at a fixed design width, scaled down to fit small tiles. */
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

export function EmiCalculatorStates() {
  const compact = { showCompare: false, showSchedule: false } as const;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <StateTile label="0% interest plan · 6 months">
        <Mini width={720} height={470} scale={0.62}>
          <EmiCalculator {...compact} title="0% EMI offer" defaultPrice={1800} defaultRate={0} defaultTenure={6} />
        </Mini>
      </StateTile>
      <StateTile label="Flat rate · with down payment">
        <Mini width={720} height={470} scale={0.62}>
          <EmiCalculator
            {...compact}
            currency="BDT"
            defaultPrice={120000}
            minPrice={5000}
            maxPrice={500000}
            priceStep={1000}
            defaultDownPayment={20000}
            defaultRate={9}
            defaultMethod="flat"
            defaultTenure={24}
          />
        </Mini>
      </StateTile>
      <StateTile label="Custom period · 30 months">
        <Mini width={720} height={560} scale={0.62}>
          <EmiCalculator {...compact} currency="EUR" defaultPrice={4200} defaultRate={7.5} defaultTenure={30} />
        </Mini>
      </StateTile>
      <StateTile label="Down payment covers the price">
        <Mini width={720} height={470} scale={0.62}>
          <EmiCalculator {...compact} defaultPrice={900} defaultDownPayment={900} />
        </Mini>
      </StateTile>
    </div>
  );
}

export function EmiCalculatorCard() {
  return (
    <Mini width={720} height={500} scale={0.36}>
      <EmiCalculator
        showCompare={false}
        showSchedule={false}
        currency="BDT"
        defaultPrice={85000}
        minPrice={5000}
        maxPrice={500000}
        priceStep={1000}
        defaultDownPayment={10000}
      />
    </Mini>
  );
}
