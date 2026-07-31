import Image from "next/image";

import { ContributionGraph } from "./components/contribution-graph";
import { ProjectStack } from "./components/project-stack";
import {
  certifications,
  education,
  experience,
  profile,
  projects,
  stack,
} from "./lib/data";

/** Section heading: lowercase title on the left, uppercase link on the right. */
function SectionHead({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <h2 className="text-[19px] tracking-tight">{title}</h2>
      {action ? (
        <a href={href ?? "#"} className="label transition-colors hover:text-fg">
          {action} <span aria-hidden>→</span>
        </a>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[640px] px-6 pb-32 pt-16 sm:pb-28 sm:pt-24">
      {/* Hero */}
      <section className="flex flex-col gap-6 sm:flex-row sm:gap-7">
        <Image
          src="/portrait.jpg"
          alt={`Portrait of ${profile.name}`}
          width={182}
          height={221}
          priority
          className="aspect-[4/5] h-auto w-full shrink-0 rounded-lg border border-line object-cover sm:aspect-auto sm:h-[221px] sm:w-[182px]"
        />
        <div>
          <h1 className="text-balance text-[26px] font-semibold leading-[1.1] tracking-tight sm:text-[30px] sm:leading-none">
            {profile.greeting}
          </h1>
          {profile.blurb.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 text-[14.5px] leading-[1.62] text-muted sm:prose-justify"
            >
              {paragraph}
            </p>
          ))}
          <a
            href={`mailto:${profile.email}`}
            className="mt-5 inline-block text-[13.5px] text-muted transition-colors hover:text-fg"
          >
            send email <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      <div className="mt-[60px]">
        <ContributionGraph />
      </div>

      {/* Experience */}
      <section className="mt-16">
        <SectionHead title="experience" action="Full history" href="/experience" />
        <ul>
          {experience.map((role) => (
            <li
              key={`${role.year}-${role.title}`}
              className="grid grid-cols-1 gap-1 border-t border-line py-4 text-[14px] last:border-b sm:grid-cols-[64px_1fr_auto] sm:items-baseline sm:gap-4"
            >
              <span className="text-muted">{role.year}</span>
              <span>{role.title}</span>
              <span className="text-muted sm:text-right">{role.company}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Education */}
      <section className="mt-16">
        <SectionHead title="education" />
        <div className="grid grid-cols-1 gap-1 text-[14px] sm:grid-cols-[104px_1fr] sm:gap-4">
          <span className="text-muted">{education.years}</span>
          <span>
            {education.degree}
            <span className="mt-1 block text-muted">{education.school}</span>
          </span>
        </div>
      </section>

      {/* Stack */}
      <section className="mt-16">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="label">Stack</h2>
          <a href="#" className="label transition-colors hover:text-fg">
            View all <span aria-hidden>→</span>
          </a>
        </div>
        <ul className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Projects */}
      <section className="mt-16">
        <SectionHead title="projects" action="All projects" href="/projects" />
        <ProjectStack projects={projects} />
      </section>

      {/* Certifications */}
      <section className="mt-12">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-[19px] tracking-tight">certifications</h2>
          <span className="label">{certifications.length} credentials</span>
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {certifications.map((cert) => (
            <li
              key={cert.name}
              className="rounded-lg border border-line px-5 py-8 text-center"
            >
              <span aria-hidden className="text-[17px] text-muted">
                {cert.mark}
              </span>
              <p className="mt-5 text-[13.5px]">{cert.name}</p>
              <p className="label mt-4">{cert.issuer}</p>
              <a
                href="#"
                className="label mt-6 inline-block transition-colors hover:text-fg"
              >
                Verify <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-16">
        <h2 className="text-[19px] tracking-tight">Let&rsquo;s build something</h2>
        <p className="mt-4 max-w-[430px] text-[14px] leading-[1.62] text-muted">
          Have a project, role, or idea? Drop a line — I read every message and
          usually reply within a day or two.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="rounded-md bg-fg px-4 py-2.5 text-[13px] text-bg transition-opacity hover:opacity-85"
          >
            Send Email
          </a>
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-4 py-2.5 text-[13px] transition-colors hover:border-line-strong"
          >
            GitHub
          </a>
        </div>
      </section>

      <footer className="mt-20 flex items-baseline justify-between border-t border-line pt-6 text-[12.5px] text-muted">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <a href="#" className="transition-colors hover:text-fg">
          Back to top <span aria-hidden>↑</span>
        </a>
      </footer>
    </main>
  );
}
