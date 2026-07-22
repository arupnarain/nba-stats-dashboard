"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { NewsLeague } from "@/lib/types";

export function usePlayers() {
  return useQuery({ queryKey: ["players"], queryFn: api.players });
}

export function useTeams() {
  return useQuery({ queryKey: ["teams"], queryFn: api.teams });
}

export function useInjuries() {
  return useQuery({ queryKey: ["injuries"], queryFn: api.injuries });
}

export function useNews(league: NewsLeague) {
  return useQuery({ queryKey: ["news", league], queryFn: () => api.news(league) });
}

export function useDraft() {
  return useQuery({ queryKey: ["draft"], queryFn: api.draft });
}

/** Game log is fetched lazily — only when a player's modal is open. */
export function usePlayerGameLog(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["gamelog", id],
    queryFn: () => api.gameLog(id),
    enabled,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTeamStats() {
  return useQuery({ queryKey: ["team-stats"], queryFn: api.teamStats });
}
