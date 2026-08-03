import type { Metadata } from "next";

import { PageShell } from "../components/page-shell";
import { operations, profile, stackGroups } from "../lib/data";

export const metadata: Metadata = {
  title: `Stack — ${profile.name}`,
  description: "The technical stack, organised by the role each tool plays.",
};

/** Chip mark. The reference gives each tool a brand glyph; these are mock
 *  entries, so they share one neutral dot rather than borrowing real logos. */
function Dot() {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full bg-faint transition-colors group-hover:bg-fg"
    />
  );
}

function Chip({ label }: { label: string }) {
  return (
    <li className="group inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg">
      <Dot />
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
      <div className="mt-12 sm:mt-16">
        {stackGroups.map((group, index) => (
          <section
            key={group.label}
            className={`grid grid-cols-1 gap-4 py-7 sm:grid-cols-[150px_1fr] sm:gap-6 ${
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

      <section className="mt-16 border-t border-line pt-14 sm:mt-20">
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
