import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-street",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 — Canada Transit Guide",
  description:
    "Explore transportation accessibility for all 2026 FIFA World Cup stadiums in Canada. Compare transit, cycling, walking, and driving times from key city anchors.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        translate="yes"
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable}`}
      >
        {children}

        {/*
         * Google Translate widget target div.
         * Must be persistently in the DOM (not inside conditional view renders)
         * so the widget initialises correctly regardless of which view is active.
         * Styled via .goog-* overrides in globals.css + the #google_translate_element rule.
         */}
        <div id="google_translate_element" />

        {/*
         * Step 1: Define the callback the Google Translate script will call once loaded.
         * afterInteractive ensures this runs client-side after hydration.
         * Placed before the translate.js load script so the callback is registered first.
         */}
        <Script id="google-translate-init" strategy="afterInteractive">{`
          window.googleTranslateElementInit = function() {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false,
              },
              'google_translate_element'
            );
          };
        `}</Script>

        {/*
         * Step 2: Load the Google Translate widget script.
         * It reads window.googleTranslateElementInit and calls it once ready.
         */}
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
