"use client";

import { useState } from "react";
import { ReceiptCard, type ReceiptLineItem, type ReceiptStatus } from "@/components/gallery/receipt-card";
import { Segmented, Slider, Toggle } from "@/components/site/controls";
import { PlaygroundShell, StateTile } from "@/components/site/playground-shell";

function CupIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8Zm13 1h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3m4-3v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const COFFEE: ReceiptLineItem[] = [
  { name: "Oat latte", quantity: 2, price: 4.5, note: "Extra shot" },
  { name: "Almond croissant", quantity: 1, price: 3.75 },
  { name: "Cold brew", quantity: 1, price: 4.25, note: "Less ice" },
];

const PRESETS = {
  coffee: { merchant: "Lofi Coffee Co.", orderId: "#1042", items: COFFEE, paymentMethod: "Visa •••• 4242" },
  store: {
    merchant: "Pixel Supply",
    orderId: "#A-7781",
    items: [
      { name: "Mech keyboard", quantity: 1, price: 129 },
      { name: "Desk mat XL", quantity: 1, price: 24 },
      { name: "USB-C cable", quantity: 3, price: 9.5 },
    ],
    paymentMethod: "Apple Pay",
  },
} as const;
type Preset = keyof typeof PRESETS;

export function ReceiptCardPlayground() {
  const [preset, setPreset] = useState<Preset>("coffee");
  const [status, setStatus] = useState<ReceiptStatus | "none">("paid");
  const [taxPct, setTaxPct] = useState(8);
  const [tip, setTip] = useState(2);
  const [withDiscount, setWithDiscount] = useState(true);
  const [printer, setPrinter] = useState(true);
  const [animate, setAnimate] = useState(true);
  const [printKey, setPrintKey] = useState(0);

  const p = PRESETS[preset];

  return (
    <PlaygroundShell
      stage={
        <div className="flex w-full flex-col items-center gap-5">
          <ReceiptCard
            key={`${printKey}-${preset}`}
            merchant={p.merchant}
            orderId={p.orderId}
            date="Oct 9, 2026 · 9:41 AM"
            items={[...p.items]}
            taxRate={taxPct / 100}
            tip={tip}
            discount={withDiscount ? { label: "LOFI10", amount: 2 } : undefined}
            paymentMethod={p.paymentMethod}
            status={status === "none" ? undefined : status}
            logo={preset === "coffee" ? <CupIcon /> : undefined}
            footer={preset === "coffee" ? "Thanks for stopping by!" : "Returns within 30 days"}
            printer={printer}
            animate={animate}
          />
        </div>
      }
      controls={
        <>
          <Segmented label="Preset" options={["coffee", "store"] as const} value={preset} onChange={setPreset} />
          <Segmented
            label="Status"
            options={["paid", "pending", "refunded", "none"] as const}
            value={status}
            onChange={setStatus}
          />
          <Slider
            label="Tax rate"
            value={taxPct}
            min={0}
            max={20}
            step={0.5}
            format={(v) => `${v}%`}
            onChange={setTaxPct}
          />
          <Slider
            label="Tip"
            value={tip}
            min={0}
            max={10}
            step={0.5}
            format={(v) => `$${v.toFixed(2)}`}
            onChange={setTip}
          />
          <div className="flex flex-col gap-1 border-t border-line pt-3">
            <Toggle label="Discount code" checked={withDiscount} onChange={setWithDiscount} />
            <Toggle label="Printer slot" checked={printer} onChange={setPrinter} />
            <Toggle label="Print animation" checked={animate} onChange={setAnimate} />
          </div>
          <button
            type="button"
            onClick={() => setPrintKey((k) => k + 1)}
            className="rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm font-medium transition hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98]"
          >
            Print again
          </button>
        </>
      }
    />
  );
}

export function ReceiptCardStates() {
  const short: ReceiptLineItem[] = [{ name: "Matcha", quantity: 1, price: 5 }];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StateTile label="Paid">
        <ReceiptCard
          merchant="Lofi Coffee"
          orderId="#1001"
          items={short}
          taxRate={0.08}
          status="paid"
          animate={false}
          printer={false}
          footer=""
        />
      </StateTile>
      <StateTile label="Pending">
        <ReceiptCard
          merchant="Lofi Coffee"
          orderId="#1002"
          items={short}
          status="pending"
          animate={false}
          printer={false}
          footer=""
        />
      </StateTile>
      <StateTile label="Refunded">
        <ReceiptCard
          merchant="Lofi Coffee"
          orderId="#1003"
          items={short}
          status="refunded"
          animate={false}
          printer={false}
          footer=""
        />
      </StateTile>
      <StateTile label="Empty order">
        <ReceiptCard merchant="Lofi Coffee" orderId="#1004" items={[]} animate={false} printer={false} footer="" />
      </StateTile>
    </div>
  );
}

export function ReceiptCardCard() {
  // Crop from the top so the card shows the printer slot, merchant and first items.
  return (
    <div className="h-44 w-56 overflow-hidden pt-3">
      <div className="origin-top scale-[0.78]">
        <ReceiptCard
          merchant="Lofi Coffee"
          orderId="#1042"
          items={COFFEE.slice(0, 2)}
          status="paid"
          animate={false}
          footer=""
        />
      </div>
    </div>
  );
}
