import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getLocale, t } from "@/lib/i18n";
import { dataMode } from "@/lib/data";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "America 360", template: "%s · America 360" },
  description: t("site.tagline"),
  robots: { index: false, follow: false }, // personal project, not for public indexing
};

export const viewport: Viewport = { themeColor: "#070f18", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-navy-950">
          Skip to content
        </a>
        <SiteHeader mode={dataMode()} />
        <main id="main" className="pb-16">
          {children}
        </main>
        <footer className="border-t border-line py-8 text-xs text-muted">
          <div className="container-page flex flex-col gap-2 sm:flex-row sm:justify-between">
            <p className="max-w-3xl">{t("footer.note")}</p>
            <p className="shrink-0">America 360 · Phase 1</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
