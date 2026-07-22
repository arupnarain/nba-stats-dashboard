import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapTeamStats } from "@/lib/espn/mappers";

export const revalidate = 3600;

export async function GET() {
  try {
    const raw = await espnFetch(endpoints.byTeam(), revalidate);
    const stats = mapTeamStats(raw);
    return Response.json(
      { stats },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load team stats" }, { status });
  }
}
