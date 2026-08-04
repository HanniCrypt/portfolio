import type { Metadata } from "next";

import { PageShell } from "../components/page-shell";
import { profile, projectArchive } from "../lib/data";

export const metadata: Metadata = {
  title: `Projects — ${profile.name}`,
  description: "Products, experiments, and client work.",
};

export default function ProjectsPage() {
  return (
    <PageShell
      eyebrow="Project archive"
      title="Selected work."
      intro="Products, experiments, and client work spanning web, mobile, and developer tooling."
    >
      {/* One bordered container with hairline-separated rows, as the reference
          has it, rather than a card per project. */}
      <ul className="mt-9 overflow-hidden rounded-2xl border border-line">
        {projectArchive.map((project, index) => (
          <li
            key={project.name}
            className={index > 0 ? "border-t border-rule" : undefined}
          >
            {/* items-center is the point: the name and the arrow sit on the
                row's middle, not at its top, so a three-line summary keeps the
                name optically anchored. Column widths, 24/44px padding and the
                32px gap are the reference's. Its columns deliberately do not
                fill the row — the arrow stops short of the right edge. */}
            <a
              href="#"
              className="group grid grid-cols-1 gap-3 px-6 py-6 transition-colors hover:bg-card sm:grid-cols-[163px_minmax(0,275px)_24px] sm:items-center sm:gap-8 sm:px-11"
            >
              <h2 className="text-[20.8px] leading-[1.65] tracking-[-0.045em]">
                {project.name}
              </h2>
              <div>
                <p className="label">{project.kind}</p>
                <p className="mt-2 text-[14px] leading-[1.6] text-muted">
                  {project.summary}
                </p>
              </div>
              <span
                aria-hidden
                className="hidden text-[13px] text-faint transition-colors group-hover:text-fg sm:block"
              >
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
