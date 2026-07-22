import type { NextRequest } from "next/server";
import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapPlayerSeasons } from "@/lib/espn/mappers";

export const revalidate = 3600;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "Invalid player id" }, { status: 400 });
  }
  try {
    const raw = await espnFetch(endpoints.athleteStats(id), revalidate);
    const seasons = mapPlayerSeasons(raw);
    return Response.json(
      { seasons },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load player stats" }, { status });
  }
}
