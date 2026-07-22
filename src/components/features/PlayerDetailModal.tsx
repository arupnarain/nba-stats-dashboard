"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { usePlayerGameLog } from "@/hooks/useNbaData";
import {
  effectiveFgPct,
  shotDiet as computeShotDiet,
  trueShootingPct,
} from "@/lib/analytics";
import type { GameLogEntry, Player } from "@/lib/types";
import { fmtAvg, fmtPct, fmtShortDate } from "@/lib/utils";

const RECENT_GAMES = 12;

function CountStat({ label, value }: { label: string; value: number }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-2 py-2.5">
      <span className="text-lg font-bold tabular-nums text-text">{animated.toFixed(1)}</span>
      <span className="text-[10px] uppercase tracking-wide text-faint">{label}</span>
    </div>
  );
}

function EfficiencyChip({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-base font-bold tabular-nums text-accent">{fmtPct(value)}</span>
      </div>
      <p className="mt-0.5 text-[10px] text-faint">{hint}</p>
    </div>
  );
}

const DIET = [
  { key: "two", label: "2PT", color: "#e06a2b" },
  { key: "three", label: "3PT", color: "#f0803c" },
  { key: "ft", label: "FT", color: "#8b93a1" },
] as const;

function ShotDietBar({ diet }: { diet: { two: number; three: number; ft: number } }) {
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        {DIET.map((seg) => (
          <div key={seg.key} style={{ width: `${diet[seg.key]}%`, background: seg.color }} />
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        {DIET.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1 text-[10px] text-muted">
            <span className="h-2 w-2 rounded-sm" style={{ background: seg.color }} />
            {seg.label} {Math.round(diet[seg.key])}%
          </span>
        ))}
      </div>
    </div>
  );
}

function FormTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: GameLogEntry }[];
}) {
  if (!active || !payload?.length) return null;
  const g = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-xl">
      <p className="font-medium text-text">
        {g.homeAway === "away" ? "@ " : "vs "}
        {g.opponent} · {g.result}
      </p>
      <p className="text-muted">
        <span className="tabular-nums text-text">{g.points}</span> pts ·{" "}
        {g.date ? fmtShortDate(g.date) : ""}
      </p>
    </div>
  );
}

function RecentForm({ playerId }: { playerId: string }) {
  const { data: games, isLoading, isError } = usePlayerGameLog(playerId, true);

  const recent = (games ?? []).slice(-RECENT_GAMES);
  const avg =
    recent.length > 0 ? recent.reduce((sum, g) => sum + g.points, 0) / recent.length : 0;

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs font-medium text-muted">Recent form — points</p>
        {recent.length > 0 ? (
          <p className="text-[11px] text-faint">
            last {recent.length} · avg <span className="text-text">{fmtAvg(avg)}</span>
          </p>
        ) : null}
      </div>
      {isLoading ? (
        <Skeleton className="h-[120px] w-full" />
      ) : isError || recent.length === 0 ? (
        <p className="py-8 text-center text-xs text-faint">No recent games available.</p>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={recent} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="formFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="opponent"
              tick={{ fill: "var(--color-faint)", fontSize: 9 }}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, "dataMax + 6"]} />
            <Tooltip content={<FormTooltip />} />
            <Area
              type="monotone"
              dataKey="points"
              stroke="var(--color-accent)"
              strokeWidth={2}
              fill="url(#formFill)"
              dot={{ r: 2, fill: "var(--color-accent)" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function PlayerDetailModal({ player }: { player: Player }) {
  const { stats } = player;
  const ts = trueShootingPct(stats.points, stats.fgAtt, stats.ftAtt);
  const efg = effectiveFgPct(stats.fgMade, stats.threeMade, stats.fgAtt);
  const diet = computeShotDiet(stats.fgMade, stats.threeMade, stats.ftMade);
  const production = [
    { label: "PTS", value: stats.points },
    { label: "REB", value: stats.rebounds },
    { label: "AST", value: stats.assists },
    { label: "STL", value: stats.steals },
    { label: "BLK", value: stats.blocks },
  ];

  return (
    <div>
      <div
        className="flex items-center gap-4 p-5"
        style={{ background: "linear-gradient(120deg, var(--color-surface-2), transparent)" }}
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
        <div className="grid grid-cols-4 gap-2">
          <CountStat label="PTS" value={stats.points} />
          <CountStat label="REB" value={stats.rebounds} />
          <CountStat label="AST" value={stats.assists} />
          <CountStat label="MIN" value={stats.minutes} />
        </div>

        {/* Efficiency — the advanced layer */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <EfficiencyChip label="True Shooting" value={ts} hint="scoring efficiency, all shots" />
            <EfficiencyChip label="Effective FG" value={efg} hint="FG% weighting 3s" />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted">Scoring breakdown</p>
            <ShotDietBar diet={diet} />
          </div>
        </div>

        <RecentForm playerId={player.id} />

        <div>
          <p className="mb-1 text-xs font-medium text-muted">Per-game production</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              layout="vertical"
              data={production}
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
                {production.map((d) => (
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
      </div>
    </div>
  );
}
