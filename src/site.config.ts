export const siteConfig = {
  name: "LofiStack Gallery",
  author: "Antu",
  description:
    "A growing library of reusable, accessible React + Tailwind components built for the LofiStack 90 Day Build Challenge.",
  repoUrl: "https://github.com/antudas01-stack/lofistack-gallery",
  repoBranch: "main",
  challengeStart: "2026-10-01",
  /** 2 components a week across 90 days. */
  target: 30,
} as const;

export function sourceUrl(path: string) {
  return `${siteConfig.repoUrl}/blob/${siteConfig.repoBranch}/${path}`;
}
