import type { Metadata } from "next";
import { Cinzel, Cormorant_Garamond, Geist, Geist_Mono, Pinyon_Script } from "next/font/google";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/site/site-header";
import { siteConfig } from "@/site.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Invitation fonts: exposed as the CSS variables FlipInvitation reads. Not preloaded,
// so the files only download on pages that actually render an invitation.
const invitationScript = Pinyon_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--inv-font-script",
  preload: false,
});
const invitationSerif = Cormorant_Garamond({
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--inv-font-serif",
  preload: false,
});
const invitationCaps = Cinzel({ subsets: ["latin"], variable: "--inv-font-caps", preload: false });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

// Applies the saved (or system) theme before paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${invitationScript.variable} ${invitationSerif.variable} ${invitationCaps.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
