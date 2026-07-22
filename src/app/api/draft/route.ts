import { endpoints, espnFetch, EspnError } from "@/lib/espn/client";
import { mapDraft } from "@/lib/espn/mappers";

export const revalidate = 86400; // a completed draft doesn't change

export async function GET() {
  try {
    const raw = await espnFetch(endpoints.draft(), revalidate);
    const picks = mapDraft(raw);
    return Response.json(
      { picks },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } },
    );
  } catch (err) {
    const status = err instanceof EspnError ? 502 : 500;
    return Response.json({ error: "Failed to load draft" }, { status });
  }
}
