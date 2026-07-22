"use client";

import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { StatLeaderTiles } from "./StatLeaderTiles";
import { Select } from "@/components/ui/Select";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { usePlayers } from "@/hooks/useNbaData";
import type { Player } from "@/lib/types";

const MAX_VISIBLE = 60;

const SORTS: { value: string; label: string; accessor: (p: Player) => number }[] = [
  { value: "points", label: "Points", accessor: (p) => p.stats.points },
  { value: "rebounds", label: "Rebounds", accessor: (p) => p.stats.rebounds },
  { value: "assists", label: "Assists", accessor: (p) => p.stats.assists },
  { value: "steals", label: "Steals", accessor: (p) => p.stats.steals },
  { value: "blocks", label: "Blocks", accessor: (p) => p.stats.blocks },
  { value: "threePointPct", label: "3-point %", accessor: (p) => p.stats.threePointPct },
  { value: "minutes", label: "Minutes", accessor: (p) => p.stats.minutes },
];

const POSITIONS: Segment<string>[] = [
  { value: "all", label: "All" },
  { value: "G", label: "G" },
  { value: "F", label: "F" },
  { value: "C", label: "C" },
];

export function PlayersTab() {
  const { data: players, isLoading, isError, refetch } = usePlayers();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("points");
  const [position, setPosition] = useState("all");
  // Deferred value keeps typing responsive: filtering 578 players runs against
  // the deferred query so keystrokes never block on the re-render.
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (!players) return [];
    const q = deferredQuery.trim().toLowerCase();
    const accessor = SORTS.find((s) => s.value === sortKey)?.accessor ?? SORTS[0].accessor;
    return players
      .filter((p) => {
        if (position !== "all" && !p.position.includes(position)) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          p.teamAbbr.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => accessor(b) - accessor(a));
  }, [players, deferredQuery, sortKey, position]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  return (
    <div className="space-y-5">
      {players ? <StatLeaderTiles players={players} /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players or teams…"
            className="h-9 w-full rounded-md border border-line bg-surface-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="Filter by position"
            value={position}
            onChange={setPosition}
            segments={POSITIONS}
          />
          <Select
            ariaLabel="Sort by"
            value={sortKey}
            onValueChange={setSortKey}
            options={SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))}
            className="w-40"
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonCards count={12} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState title="No players found" hint="Try a different name, team, or position." />
      ) : (
        <>
          <p className="text-xs text-faint">
            Showing {visible.length} of {filtered.length} · 2025-26 season averages · tap a
            card for full stats
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
