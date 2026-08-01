import { getContributions, type ContributionDay } from "../lib/github";
import { profile } from "../lib/data";

/**
 * Thresholds taken from the quartiles of the *active* days, the way GitHub
 * scales its own graph. Scaling against the maximum instead lets a single
 * outlier flatten everything: with one 15-contribution day, every 1–3 day
 * collapses into the smallest bucket and the graph reads as empty.
 */
function thresholds(counts: number[]): [number, number, number] {
  const active = counts.filter((n) => n > 0).sort((a, b) => a - b);
  if (!active.length) return [1, 2, 3];
  const at = (f: number) => active[Math.floor(f * (active.length - 1))];
  return [at(0.25), at(0.5), at(0.75)];
}

/** Five steps: empty, then four sizes. */
function level(count: number, [t1, t2, t3]: [number, number, number]): number {
  if (count === 0) return 0;
  if (count <= t1) return 1;
  if (count <= t2) return 2;
  if (count <= t3) return 3;
  return 4;
}

/**
 * Contributions are encoded by dot *size*, not colour. Measured off the
 * reference: every non-zero day is the same solid foreground and only the
 * diameter grows — 5 / 7 / 9 / 11px on a 12px pitch — while empty days are a
 * 2px speck at low opacity.
 */
/**
 * Dot size as a percentage of its cell, so the 53 columns always divide the
 * available width exactly. A fixed pixel pitch cannot do this: at 592px it
 * fit, but the same grid overflowed a 342px phone column by 240px and
 * `overflow-hidden` quietly clipped the most recent months.
 */
const DIAMETER_PCT = [18, 41, 59, 77, 91];

/**
 * Tooltip text, worded the way GitHub words its own: the unit spelled out and
 * pluralised, and a date a person would read.
 *
 * Formatted in UTC on purpose. The API returns a plain YYYY-MM-DD, which
 * `new Date` reads as UTC midnight; letting the server's own zone format it
 * would print the previous day anywhere west of Greenwich, so a Manila commit
 * could show up labelled with the wrong date.
 */
function dayLabel({ count, date }: ContributionDay): string {
  const when = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (count === 0) return `No contributions on ${when}`;
  return `${count} contribution${count === 1 ? "" : "s"} on ${when}`;
}
const EMPTY_OPACITY = 0.12;
const FILLED_OPACITY = 0.9;

export async function ContributionGraph() {
  const calendar = await getContributions();
  const steps = thresholds(calendar.weeks.flat().map((day) => day.count));

  return (
    <section aria-labelledby="github-heading">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 id="github-heading" className="label">
          GitHub
        </h2>
        <a
          href={profile.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label transition-colors hover:text-fg"
        >
          @{profile.github} <span aria-hidden>↗</span>
        </a>
      </div>

      <div
        className="flex w-full"
        role="img"
        aria-label={`${calendar.total} GitHub contributions in the last year`}
      >
        {calendar.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex min-w-0 flex-1 flex-col">
            {week.map((day) => {
              const step = level(day.count, steps);
              const size = `${DIAMETER_PCT[step]}%`;
              return (
                <span
                  key={day.date}
                  title={dayLabel(day)}
                  className="grid aspect-square w-full place-items-center"
                >
                  <span
                    className="block rounded-full bg-fg"
                    style={{
                      width: size,
                      height: size,
                      opacity: step === 0 ? EMPTY_OPACITY : FILLED_OPACITY,
                    }}
                  />
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <p className="label mt-4">
        {calendar.total.toLocaleString("en-US")} contributions in the last year
        {calendar.synthetic ? " (sample data)" : ""}
      </p>
    </section>
  );
}
