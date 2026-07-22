/**
 * Low-level ESPN access layer.
 *
 * ESPN's public endpoints are keyless today. If that changed, the API key
 * would be injected here (server-side only) and never reach the browser —
 * which is the entire reason every request is proxied through our own
 * Next.js route handlers rather than called directly from the client.
 */

const SITE = "https://site.api.espn.com/apis/site/v2/sports/basketball";
const WEB = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba";

/** Default upstream cache lifetime (seconds). Stats change at most daily. */
export const DEFAULT_REVALIDATE = 60 * 30;

export const endpoints = {
  news: (league: string) => `${SITE}/${league}/news`,
  injuries: () => `${SITE}/nba/injuries`,
  draft: () => `${SITE}/nba/draft`,
  teams: () => `${SITE}/nba/teams`,
  byAthlete: (page: number, limit: number) =>
    `${WEB}/statistics/byathlete?page=${page}&limit=${limit}`,
} as const;

export class EspnError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "EspnError";
  }
}

/**
 * Fetch + parse JSON from ESPN with a hard timeout and Next.js caching.
 * Returns `unknown` on purpose — callers must narrow via a mapper.
 */
export async function espnFetch(
  url: string,
  revalidate: number = DEFAULT_REVALIDATE,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      next: { revalidate },
    });
    if (!res.ok) {
      throw new EspnError(`Upstream ${res.status} for ${url}`, res.status);
    }
    return (await res.json()) as unknown;
  } catch (err) {
    if (err instanceof EspnError) throw err;
    const message = err instanceof Error ? err.message : "unknown error";
    throw new EspnError(`Failed to reach upstream: ${message}`, 502);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * The per-athlete statistics endpoint is paginated (~578 players). Pull every
 * page server-side and hand the frontend one clean array, so the client can
 * search / sort / rank entirely in memory with zero extra round-trips.
 */
export async function espnFetchAllAthletes(
  revalidate: number = DEFAULT_REVALIDATE,
): Promise<unknown[]> {
  const PAGE_SIZE = 50;
  const first = (await espnFetch(
    endpoints.byAthlete(1, PAGE_SIZE),
    revalidate,
  )) as { pagination?: { pages?: number }; athletes?: unknown[] };

  const pages = Math.min(first.pagination?.pages ?? 1, 20);
  const all: unknown[] = [...(first.athletes ?? [])];

  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        espnFetch(endpoints.byAthlete(i + 2, PAGE_SIZE), revalidate) as Promise<{
          athletes?: unknown[];
        }>,
      ),
    );
    for (const page of rest) all.push(...(page.athletes ?? []));
  }
  return all;
}
