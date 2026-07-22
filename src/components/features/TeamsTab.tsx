"use client";

import { useMemo, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { usePlayers, useTeams, useTeamStats } from "@/hooks/useNbaData";
import type { TeamStats } from "@/lib/types";
import { cn, fmtAvg } from "@/lib/utils";

function Rating({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "danger" | "default";
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2 text-center">
      <p
        className={cn(
          "text-base font-bold tabular-nums",
          tone === "positive" ? "text-positive" : tone === "danger" ? "text-danger" : "text-text",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-faint">{label}</p>
      {hint ? <p className="mt-0.5 text-[9px] text-faint">{hint}</p> : null}
    </div>
  );
}

function TeamRatings({ stat }: { stat: TeamStats }) {
  const netTone = stat.netRating > 0 ? "positive" : stat.netRating < 0 ? "danger" : "default";
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">Team efficiency</h3>
        <span className="text-[11px] text-faint">per 100 possessions · 2025-26</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Rating label="Off Rtg" value={stat.offRating.toFixed(1)} hint="pts scored" />
        <Rating label="Def Rtg" value={stat.defRating.toFixed(1)} hint="pts allowed" />
        <Rating
          label="Net Rtg"
          value={`${stat.netRating > 0 ? "+" : ""}${stat.netRating.toFixed(1)}`}
          tone={netTone}
        />
        <Rating label="Pace" value={stat.pace.toFixed(1)} hint="poss/game" />
        <Rating label="PPG" value={fmtAvg(stat.pointsFor)} />
        <Rating label="Opp PPG" value={fmtAvg(stat.pointsAgainst)} />
      </div>
    </Card>
  );
}

export function TeamsTab() {
  const teamsQuery = useTeams();
  const playersQuery = usePlayers();
  const statsQuery = useTeamStats();
  const [picked, setPicked] = useState<string | null>(null);

  const teams = teamsQuery.data;
  const defaultId = useMemo(() => {
    if (!teams?.length) return null;
    return teams.find((t) => t.abbreviation === "ATL")?.id ?? teams[0].id;
  }, [teams]);

  const activeId = picked ?? defaultId;
  const activeTeam = teams?.find((t) => t.id === activeId) ?? null;
  const activeStat = statsQuery.data?.find((s) => s.teamId === activeId) ?? null;

  const roster = useMemo(() => {
    if (!playersQuery.data || !activeId) return [];
    return playersQuery.data
      .filter((p) => p.teamId === activeId)
      .sort((a, b) => b.stats.points - a.stats.points);
  }, [playersQuery.data, activeId]);

  const options = useMemo(
    () => (teams ?? []).map((t) => ({ value: t.id, label: t.displayName })),
    [teams],
  );

  if (teamsQuery.isError || playersQuery.isError) {
    return (
      <ErrorState
        onRetry={() => {
          teamsQuery.refetch();
          playersQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {teams ? (
          <Select
            ariaLabel="Select a team"
            value={activeId ?? ""}
            onValueChange={setPicked}
            options={options}
            className="w-full sm:w-64"
          />
        ) : (
          <div className="h-9 w-64 skeleton rounded-md" />
        )}
      </div>

      {activeTeam ? (
        <Card
          className="flex items-center gap-4 p-5"
          style={
            activeTeam.color
              ? { background: `linear-gradient(90deg, ${activeTeam.color}22, transparent)` }
              : undefined
          }
        >
          {activeTeam.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activeTeam.logo} alt="" className="h-14 w-14 object-contain" />
          ) : null}
          <div>
            <h2 className="text-lg font-semibold text-text">{activeTeam.displayName}</h2>
            <div className="mt-1 flex items-center gap-2">
              {activeTeam.standingSummary ? (
                <Badge tone="accent">{activeTeam.standingSummary}</Badge>
              ) : null}
              <span className="text-xs text-muted">{roster.length} players</span>
            </div>
          </div>
        </Card>
      ) : null}

      {activeStat ? <TeamRatings stat={activeStat} /> : null}

      {playersQuery.isLoading ? (
        <SkeletonCards count={8} />
      ) : roster.length === 0 ? (
        <EmptyState title="No roster data" hint="This team has no ranked players yet." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {roster.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}
