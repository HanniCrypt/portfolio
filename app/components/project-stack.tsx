"use client";

import { useState } from "react";

import type { Project } from "../lib/data";

/**
 * Fan geometry and timing, measured off the reference recordings.
 *
 * Tracking the incoming card through a switch gives ~170px of travel and a
 * hard decelerate: a third of the distance in the first 33ms, 75% by 100ms,
 * and the last 8% spread over the remaining 160ms.
 */
const SLOT = 170; // px between neighbouring card centres
const CARD_W = 356; // px — the reference cards overlap heavily
/**
 * A tilted side card lifts its inner top corner by (W/2)·sinθ + (H/2)·cosθ.
 * The drop only has to be enough that the corner tucks behind the front card
 * rather than breaking its top edge — pushing it further just splays the fan
 * downward. Scaling the side cards down does most of that work, so the drop
 * stays small and the three cards read as one aligned group.
 */
const LIFT = 34;
const SIDE_SCALE = 0.86;
// Degrees of in-plane rotation per step back. Measured off the reference two
// ways that agree — fitting the side card's top edge (−15.2°) and its pill's
// principal axis (−15.7°), with the centre card returning 0.0° as a control.
const TILT = 15;
const SWITCH_MS = 330;
// Fitted against the reference curve by measurement, not picked by feel.
const SWITCH_EASE = "cubic-bezier(0.1, 0.65, 0.15, 1)";

/**
 * Hover response. The card tips away on whichever side the pointer is over —
 * measured at roughly ±2.5°, with the near edge reading ~2% shorter — and a
 * soft light tracks the pointer across its surface.
 */
const HOVER_TILT = 8; // degrees at the card's edge — pushed past the
// reference's ~2.5° deliberately, so the tilt reads clearly.

/**
 * Note: the two swapping cards briefly tilt the *same* direction mid-flight —
 * one runs −5°→0° while the other runs 0°→−5°, so both sit at negative angles
 * at once. That falls out of the slot interpolation and needs no extra motion;
 * applying a swing to the fan would drag the idle card along with it.
 */
const HOVER_MS = 140; // tilt follows the pointer quickly, unlike the switch

/**
 * The three project cards, fanned.
 *
 * Only the side cards are interactive — clicking one trades places with the
 * centre, leaving the opposite card completely still. The front card carries
 * no affordance: in the reference the pointer stays a plain arrow over it and
 * turns into a hand only on the cards behind.
 */
export function ProjectStack({ projects }: { projects: Project[] }) {
  // Which project sits in each slot, left to right. Clicking a side card
  // swaps it with the centre and leaves the opposite card alone — the
  // reference never rotates all three. Verified across six switches: the
  // untouched card holds its slot every time.
  const [slots, setSlots] = useState(() => projects.map((_, index) => index));
  const [hovered, setHovered] = useState<number | null>(null);

  const middle = Math.floor(projects.length / 2);

  function swapWithMiddle(position: number) {
    setSlots((current) => {
      const next = [...current];
      [next[position], next[middle]] = [next[middle], next[position]];
      return next;
    });
  }

  /** Writes the pointer-driven tilt and light straight onto the element. */
  function track(event: React.PointerEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--gx", `${(nx + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(ny + 0.5) * 100}%`);
    // Positive rotateY pushes the right edge back, which is what the
    // reference does when the pointer is on the right.
    el.style.setProperty("--ry", `${nx * 2 * HOVER_TILT}deg`);
    el.style.setProperty("--rx", `${ny * 2 * HOVER_TILT}deg`);
    el.style.setProperty("--glow", "1");
  }

  function untrack(event: React.PointerEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--glow", "0");
  }

  return (
    <div className="relative h-[340px] select-none">
      {projects.map((project, index) => {
        // Position in the fan, so offset −1 / 0 / +1 is left / centre / right.
        const position = slots.indexOf(index);
        const offset = position - middle;
        const isFront = offset === 0;

        const lift = hovered === index && !isFront ? 6 : 0;

        // The clicked card and the centre trade places, crossing each other.
        // The third card does not move at all.
        const bring = () => swapWithMiddle(position);

        return (
          <div
            key={project.name}
            className="absolute left-1/2 top-0"
            style={{
              transform: `translateX(-50%) translateX(${offset * SLOT}px) translateY(${Math.abs(offset) * LIFT - lift}px) rotate(${offset * TILT}deg) scale(${isFront ? 1 : SIDE_SCALE})`,
              opacity: isFront ? 1 : hovered === index ? 0.75 : 0.55,
              zIndex: isFront ? 30 : 10 - Math.abs(offset),
              transition: `transform ${SWITCH_MS}ms ${SWITCH_EASE}, opacity ${SWITCH_MS}ms ${SWITCH_EASE}`,
              // Perspective must sit on the tilt element's *direct* parent.
              // On the outer container it would not reach the inner element,
              // and rotateY would flatten to an invisible horizontal squash.
              perspective: "700px",
            }}
          >
            {/* Inner element carries the pointer tilt, so it stays instant
                while the outer element eases between slots. */}
            <div
              role={isFront ? undefined : "button"}
              tabIndex={isFront ? undefined : 0}
              aria-current={isFront ? "true" : undefined}
              aria-label={
                isFront
                  ? undefined
                  : `Show ${project.name} — ${project.summary}`
              }
              onClick={isFront ? undefined : bring}
              onKeyDown={
                isFront
                  ? undefined
                  : (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        bring();
                      }
                    }
              }
              onPointerMove={track}
              onPointerEnter={
                isFront ? undefined : () => setHovered(index)
              }
              onPointerLeave={(event) => {
                untrack(event);
                if (!isFront) setHovered(null);
              }}
              className={`relative overflow-hidden rounded-xl border border-line bg-card p-5 text-left shadow-[0_18px_40px_-24px_rgb(0_0_0/0.45)] backdrop-blur-sm ${
                isFront
                  ? "cursor-default"
                  : "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg"
              }`}
              style={{
                width: CARD_W,
                transform:
                  "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
                transition: `transform ${HOVER_MS}ms ease-out`,
              }}
            >
              {/* Light that follows the pointer across the card. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl opacity-[var(--glow,0)] transition-opacity duration-200"
                style={{
                  background:
                    "radial-gradient(circle 190px at var(--gx, 50%) var(--gy, 50%), var(--card-glow), transparent 70%)",
                }}
              />

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-fg px-2.5 py-1 text-[9.5px] font-medium uppercase tracking-[0.14em] text-bg">
                  {project.index}
                </span>
                <span className="label rounded-full border border-line px-2.5 py-1">
                  {project.year}
                </span>
                <span className="label rounded-full border border-line px-2.5 py-1">
                  {project.kind}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-md border border-line text-[11px] font-medium tracking-wide">
                  {project.initials}
                </span>
                <span>
                  <span className="label block">Featured build</span>
                  <span className="mt-1 block text-[17px] font-semibold tracking-tight">
                    {project.name}
                  </span>
                </span>
              </div>

              <p className="mt-4 text-[13px] leading-relaxed text-muted">
                {project.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-line px-2 py-1 text-[11px] text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="label mt-5 flex items-center gap-2">
                <span
                  aria-hidden
                  className={`size-1.5 rounded-full ${
                    project.status === "IN DEVELOPMENT"
                      ? "animate-pulse bg-fg"
                      : "bg-faint"
                  }`}
                />
                {project.status}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
