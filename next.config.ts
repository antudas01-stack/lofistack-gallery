import type { NextConfig } from "next";

// Set GITHUB_PAGES=true (and BASE_PATH=/<repo>) to emit a static export for GitHub Pages.
// Vercel and Netlify deploy the default build with no extra config.
const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  ...(isPages && {
    output: "export",
    basePath: process.env.BASE_PATH || undefined,
    trailingSlash: true,
  }),
};

export default nextConfig;
