
import Image from "next/image";

// Imported rather than referenced from /public so the filename is content
// hashed. Swapping the photo then changes its URL, instead of leaving browsers
// on the previous one for the four hours the image cache headers allow.
import headshot from "./headshot.jpg";
import { CertificationCard } from "./components/certification-card";
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
      <h2 className="text-[18px] tracking-[-0.02em]">{title}</h2>
      {action ? (
        <a href={href ?? "#"} className="label transition-colors hover:text-fg">
          {action} <span aria-hidden>→</span>
        </a>
      ) : null}
    </div>
  );
}

/** Envelope, drawn in the same stroke weight as the corner control icons. */
function MailMark() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2.75" y="5" width="18.5" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

/** The official GitHub mark — a solid glyph, so it is filled rather than stroked. */
function GitHubMark() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.86 3.03 9 7.4 10.63.54.1.72-.24.72-.53l-.02-1.86c-3.01.65-3.64-1.45-3.64-1.45-.5-1.25-1.2-1.58-1.2-1.58-.99-.67.07-.66.07-.66 1.09.08 1.66 1.12 1.66 1.12.97 1.66 2.55 1.18 3.17.9.1-.7.38-1.18.69-1.45-2.4-.27-4.93-1.2-4.93-5.35 0-1.18.42-2.15 1.11-2.9-.11-.28-.48-1.38.11-2.87 0 0 .9-.29 2.96 1.1a10.3 10.3 0 0 1 5.4 0c2.05-1.39 2.95-1.1 2.95-1.1.59 1.49.22 2.59.11 2.87.69.75 1.11 1.72 1.11 2.9 0 4.16-2.54 5.07-4.95 5.34.39.34.74 1 .74 2.02l-.01 3c0 .29.18.63.73.53a11.03 11.03 0 0 0 7.39-10.63C23.02 5.24 18.27.5 12 .5Z" />
    </svg>
  );
}

export default function Home() {
  // Bottom padding is the trailing space below the footer. On phones it also
  // has to clear the fixed control pill, which occupies the last ~70px of the
  // viewport; on desktop the pill sits far left of the column, so the page can
  // end sooner.
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-[640px] px-6 pb-24 pt-16 sm:pb-16 sm:pt-24"
    >
      {/* Hero */}
      <section className="flex flex-col gap-6 sm:flex-row sm:gap-7">
        {/* Square box to match the source, which is 1:1. The old 182x221 and
            aspect-[4/5] boxes cropped ~20% off each side — survivable on a
            full-body shot, but on a headshot it cut into the shoulders. 200px
            keeps roughly the area the 182x221 box had, so the hero still
            balances against the text beside it. */}
        <Image
          src={headshot}
          alt={`Portrait of ${profile.name}`}
          priority
          // sm:self-start matters: the hero is a flex row on desktop, and the
          // default align-items:stretch would pull the image to the text
          // block's height and defeat aspect-square. Only applied from sm up,
          // so mx-auto keeps centring it on phones.
          className="mx-auto aspect-square w-[200px] max-w-[60%] shrink-0 rounded-lg border border-line object-cover sm:mx-0 sm:max-w-none sm:self-start"
        />
        <div>
          {/* Hero type is the reference's, read off its computed styles rather
              than guessed: 32px/700 at -0.035em over 15px/500 at 1.65. The
              phone size keeps the ratio the column already used. */}
          <h1 className="text-balance text-[28px] font-bold leading-[1.15] tracking-[-0.035em] sm:text-[32px]">
            {profile.greeting}
          </h1>
          {profile.blurb.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 text-[15px] font-medium leading-[1.65] text-muted sm:prose-justify"
            >
              {paragraph}
            </p>
          ))}
          <a
            href={`mailto:${profile.email}`}
            className="mt-5 inline-block text-[13px] text-muted transition-colors hover:text-fg"
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
          <h2 className="text-[18px] tracking-[-0.02em]">certifications</h2>
          <span className="label">{certifications.length} credentials</span>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {certifications.map((cert) => (
            <CertificationCard key={cert.name} cert={cert} />
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section className="mt-16">
        <h2 className="text-[18px] tracking-[-0.02em]">Let&rsquo;s build something</h2>
        <p className="mt-4 max-w-[430px] text-[14px] leading-[1.62] text-muted">
          Have a project, role, or idea? Drop a line — I read every message and
          usually reply within a day or two.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-md bg-fg px-4 py-2.5 text-[13px] text-bg transition-opacity hover:opacity-85"
          >
            <MailMark />
            Send Email
          </a>
          <a
            href={profile.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-line px-4 py-2.5 text-[13px] transition-colors hover:border-line-strong"
          >
            <GitHubMark />
            GitHub
          </a>
        </div>
      </section>

      <footer className="mt-20 flex items-baseline justify-between border-t border-line pt-6 text-[12.5px] text-muted">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <a href="#main" className="transition-colors hover:text-fg">
          Back to top <span aria-hidden>↑</span>
        </a>
      </footer>
    </main>
  );
}
