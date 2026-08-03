import type { Metadata } from "next";

import { Monogram, PageShell } from "../components/page-shell";
import { profile, workHistory } from "../lib/data";

export const metadata: Metadata = {
  title: `Experience — ${profile.name}`,
  description: "A timeline of the teams, products, and roles behind the work.",
};

export default function ExperiencePage() {
  return (
    <PageShell
      eyebrow="Work history"
      title="Where I've worked."
      intro="A timeline of the teams I've supported, the products I've built, and the roles I've grown through."
    >
      <div className="mt-12 sm:mt-16">
        {workHistory.map((company, index) => (
          <section
            key={company.name}
            className={index > 0 ? "mt-14 sm:mt-16" : undefined}
          >
            <div className="flex items-center gap-4">
              <Monogram initials={company.initials} />
              <div>
                <h2 className="text-[19px] font-semibold tracking-[-0.025em]">
                  {company.name}
                </h2>
                <p className="mt-1 text-[11px] text-muted">{company.site}</p>
              </div>
            </div>

            {/* The rule runs down the middle of the logo tile above it, so the
                roles read as hanging off the company. size-14 tile plus gap-4
                puts that centre at 28px; the list is inset to match. */}
            <ol className="ml-7 border-l border-line">
              {company.roles.map((role) => (
                <li key={role.title} className="relative py-7 pl-9 last:pb-0">
                  <span
                    aria-hidden
                    className="absolute -left-[4.5px] top-[34px] size-2 rounded-full border border-line-strong bg-bg"
                  />
                  <h3 className="text-[16px] tracking-[-0.02em]">
                    {role.title}
                  </h3>
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
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
