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
            <a
              href="#"
              className="group grid grid-cols-1 gap-3 px-6 py-7 transition-colors hover:bg-card sm:grid-cols-[200px_1fr_auto] sm:items-start sm:gap-6"
            >
              <h2 className="text-[20px] leading-[1.65] tracking-[-0.045em]">
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
                className="hidden text-[13px] text-faint transition-colors group-hover:text-fg sm:block sm:pt-1"
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
