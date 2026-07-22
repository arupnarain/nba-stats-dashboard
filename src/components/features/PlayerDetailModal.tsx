"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, initials } from "@/components/ui/Avatar";
import { useCountUp } from "@/hooks/useCountUp";
import type { Player } from "@/lib/types";
import { fmtAvg, fmtPct } from "@/lib/utils";

function CountStat({ label, value, decimals = 1 }: { label: string; value: number; decimals?: number }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-2 py-2.5">
      <span className="text-lg font-bold tabular-nums text-text">
        {animated.toFixed(decimals)}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-faint">{label}</span>
    </div>
  );
}

function ShootingBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-text">{fmtPct(pct)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function PlayerDetailModal({ player }: { player: Player }) {
  const { stats } = player;
  const chartData = [
    { label: "PTS", value: stats.points },
    { label: "REB", value: stats.rebounds },
    { label: "AST", value: stats.assists },
    { label: "STL", value: stats.steals },
    { label: "BLK", value: stats.blocks },
  ];

  return (
    <div>
      {/* Identity header */}
      <div
        className="flex items-center gap-4 p-5"
        style={{
          background: "linear-gradient(120deg, var(--color-surface-2), transparent)",
        }}
      >
        <Avatar
          src={player.headshot}
          alt={player.name}
          fallback={initials(player.name)}
          size={72}
          rounded={false}
        />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-text">{player.name}</h2>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            {player.teamLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.teamLogo} alt="" className="h-4 w-4 object-contain" />
            ) : null}
            <span>{player.teamName || "Free agent"}</span>
            <span className="text-faint">•</span>
            <span>{player.position}</span>
            {player.age ? <span className="text-faint">• {player.age} yrs</span> : null}
          </div>
          <p className="mt-1 text-xs text-faint">
            {stats.gamesPlayed} games · {fmtAvg(stats.minutes)} min · 2025-26
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 pt-2">
        {/* Headline averages */}
        <div className="grid grid-cols-4 gap-2">
          <CountStat label="PTS" value={stats.points} />
          <CountStat label="REB" value={stats.rebounds} />
          <CountStat label="AST" value={stats.assists} />
          <CountStat label="MIN" value={stats.minutes} />
        </div>

        {/* Per-game production */}
        <div>
          <p className="mb-1 text-xs font-medium text-muted">Per-game production</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
              barCategoryGap={5}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={36}
                tick={{ fill: "var(--color-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16} isAnimationActive>
                {chartData.map((d) => (
                  <Cell key={d.label} fill="var(--color-accent)" />
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
        </div>

        {/* Shooting splits */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-muted">Shooting splits</p>
          <ShootingBar label="Field goal %" pct={stats.fieldGoalPct} />
          <ShootingBar label="3-point %" pct={stats.threePointPct} />
          <ShootingBar label="Free throw %" pct={stats.freeThrowPct} />
        </div>
      </div>
    </div>
  );
}
