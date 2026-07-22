import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapTeams } from "@/lib/espn/mappers";

export const revalidate = 86400; // team metadata is effectively static

export async function GET() {
  try {
    const raw = await espnFetch(endpoints.teams(), revalidate);
    const teams = mapTeams(raw);
    return Response.json(
      { teams },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load teams" }, { status });
  }
}
