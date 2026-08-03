import type { Metadata } from "next";

import { Monogram, PageShell } from "../components/page-shell";
import { profile, workHistory, type Position } from "../lib/data";

export const metadata: Metadata = {
  title: `Experience — ${profile.name}`,
  description: "A timeline of the teams, products, and roles behind the work.",
};

/** Shared by the timeline and single-role layouts. */
function RoleBody({ role }: { role: Position }) {
  return (
    <>
      <h3 className="text-[16px] tracking-[-0.02em]">{role.title}</h3>
      <p className="label mt-2">{role.period}</p>
      <p className="mt-1 text-[12px] text-faint">{role.meta}</p>
      <p className="mt-4 max-w-[54ch] text-[14px] leading-[1.75] text-muted">
        {role.summary}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {role.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-line px-2.5 py-1 text-[12px] font-medium text-muted"
          >
            {tag}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function ExperiencePage() {
  return (
    <PageShell
      eyebrow="Work history"
      title="Where I've worked."
      intro="A timeline of the teams I've supported, the products I've built, and the roles I've grown through."
    >
      {/* Two nested rules, as the reference has it.
          - The company rule runs the whole length of the list, entering at the
            first logo's centre and threading behind each one after it. The
            tiles are opaque, so it reads as emerging from under each badge.
          - The position rule is per company, carrying the role markers. */}
      <div className="relative mt-9">
        <span
          aria-hidden
          className="absolute bottom-0 left-8 top-8 w-px -translate-x-1/2 bg-line"
        />

        {workHistory.map((company, index) => (
          <section key={company.name} className={index > 0 ? "pt-14" : undefined}>
            <div className="flex items-center gap-4">
              <Monogram initials={company.initials} />
              <div>
                <h2 className="text-[19px] font-semibold tracking-[-0.025em]">
                  {company.name}
                </h2>
                <p className="mt-1 text-[11px] text-muted">{company.site}</p>
              </div>
            </div>

            {/* A single role gets no rule of its own — with nothing to connect
                it would just be a stray tick. The reference does the same. */}
            {company.roles.length > 1 ? (
              <ol className="ml-[92px] border-l border-line">
                {company.roles.map((role) => (
                  <li key={role.title} className="relative pb-10 pl-5 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute left-0 top-[6px] size-2.5 -translate-x-1/2 rounded-full border border-line-strong bg-bg"
                    />
                    <RoleBody role={role} />
                  </li>
                ))}
              </ol>
            ) : (
              <div className="ml-[92px] pt-6 pl-5">
                <RoleBody role={company.roles[0]} />
              </div>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
