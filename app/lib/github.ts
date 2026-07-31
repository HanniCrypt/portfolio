import "server-only";

import { mulberry32 } from "./rng";

export type ContributionDay = {
  date: string;
  count: number;
};

export type ContributionCalendar = {
  total: number;
  /** Column-major: one array per week, each 1–7 days, Sunday first. */
  weeks: ContributionDay[][];
  /** Highest single-day count, used to scale the colour ramp. */
  max: number;
  /** True when the token was missing or the request failed. */
  synthetic: boolean;
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount }
        }
      }
    }
  }
}`;

type GraphQLResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: { date: string; contributionCount: number }[];
          }[];
        };
      };
    } | null;
  };
  errors?: { message: string }[];
};

/**
 * Real contribution calendar for GITHUB_LOGIN.
 *
 * Runs on the server only — the token never reaches the browser. Falls back to
 * a deterministic synthetic calendar so the page still renders when the token
 * is absent or expired.
 */
export async function getContributions(): Promise<ContributionCalendar> {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_LOGIN;

  if (!token || !login) return syntheticCalendar();

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return syntheticCalendar();

    const json = (await res.json()) as GraphQLResponse;
    const calendar =
      json.data?.user?.contributionsCollection.contributionCalendar;
    if (json.errors?.length || !calendar) return syntheticCalendar();

    const weeks = calendar.weeks.map((week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
      })),
    );

    return {
      total: calendar.totalContributions,
      weeks,
      max: Math.max(1, ...weeks.flat().map((day) => day.count)),
      synthetic: false,
    };
  } catch {
    return syntheticCalendar();
  }
}

/** Deterministic stand-in with a plausible weekday/weekend rhythm. */
function syntheticCalendar(): ContributionCalendar {
  const random = mulberry32(20260731);
  const weeks: ContributionDay[][] = [];
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 371 - start.getUTCDay());

  let total = 0;
  for (let week = 0; week < 53; week++) {
    const days: ContributionDay[] = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + week * 7 + day);
      if (date.getTime() > Date.now()) break;

      const weekend = day === 0 || day === 6;
      const roll = random();
      let count = 0;
      if (roll > (weekend ? 0.78 : 0.42)) {
        count = 1 + Math.floor(random() * (weekend ? 4 : 11));
      }
      total += count;
      days.push({ date: date.toISOString().slice(0, 10), count });
    }
    if (days.length) weeks.push(days);
  }

  return {
    total,
    weeks,
    max: Math.max(1, ...weeks.flat().map((day) => day.count)),
    synthetic: true,
  };
}
