"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { usePlayers } from "@/hooks/useNbaData";
import type { LeaderCategory, Player } from "@/lib/types";
import { fmtAvg } from "@/lib/utils";

const CATEGORIES: (Segment<LeaderCategory> & { accessor: (p: Player) => number })[] = [
  { value: "points", label: "Points", accessor: (p) => p.stats.points },
  { value: "rebounds", label: "Rebounds", accessor: (p) => p.stats.rebounds },
  { value: "assists", label: "Assists", accessor: (p) => p.stats.assists },
  { value: "steals", label: "Steals", accessor: (p) => p.stats.steals },
  { value: "blocks", label: "Blocks", accessor: (p) => p.stats.blocks },
];

const TOP_N = 15;
const MIN_GAMES = 20; // filter out small-sample outliers

interface Row {
  name: string;
  short: string;
  team: string;
  value: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Row }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-text">{row.name}</p>
      <p className="text-muted">
        {row.team} · <span className="tabular-nums text-text">{fmtAvg(row.value)}</span> per game
      </p>
    </div>
  );
}

export function LeadersTab() {
  const { data: players, isLoading, isError, refetch } = usePlayers();
  const [category, setCategory] = useState<LeaderCategory>("points");

  const active = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];

  const rows = useMemo<Row[]>(() => {
    if (!players) return [];
    return players
      .filter((p) => p.stats.gamesPlayed >= MIN_GAMES)
      .map((p) => ({
        name: p.name,
        short: p.lastName || p.name,
        team: p.teamAbbr || "FA",
        value: active.accessor(p),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, TOP_N);
  }, [players, active]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>League Leaders</CardTitle>
          <p className="mt-0.5 text-xs text-faint">
            Top {TOP_N} · 2025-26 · min {MIN_GAMES} games played
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Statistic"
          value={category}
          onChange={setCategory}
          segments={CATEGORIES}
        />
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-[480px] w-full" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <ResponsiveContainer width="100%" height={480}>
            <BarChart
              layout="vertical"
              data={rows}
              margin={{ top: 4, right: 44, bottom: 4, left: 8 }}
              barCategoryGap={6}
            >
              <CartesianGrid
                horizontal={false}
                stroke="var(--color-line)"
                strokeDasharray="3 3"
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="short"
                width={92}
                tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "var(--color-surface-2)" }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                {rows.map((row) => (
                  <Cell key={row.name} fill="var(--color-accent)" />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v) => fmtAvg(Number(v) || 0)}
                  fill="var(--color-text)"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  );
}
