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
try {
  var stored = localStorage.getItem('theme');
  var dark = stored
    ? stored === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
} catch (e) {}
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
