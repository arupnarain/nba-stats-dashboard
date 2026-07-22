"use client";

import { useMemo, useState } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { SkeletonCards } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { usePlayers } from "@/hooks/useNbaData";
import { playerTS, qualified, radarProfile } from "@/lib/playerAnalytics";
import { effectiveFgPct } from "@/lib/analytics";
import type { Player } from "@/lib/types";
import { cn, fmtAvg, fmtPct } from "@/lib/utils";

const A_COLOR = "#f0803c";
const B_COLOR = "#5b9bd5";

interface Row {
  label: string;
  a: number;
  b: number;
  fmt: (n: number) => string;
  lowerIsBetter?: boolean;
}

function buildRows(a: Player, b: Player): Row[] {
  return [
    { label: "Points", a: a.stats.points, b: b.stats.points, fmt: fmtAvg },
    { label: "Rebounds", a: a.stats.rebounds, b: b.stats.rebounds, fmt: fmtAvg },
    { label: "Assists", a: a.stats.assists, b: b.stats.assists, fmt: fmtAvg },
    { label: "Steals", a: a.stats.steals, b: b.stats.steals, fmt: fmtAvg },
    { label: "Blocks", a: a.stats.blocks, b: b.stats.blocks, fmt: fmtAvg },
    { label: "True Shooting %", a: playerTS(a), b: playerTS(b), fmt: fmtPct },
    {
      label: "Effective FG %",
      a: effectiveFgPct(a.stats.fgMade, a.stats.threeMade, a.stats.fgAtt),
      b: effectiveFgPct(b.stats.fgMade, b.stats.threeMade, b.stats.fgAtt),
      fmt: fmtPct,
    },
    { label: "Turnovers", a: a.stats.turnovers, b: b.stats.turnovers, fmt: fmtAvg, lowerIsBetter: true },
    { label: "Minutes", a: a.stats.minutes, b: b.stats.minutes, fmt: fmtAvg },
  ];
}

function PlayerPicker({
  label,
  color,
  value,
  onChange,
  options,
  player,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  player: Player | null;
}) {
  return (
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: color }} />
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <Select ariaLabel={label} value={value} onValueChange={onChange} options={options} />
      {player ? (
        <div className="flex items-center gap-2 pt-1">
          <Avatar
            src={player.headshot}
            alt={player.name}
            fallback={initials(player.name)}
            size={34}
            rounded={false}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{player.name}</p>
            <p className="truncate text-[11px] text-faint">
              {player.teamAbbr} · {player.position}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CompareTab() {
  const { data: players, isLoading, isError, refetch } = usePlayers();
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);

  const pool = useMemo(() => {
    const q = qualified(players ?? []);
    return [...q].sort((x, y) => y.stats.points - x.stats.points);
  }, [players]);

  const options = useMemo(
    () => pool.map((p) => ({ value: p.id, label: `${p.name} (${p.teamAbbr})` })),
    [pool],
  );

  const defaultA = pool[0]?.id ?? null;
  const defaultB = pool[1]?.id ?? null;
  const activeAId = aId ?? defaultA;
  const activeBId = bId ?? defaultB;
  const a = pool.find((p) => p.id === activeAId) ?? null;
  const b = pool.find((p) => p.id === activeBId) ?? null;

  const radarData = useMemo(() => {
    if (!a || !b) return [];
    const ra = radarProfile(a, pool);
    const rb = radarProfile(b, pool);
    return ra.map((ax, i) => ({ axis: ax.axis, A: ax.value, B: rb[i]?.value ?? 0 }));
  }, [a, b, pool]);

  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !a || !b) return <SkeletonCards count={4} />;

  const rows = buildRows(a, b);

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex flex-col gap-4 pt-5 sm:flex-row">
          <PlayerPicker
            label="Player A"
            color={A_COLOR}
            value={activeAId ?? ""}
            onChange={setAId}
            options={options}
            player={a}
          />
          <PlayerPicker
            label="Player B"
            color={B_COLOR}
            value={activeBId ?? ""}
            onChange={setBId}
            options={options}
            player={b}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <p className="mt-0.5 text-xs text-faint">percentile vs qualified players</p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="var(--color-line)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={a.lastName || a.name}
                  dataKey="A"
                  stroke={A_COLOR}
                  fill={A_COLOR}
                  fillOpacity={0.25}
                  isAnimationActive={false}
                />
                <Radar
                  name={b.lastName || b.name}
                  dataKey="B"
                  stroke={B_COLOR}
                  fill={B_COLOR}
                  fillOpacity={0.25}
                  isAnimationActive={false}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Head-to-head</CardTitle>
            <p className="mt-0.5 text-xs text-faint">per-game averages · better mark highlighted</p>
          </CardHeader>
          <CardBody>
            <table className="w-full text-sm">
              <tbody>
                {rows.map((r) => {
                  const aWins = r.lowerIsBetter ? r.a < r.b : r.a > r.b;
                  const bWins = r.lowerIsBetter ? r.b < r.a : r.b > r.a;
                  return (
                    <tr key={r.label} className="border-b border-line last:border-0">
                      <td
                        className={cn(
                          "w-[30%] py-2 text-left tabular-nums",
                          aWins ? "font-semibold text-positive" : "text-muted",
                        )}
                      >
                        {r.fmt(r.a)}
                      </td>
                      <td className="py-2 text-center text-xs text-faint">{r.label}</td>
                      <td
                        className={cn(
                          "w-[30%] py-2 text-right tabular-nums",
                          bWins ? "font-semibold text-positive" : "text-muted",
                        )}
                      >
                        {r.fmt(r.b)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
