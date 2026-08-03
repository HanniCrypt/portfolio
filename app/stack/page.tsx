import type { Metadata } from "next";

import { PageShell } from "../components/page-shell";
import { operations, profile, stackGroups } from "../lib/data";

export const metadata: Metadata = {
  title: `Stack — ${profile.name}`,
  description: "The technical stack, organised by the role each tool plays.",
};

/**
 * Chip mark. The reference carries a real logo for the handful of tools that
 * have one and falls back to this ⊙ for everything else — which is most of
 * them — so a single neutral glyph is the house style here, not a shortcut.
 */
function Mark() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="6"
        cy="6"
        r="4.6"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.75"
      />
      <circle cx="6" cy="6" r="1.35" fill="currentColor" />
    </svg>
  );
}

/**
 * Metrics read off the reference: 28px tall, and padded asymmetrically —
 * 7.2px on the icon side against 10.4px on the text side, so the glyph does
 * not look adrift from the edge.
 */
function Chip({ label }: { label: string }) {
  return (
    <li className="inline-flex h-7 items-center gap-[5.6px] rounded-full border border-line bg-card pl-[7.2px] pr-[10.4px] text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg">
      <Mark />
      {label}
    </li>
  );
}

export default function StackPage() {
  return (
    <PageShell
      eyebrow="Stack directory"
      title="Tools I build with."
      intro="My technical stack, organised by the role each tool plays — from interface design through to deployment."
    >
      <div className="mt-9">
        {stackGroups.map((group, index) => (
          <section
            key={group.label}
            // py-6 puts the label-to-label pitch at the reference's 113px;
            // py-7 overshot it by 8.
            className={`grid grid-cols-1 gap-4 py-6 sm:grid-cols-[150px_1fr] sm:gap-6 ${
              index > 0 ? "border-t border-line" : ""
            }`}
          >
            <h2 className="label sm:pt-1.5">{group.label}</h2>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <Chip key={item} label={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* mt-8 + pt-9 lands 97px below the last chip, matching the reference.
          The previous mt-20/pt-14 left a 165px hole here. */}
      <section className="mt-8 border-t border-line pt-9">
        <p className="label">{operations.eyebrow}</p>
        <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.03em]">
          {operations.title}
        </h2>
        <p className="mt-4 max-w-[54ch] text-[14.5px] leading-[1.7] text-muted">
          {operations.summary}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {operations.items.map((item) => (
            <Chip key={item} label={item} />
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
