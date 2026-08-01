/**
 * Mock content for the portfolio homepage.
 *
 * Real: name, email, GitHub handle. Everything else is invented.
 */

export const profile = {
  name: "Roince Jumao-as",
  greeting: "Hi, I'm Roince Jumao\u2011as", // non-breaking hyphen
  email: "roincejumaoas.prsnl@gmail.com",
  github: "itsruwins",
  githubUrl: "https://github.com/itsruwins",
  blurb: [
    "Full Stack Developer & Systems Tinkerer. Building end-to-end products with TypeScript, Go, and whatever the problem actually needs.",
    "I care about the unglamorous parts — data models, latency budgets, and error states — because that is where products quietly succeed or fail.",
  ],
};

export type Role = {
  year: string;
  title: string;
  company: string;
};

export const experience: Role[] = [
  { year: "2026", title: "Senior Frontend Engineer", company: "Meridian Labs" },
  { year: "2025", title: "Full Stack Developer", company: "Northbay Systems" },
  { year: "2024", title: "Software Engineer", company: "Cordelia Interactive" },
];

export const education = {
  years: "2019 — 2023",
  degree: "Bachelor of Science in Computer Science",
  school: "Westmark Institute of Technology",
};

export const stack = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Go",
  "PostgreSQL",
  "Redis",
  "Docker",
  "TailwindCSS",
  "Prisma",
  "tRPC",
];

export type Project = {
  index: string;
  year: string;
  kind: string;
  initials: string;
  name: string;
  summary: string;
  tags: string[];
  status: "IN DEVELOPMENT" | "SHIPPED" | "ARCHIVED";
};

export const projects: Project[] = [
  {
    index: "PROJECT 03",
    year: "2024",
    kind: "CLI",
    initials: "FR",
    name: "Ferrous",
    summary:
      "Log tailer with structured query filters and a scrollback that survives restarts.",
    tags: ["Go", "Terminal"],
    status: "SHIPPED",
  },
  {
    index: "PROJECT 01",
    year: "2026",
    kind: "DEVTOOL",
    initials: "HL",
    name: "Halcyon",
    summary:
      "Local-first API client with request diffing, typed mocks, and shareable collections.",
    tags: ["Developer Tools", "Desktop"],
    status: "IN DEVELOPMENT",
  },
  {
    index: "PROJECT 02",
    year: "2025",
    kind: "REALTIME",
    initials: "TP",
    name: "Tidepool",
    summary:
      "Collaborative canvas with CRDT sync, presence, and offline replay on reconnect.",
    tags: ["Realtime", "Web App"],
    status: "SHIPPED",
  },
];

export type Certification = {
  name: string;
  issuer: string;
  /** Selects the brand mark drawn in the card's logo tile. */
  mark: "html5" | "gemini" | "ibm";
  href: string;
};

/**
 * The first entry is a real credential and its href is the live verification
 * page. The second is still a placeholder carried over from the reference
 * layout — it names a real IBM programme and its Verify link goes nowhere, so
 * replace or drop it before this goes public.
 *
 * A "gemini" mark is also registered in certification-card.tsx if a Google
 * credential is ever added back.
 */
export const certifications: Certification[] = [
  {
    name: "HTML Fundamentals",
    issuer: "CodeCred",
    mark: "html5",
    href: "https://www.codecred.dev/verify/6e8312cf-e987-4a5f-8cb3-7d694dab284a",
  },
  { name: "Data Science Tools", issuer: "IBM", mark: "ibm", href: "#" },
];
