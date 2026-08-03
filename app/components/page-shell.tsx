import Link from "next/link";

import { profile } from "../lib/data";

/**
 * Chrome shared by the three sub-pages, matching the reference's treatment:
 * a back link, an eyebrow, an oversized title, a short intro, then a rule
 * separating the hero from the content.
 *
 * The column is 680px here rather than the homepage's 592px — measured off
 * the reference, which widens the sub-pages to carry denser content.
 */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-[728px] px-6 pb-24 pt-14 sm:pb-16 sm:pt-20"
    >
      <Link
        href="/#main"
        className="label inline-flex items-center gap-2 transition-colors hover:text-fg"
      >
        <span aria-hidden>←</span> Portfolio
      </Link>

      <header className="fade-up mt-12 sm:mt-16">
        <p className="label">{eyebrow}</p>
        {/* 60.8px at -0.055em on the reference. Scaled down on phones, where
            that would run to four lines in a 342px column. */}
        <h1 className="mt-3 text-balance text-[38px] font-semibold leading-[0.98] tracking-[-0.045em] sm:text-[60px] sm:tracking-[-0.055em]">
          {title}
        </h1>
        <p className="mt-5 max-w-[46ch] text-[15px] leading-[1.7] text-muted">
          {intro}
        </p>
      </header>

      {/* Hero rhythm measured off the reference: 12px eyebrow-to-title,
          20px title-to-intro, and 105px from the intro down to the first row
          of content. The previous values ran 48px long on that last gap. */}
      <hr className="mt-10 border-line" />

      {children}

      <footer className="mt-20 flex items-baseline justify-between border-t border-line pt-6 text-[13px] text-muted">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <Link href="/#main" className="transition-colors hover:text-fg">
          Back to portfolio <span aria-hidden>→</span>
        </Link>
      </footer>
    </main>
  );
}

/** Rounded monogram tile, standing in for a company logo. */
export function Monogram({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-card text-[13px] font-medium tracking-wide shadow-[0_1px_2px_rgb(10_10_10/0.035)]"
    >
      {initials}
    </span>
  );
}
