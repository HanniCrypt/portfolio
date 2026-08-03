import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { CornerControls } from "./components/corner-controls";
import { DotField } from "./components/dot-field";
import { profile } from "./lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${profile.name} — Portfolio`,
  description:
    "Full stack developer. Selected work, experience, and things currently under construction.",
};

/**
 * Applies the stored theme while the HTML is still parsing, so the page never
 * paints in the wrong one. Documented pattern — see the Next.js guide on
 * preventing flash before hydration.
 */
const themeScript = `
(function () {
  function apply() {
    try {
      var stored = localStorage.getItem('theme');
      var dark = stored
        ? stored === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', dark);
    } catch (e) {}
  }
  apply();
  // A bfcache restore replays the old DOM without re-running this script, so
  // going Back to a page last painted in the other theme would leave it there
  // while localStorage says otherwise. Re-apply on restore.
  window.addEventListener('pageshow', function (e) { if (e.persisted) apply(); });
  // And follow the preference when another tab changes it.
  window.addEventListener('storage', function (e) { if (e.key === 'theme') apply(); });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <DotField />
        {children}
        <CornerControls />
      </body>
    </html>
  );
}
