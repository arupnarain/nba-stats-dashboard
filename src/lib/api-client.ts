/**
 * Typed client for our own proxy routes. Components call these — never ESPN,
 * and never `fetch` directly. Each function returns a fully-typed domain model.
 */

import type {
  DraftPick,
  GameLogEntry,
  NewsArticle,
  NewsLeague,
  Player,
  Team,
  TeamInjuryReport,
  TeamStats,
} from "@/lib/types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export const api = {
  players: () => getJson<{ players: Player[] }>("/api/players").then((d) => d.players),
  teams: () => getJson<{ teams: Team[] }>("/api/teams").then((d) => d.teams),
  injuries: () =>
    getJson<{ reports: TeamInjuryReport[] }>("/api/injuries").then((d) => d.reports),
  news: (league: NewsLeague) =>
    getJson<{ articles: NewsArticle[] }>(`/api/news?league=${league}`).then((d) => d.articles),
  draft: () => getJson<{ picks: DraftPick[] }>("/api/draft").then((d) => d.picks),
  gameLog: (id: string) =>
    getJson<{ games: GameLogEntry[] }>(`/api/players/${id}/gamelog`).then((d) => d.games),
  teamStats: () => getJson<{ stats: TeamStats[] }>("/api/team-stats").then((d) => d.stats),
};
