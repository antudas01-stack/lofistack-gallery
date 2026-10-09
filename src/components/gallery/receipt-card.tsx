import type { CSSProperties, ReactNode } from "react";

export interface ReceiptLineItem {
  name: string;
  price: number;
  quantity?: number;
  /** Small note under the item, e.g. "Oat milk, extra shot". */
  note?: string;
}

export type ReceiptStatus = "paid" | "pending" | "refunded";

export interface ReceiptCardProps {
  merchant: string;
  items: ReceiptLineItem[];
  orderId?: string;
  /** Display date, e.g. "Oct 9, 2026 · 9:41 AM". */
  date?: string;
  /** Tax rate applied after discounts, e.g. 0.08 for 8%. */
  taxRate?: number;
  discount?: { label: string; amount: number };
  tip?: number;
  currency?: string;
  locale?: string;
  /** e.g. "Visa •••• 4242". */
  paymentMethod?: string;
  status?: ReceiptStatus;
  /** Line at the bottom, e.g. "Thanks for stopping by!". */
  footer?: string;
  logo?: ReactNode;
  /** Text encoded into the decorative barcode. Defaults to orderId. */
  barcodeValue?: string;
  /** Play the "printing" animation on mount. */
  animate?: boolean;
  /** Show the printer slot the receipt comes out of. */
  printer?: boolean;
  className?: string;
}

const STAMPS: Record<ReceiptStatus, { text: string; className: string }> = {
  paid: { text: "Paid", className: "border-emerald-600 text-emerald-700" },
  pending: { text: "Pending", className: "border-amber-600 text-amber-700" },
  refunded: { text: "Refunded", className: "border-rose-600 text-rose-700" },
};

const KEYFRAMES = `
@keyframes ls-receipt-print { 0% { transform: translateY(-100%); } 70% { transform: translateY(2%); } 100% { transform: translateY(0); } }
@keyframes ls-receipt-stamp { 0% { opacity: 0; transform: rotate(-14deg) scale(2.2); } 100% { opacity: .9; transform: rotate(-14deg) scale(1); } }
@keyframes ls-receipt-line { from { opacity: 0; } to { opacity: 1; } }
.ls-receipt[data-animate="true"] .ls-receipt-paper { animation: ls-receipt-print 1.5s cubic-bezier(.3,.7,.4,1) both; }
.ls-receipt[data-animate="true"] .ls-receipt-stamp { animation: ls-receipt-stamp 380ms 1.55s cubic-bezier(.2,1.5,.4,1) both; }
.ls-receipt-stamp { opacity: .9; transform: rotate(-14deg); }
.ls-receipt-paper {
  --zz: 14px;
  -webkit-mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--zz) 100%;
  mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / var(--zz) 100%;
}
@media (prefers-reduced-motion: reduce) {
  .ls-receipt[data-animate="true"] .ls-receipt-paper,
  .ls-receipt[data-animate="true"] .ls-receipt-stamp { animation: none; }
}`;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Deterministic bar widths from a string, so the same order always gets the same barcode. */
function barcodeBars(value: string) {
  let hash = 2166136261;
  const bars: number[] = [];
  for (let i = 0; i < 46; i++) {
    hash ^= value.charCodeAt(i % Math.max(1, value.length)) + i;
    hash = Math.imul(hash, 16777619) >>> 0;
    bars.push(1 + (hash % 3));
  }
  return bars;
}

function Dashed() {
  return <hr className="my-3 border-0 border-t-2 border-dashed border-zinc-300" />;
}

export function ReceiptCard({
  merchant,
  items,
  orderId,
  date,
  taxRate = 0,
  discount,
  tip = 0,
  currency = "USD",
  locale = "en-US",
  paymentMethod,
  status,
  footer = "Thank you!",
  logo,
  barcodeValue,
  animate = true,
  printer = true,
  className,
}: ReceiptCardProps) {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency });
  const subtotal = items.reduce((sum, item) => sum + item.price * (item.quantity ?? 1), 0);
  const discountAmount = Math.min(discount?.amount ?? 0, subtotal);
  const tax = Math.max(0, subtotal - discountAmount) * taxRate;
  const total = subtotal - discountAmount + tax + tip;
  const code = barcodeValue ?? orderId ?? merchant;
  const bars = barcodeBars(code);
  const stamp = status ? STAMPS[status] : null;

  const barStarts = bars.map((_, i) => bars.slice(0, i).reduce((a, b) => a + b, 0));
  const barcodeWidth = bars.reduce((a, b) => a + b, 0);
  const barRects = bars.map((w, i) =>
    i % 2 === 0 ? <rect key={i} x={barStarts[i]} y={0} width={w} height={36} /> : null,
  );

  return (
    <div className={cn("ls-receipt relative w-full max-w-[320px]", className)} data-animate={animate}>
      <style href="ls-receipt-card" precedence="default">
        {KEYFRAMES}
      </style>

      {printer && (
        <div
          aria-hidden="true"
          className="relative z-10 -mx-3 h-4 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-lg ring-1 ring-black/40"
        >
          <div className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/80" />
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden px-1 pb-6 transition-[filter] duration-300 [filter:drop-shadow(0_10px_14px_rgb(0_0_0/0.18))] hover:[filter:drop-shadow(0_18px_24px_rgb(0_0_0/0.28))]",
          printer && "-mt-2",
        )}
      >
        <article
          aria-label={`Receipt from ${merchant}`}
          className="ls-receipt-paper relative bg-[#fffdf7] px-6 pt-7 pb-10 font-mono text-[13px] leading-relaxed text-zinc-800"
          style={
            {
              backgroundImage: "linear-gradient(rgb(0 0 0 / .025) 1px, transparent 1px)",
              backgroundSize: "100% 22px",
            } as CSSProperties
          }
        >
          <header className="text-center">
            {logo && <div className="mb-2 flex justify-center [&_svg]:size-8">{logo}</div>}
            <h3 className="text-base font-bold tracking-[0.2em] text-zinc-900 uppercase">{merchant}</h3>
            {(orderId || date) && (
              <p className="mt-1 text-[11px] text-zinc-500">
                {orderId && <span>Order {orderId}</span>}
                {orderId && date && <span aria-hidden="true"> · </span>}
                {date && <span>{date}</span>}
              </p>
            )}
          </header>

          <Dashed />

          {items.length === 0 ? (
            <p className="py-4 text-center text-zinc-500">No items</p>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sr-only">
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={`${item.name}-${i}`} className="align-top">
                    <td className="py-1 pr-2">
                      {item.name}
                      {item.note && <span className="block text-[11px] text-zinc-500">{item.note}</span>}
                    </td>
                    <td className="py-1 pr-2 text-right whitespace-nowrap text-zinc-500">
                      <span className="sr-only">Quantity </span>×{item.quantity ?? 1}
                    </td>
                    <td className="py-1 text-right whitespace-nowrap tabular-nums">
                      {money.format(item.price * (item.quantity ?? 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Dashed />

          <dl className="space-y-1 tabular-nums">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money.format(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>{discount?.label ?? "Discount"}</dt>
                <dd>−{money.format(discountAmount)}</dd>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between">
                <dt>Tax ({+(taxRate * 100).toFixed(2)}%)</dt>
                <dd>{money.format(tax)}</dd>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between">
                <dt>Tip</dt>
                <dd>{money.format(tip)}</dd>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t-2 border-zinc-800 pt-2 text-base font-bold text-zinc-900">
              <dt>Total</dt>
              <dd>{money.format(total)}</dd>
            </div>
          </dl>

          {(paymentMethod || stamp) && (
            <div className="mt-4 flex min-h-10 items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-500">{paymentMethod && `Paid with ${paymentMethod}`}</p>
              {stamp && (
                <p
                  className={cn(
                    "ls-receipt-stamp pointer-events-none mr-1 shrink-0 rounded-md border-[3px] px-2.5 py-0.5 font-sans text-base font-black tracking-widest uppercase mix-blend-multiply",
                    stamp.className,
                  )}
                >
                  <span className="sr-only">Status: </span>
                  {stamp.text}
                </p>
              )}
            </div>
          )}

          <Dashed />

          <div className="flex flex-col items-center gap-1.5">
            <svg
              viewBox={`0 0 ${barcodeWidth} 36`}
              preserveAspectRatio="none"
              className="h-10 w-full fill-zinc-900"
              aria-hidden="true"
            >
              {barRects}
            </svg>
            <p className="text-[11px] tracking-[0.3em] text-zinc-500">{code}</p>
          </div>

          {footer && (
            <p className="mt-4 text-center text-xs font-semibold tracking-wider text-zinc-600 uppercase">{footer}</p>
          )}
        </article>
      </div>
    </div>
  );
}
