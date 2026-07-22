"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { usePlayers } from "@/hooks/useNbaData";

const MAX_VISIBLE = 60;

export function PlayersTab() {
  const { data: players, isLoading, isError, refetch } = usePlayers();
  const [query, setQuery] = useState("");
  // Deferred value keeps typing responsive: filtering 578 players runs against
  // the deferred query so keystrokes never block on the re-render.
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!players) return [];
    const q = deferredQuery.trim().toLowerCase();
    const base = q
      ? players.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.teamName.toLowerCase().includes(q) ||
            p.teamAbbr.toLowerCase().includes(q),
        )
      : players;
    return [...base].sort((a, b) => b.stats.points - a.stats.points);
  }, [players, deferredQuery]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players or teams…"
            className="h-9 w-full rounded-md border border-line bg-surface-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent/50"
          />
        </div>
        {players ? (
          <p className="text-xs text-faint">
            Showing {visible.length} of {filtered.length}
            {" · 2025-26 season averages"}
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <SkeletonCards count={12} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState title="No players found" hint="Try a different name or team." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
