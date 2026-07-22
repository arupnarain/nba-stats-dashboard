"use client";

import { Crown } from "lucide-react";
import { useMemo } from "react";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";
import type { Player } from "@/lib/types";

const MIN_GAMES = 20;

const CATEGORIES: { key: string; label: string; accessor: (p: Player) => number }[] = [
  { key: "pts", label: "Points", accessor: (p) => p.stats.points },
  { key: "reb", label: "Rebounds", accessor: (p) => p.stats.rebounds },
  { key: "ast", label: "Assists", accessor: (p) => p.stats.assists },
  { key: "stl", label: "Steals", accessor: (p) => p.stats.steals },
];

function LeaderTile({
  label,
  player,
  value,
}: {
  label: string;
  player: Player;
  value: number;
}) {
  const animated = useCountUp(value);
  return (
    <Card className="flex items-center gap-3 p-3">
      <Avatar
        src={player.headshot}
        alt={player.name}
        fallback={initials(player.name)}
        size={44}
        rounded={false}
        className="bg-surface-2"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-faint">
          <Crown className="h-3 w-3 text-gold" />
          {label} leader
        </p>
        <p className="truncate text-sm font-semibold text-text">{player.name}</p>
        <p className="truncate text-xs text-muted">{player.teamAbbr}</p>
      </div>
      <span className="text-xl font-bold tabular-nums text-gold">
        {animated.toFixed(1)}
      </span>
    </Card>
  );
}

export function StatLeaderTiles({ players }: { players: Player[] }) {
  const leaders = useMemo(() => {
    const eligible = players.filter((p) => p.stats.gamesPlayed >= MIN_GAMES);
    return CATEGORIES.map((cat) => {
      let best: Player | null = null;
      let bestVal = -Infinity;
      for (const p of eligible) {
        const v = cat.accessor(p);
        if (v > bestVal) {
          bestVal = v;
          best = p;
        }
      }
      return best ? { label: cat.label, player: best, value: bestVal, key: cat.key } : null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [players]);

  if (leaders.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {leaders.map((l) => (
        <LeaderTile key={l.key} label={l.label} player={l.player} value={l.value} />
      ))}
    </div>
  );
}
