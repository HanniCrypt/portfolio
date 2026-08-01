"use client";

import type { Certification } from "../lib/data";

/**
 * Certification card, matching the reference's treatment.
 *
 * Geometry and motion read off its computed styles rather than eyeballed:
 * a 900px perspective, rotateY of nx·10° and rotateX of −ny·8° (so ±5°/±4°
 * at the edges), a 5px lift on hover, and border/shadow easing over 220ms on
 * cubic-bezier(0.22, 1, 0.36, 1). The glow is a radial gradient parked at the
 * pointer that fades in over 300ms.
 */
const TILT_Y = 10; // degrees across the full width
const TILT_X = 8; // degrees across the full height
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function track(event: React.PointerEvent<HTMLLIElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const nx = (event.clientX - rect.left) / rect.width - 0.5;
  const ny = (event.clientY - rect.top) / rect.height - 0.5;
  el.style.setProperty("--tilt-y", `${nx * TILT_Y}deg`);
  el.style.setProperty("--tilt-x", `${-ny * TILT_X}deg`);
  el.style.setProperty("--gx", `${(nx + 0.5) * 100}%`);
  el.style.setProperty("--gy", `${(ny + 0.5) * 100}%`);
}

function untrack(event: React.PointerEvent<HTMLLIElement>) {
  const el = event.currentTarget;
  el.style.setProperty("--tilt-y", "0deg");
  el.style.setProperty("--tilt-x", "0deg");
}

/** The Gemini mark: a four-point star on Google's brand gradient. */
function GeminiMark() {
  return (
    <svg className="size-7" viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient
          id="gemini-mark"
          x1="5"
          y1="27"
          x2="27"
          y2="5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#34A853" />
          <stop offset="0.32" stopColor="#4285F4" />
          <stop offset="0.66" stopColor="#9B72CB" />
          <stop offset="1" stopColor="#EA4335" />
        </linearGradient>
      </defs>
      <path
        d="M16 3C17.2 10.9 21.1 14.8 29 16C21.1 17.2 17.2 21.1 16 29C14.8 21.1 10.9 17.2 3 16C10.9 14.8 14.8 10.9 16 3Z"
        fill="url(#gemini-mark)"
      />
    </svg>
  );
}

/**
 * IBM's striped wordmark, built the way the reference does it: the letters are
 * transparent and a repeating horizontal gradient is clipped to them, so the
 * stripes come free with no image asset.
 */
function IbmMark() {
  return (
    <span
      aria-hidden
      className="bg-[repeating-linear-gradient(to_bottom,#0f62fe_0,#0f62fe_2px,transparent_2px,transparent_4px)] bg-clip-text font-mono text-[1.05rem] font-bold leading-none tracking-[-0.08em] text-transparent"
    >
      IBM
    </span>
  );
}

function ArrowMark() {
  return (
    <svg
      className="size-2 shrink-0 opacity-70"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 1.5H10.5V8.5M10.5 1.5L1.5 10.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const marks = { gemini: GeminiMark, ibm: IbmMark };

export function CertificationCard({ cert }: { cert: Certification }) {
  const Mark = marks[cert.mark];

  return (
    <li
      onPointerMove={track}
      onPointerLeave={untrack}
      // The lift is pure CSS so it eases back out on its own; only the tilt and
      // glow, which need the pointer's position, are written from JS.
      // Written out literally, not interpolated: Tailwind scans the source as
      // text, so a class name built from a variable is never generated.
      className="group relative flex min-h-48 flex-col items-center overflow-hidden rounded-2xl border border-line bg-card px-4 py-5 text-center shadow-[0_8px_24px_rgb(10_10_10/0.04)] transition-[transform,border-color,box-shadow] duration-[220ms] hover:border-line-strong hover:shadow-[0_24px_64px_rgb(10_10_10/0.13)] hover:[--lift:-5px] focus-within:border-line-strong focus-within:[--lift:-5px] dark:shadow-[0_8px_24px_rgb(0_0_0/0.18)] dark:hover:shadow-[0_24px_64px_rgb(0_0_0/0.4)]"
      style={{
        transform:
          "perspective(900px) translateY(var(--lift, 0px)) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))",
        transformStyle: "preserve-3d",
        transitionTimingFunction: EASE,
      }}
    >
      {/* Glow that follows the pointer, fading in over 300ms. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), color-mix(in srgb, var(--fg) 7%, transparent), transparent 42%)",
        }}
      />

      <div className="relative z-[1] mb-5 grid size-11 place-items-center rounded-xl border border-line bg-bg shadow-[0_1px_2px_rgb(10_10_10/0.035)]">
        <Mark />
      </div>

      <h3 className="relative z-[1] max-w-[16rem] text-[14px] font-medium leading-[1.35] tracking-[-0.02em]">
        {cert.name}
      </h3>

      <p className="relative z-[1] mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        {cert.issuer}
      </p>

      <a
        href={cert.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Verify ${cert.name} from ${cert.issuer}`}
        className="relative z-[1] mt-auto inline-flex items-center gap-1.5 pt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition-colors duration-200 hover:text-fg focus-visible:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
      >
        Verify
        <ArrowMark />
      </a>
    </li>
  );
}
