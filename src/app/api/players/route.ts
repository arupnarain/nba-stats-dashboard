import { espnFetchAllAthletes, EspnError } from "@/lib/espn/client";
import { mapPlayers } from "@/lib/espn/mappers";

// Cache the fully-aggregated player list at the edge for 30 min.
export const revalidate = 1800;

export async function GET() {
  try {
    const raw = await espnFetchAllAthletes();
    const players = mapPlayers(raw);
    return Response.json(
      { players, count: players.length },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load players" }, { status });
  }
}
