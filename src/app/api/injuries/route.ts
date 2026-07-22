import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapInjuries } from "@/lib/espn/mappers";

export const revalidate = 1800;

export async function GET() {
  try {
    const raw = await espnFetch(endpoints.injuries(), revalidate);
    const reports = mapInjuries(raw);
    return Response.json(
      { reports },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load injuries" }, { status });
  }
}
