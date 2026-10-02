import type { ComponentType } from "./types";

/** A color per type so cards and badges are easy to tell apart at a glance. */
export const TYPE_STYLES: Record<ComponentType, { hue: string; badge: string }> = {
  button: { hue: "#f97316", badge: "bg-orange-500/12 text-orange-700 ring-orange-500/30 dark:text-orange-300" },
  form: { hue: "#14b8a6", badge: "bg-teal-500/12 text-teal-700 ring-teal-500/30 dark:text-teal-300" },
  card: { hue: "#ec4899", badge: "bg-pink-500/12 text-pink-700 ring-pink-500/30 dark:text-pink-300" },
  modal: { hue: "#8b5cf6", badge: "bg-violet-500/12 text-violet-700 ring-violet-500/30 dark:text-violet-300" },
  navbar: { hue: "#3b82f6", badge: "bg-blue-500/12 text-blue-700 ring-blue-500/30 dark:text-blue-300" },
  table: { hue: "#84cc16", badge: "bg-lime-500/12 text-lime-700 ring-lime-500/30 dark:text-lime-300" },
  loader: { hue: "#a855f7", badge: "bg-purple-500/12 text-purple-700 ring-purple-500/30 dark:text-purple-300" },
  section: { hue: "#f43f5e", badge: "bg-rose-500/12 text-rose-700 ring-rose-500/30 dark:text-rose-300" },
  chart: { hue: "#eab308", badge: "bg-yellow-500/12 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300" },
  input: { hue: "#06b6d4", badge: "bg-cyan-500/12 text-cyan-700 ring-cyan-500/30 dark:text-cyan-300" },
};
