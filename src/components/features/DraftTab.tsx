"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useDraft, useTeams } from "@/hooks/useNbaData";
import type { DraftPick } from "@/lib/types";

interface TeamMeta {
  abbr: string;
  logo: string | null;
  name: string;
}

function DraftRow({ pick, team }: { pick: DraftPick; team: TeamMeta | undefined }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <span className="w-8 shrink-0 text-center text-lg font-bold tabular-nums text-accent">
        {pick.overall}
      </span>
      <Avatar
        src={pick.headshot}
        alt={pick.playerName}
        fallback={initials(pick.playerName)}
        size={44}
        rounded={false}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={pick.link || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-semibold text-text hover:text-accent"
          >
            {pick.playerName}
          </a>
          {pick.traded ? <Badge tone="warn">Traded</Badge> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {[pick.collegeName || pick.collegeAbbr, pick.height, pick.weight]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {team?.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo} alt="" className="h-6 w-6 object-contain" />
        ) : null}
        <span className="w-9 text-right text-xs font-medium text-muted">
          {team?.abbr ?? ""}
        </span>
      </div>
    </li>
  );
}

export function DraftTab() {
  const { data: picks, isLoading, isError, refetch } = useDraft();
  const { data: teams } = useTeams();

  const teamMap = useMemo(() => {
    const map = new Map<string, TeamMeta>();
    for (const t of teams ?? []) {
      map.set(t.id, { abbr: t.abbreviation, logo: t.logo, name: t.displayName });
    }
    return map;
  }, [teams]);

  const rounds = useMemo(() => {
    const byRound = new Map<number, DraftPick[]>();
    for (const p of picks ?? []) {
      const list = byRound.get(p.round) ?? [];
      list.push(p);
      byRound.set(p.round, list);
    }
    return [...byRound.entries()].sort((a, b) => a[0] - b[0]);
  }, [picks]);

  if (isLoading) return <Skeleton className="h-[600px] w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!picks || picks.length === 0) {
    return <EmptyState title="No draft data available" />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-faint">2026 NBA Draft · {picks.length} selections</p>
      {rounds.map(([round, roundPicks]) => (
        <Card key={round} className="overflow-hidden">
          <div className="border-b border-line px-5 py-3">
            <h3 className="text-sm font-semibold text-text">Round {round}</h3>
          </div>
          <ul className="divide-y divide-line">
            {roundPicks.map((p) => (
              <DraftRow key={`${p.round}-${p.pick}`} pick={p} team={teamMap.get(p.teamId)} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
