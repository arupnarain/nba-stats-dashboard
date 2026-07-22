import type { NextRequest } from "next/server";
import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapNews } from "@/lib/espn/mappers";
import type { NewsLeague } from "@/lib/types";

export const revalidate = 900;

const ALLOWED: Record<NewsLeague, true> = {
  nba: true,
  "nba-summer-las-vegas": true,
  "nba-development": true,
};

function resolveLeague(value: string | null): NewsLeague {
  return value && value in ALLOWED ? (value as NewsLeague) : "nba";
}

export async function GET(request: NextRequest) {
  const league = resolveLeague(request.nextUrl.searchParams.get("league"));
  try {
    const raw = await espnFetch(endpoints.news(league), revalidate);
    const articles = mapNews(raw);
    return Response.json(
      { articles, league },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load news" }, { status });
  }
}
