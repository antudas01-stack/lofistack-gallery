"use client";

import type { ComponentType } from "react";
import { OrbitLoaderCard, OrbitLoaderPlayground, OrbitLoaderStates } from "./orbit-loader-demo";
import {
  HoldToConfirmButtonCard,
  HoldToConfirmButtonPlayground,
  HoldToConfirmButtonStates,
} from "./hold-to-confirm-button-demo";
import { SignalInputCard, SignalInputPlayground, SignalInputStates } from "./signal-input-demo";
import { CommandPaletteCard, CommandPalettePlayground, CommandPaletteStates } from "./command-palette-demo";
import { ReceiptCardCard, ReceiptCardPlayground, ReceiptCardStates } from "./receipt-card-demo";
import { MorphingAreaChartCard, MorphingAreaChartPlayground, MorphingAreaChartStates } from "./morphing-area-chart-demo";

type DemoView = "playground" | "states" | "card";

const DEMOS: Record<string, Record<DemoView, ComponentType>> = {
  "orbit-loader": { playground: OrbitLoaderPlayground, states: OrbitLoaderStates, card: OrbitLoaderCard },
  "signal-input": { playground: SignalInputPlayground, states: SignalInputStates, card: SignalInputCard },
  "hold-to-confirm-button": {
    playground: HoldToConfirmButtonPlayground,
    states: HoldToConfirmButtonStates,
    card: HoldToConfirmButtonCard,
  },
  "morphing-area-chart": {
    playground: MorphingAreaChartPlayground,
    states: MorphingAreaChartStates,
    card: MorphingAreaChartCard,
  },
  "command-palette": { playground: CommandPalettePlayground, states: CommandPaletteStates, card: CommandPaletteCard },
  "receipt-card": { playground: ReceiptCardPlayground, states: ReceiptCardStates, card: ReceiptCardCard },
};

/** Client-side lookup so server pages can render a demo by slug. */
export function Demo({ slug, view }: { slug: string; view: DemoView }) {
  const Component = DEMOS[slug]?.[view];
  if (!Component) return null;
  return <Component />;
}
