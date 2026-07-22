"use client";

import { useMemo } from "react";
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
import {
  usePlayerGameLog,
  usePlayers,
  usePlayerSeasons,
  useTeamStats,
} from "@/hooks/useNbaData";
import {
  effectiveFgPct,
  gameScore,
  shotDiet as computeShotDiet,
  trueShootingPct,
  usageRate,
} from "@/lib/analytics";
import { mostSimilar, percentileFn, playerTS, qualified } from "@/lib/playerAnalytics";
import type { GameLogEntry, Player, PlayerSeason } from "@/lib/types";
import { fmtAvg, fmtPct, fmtShortDate, ordinal } from "@/lib/utils";

const RECENT_GAMES = 12;

function CountStat({ label, value, pct }: { label: string; value: number; pct?: number }) {
  const animated = useCountUp(value);
  return (
    <div className="flex flex-col items-center rounded-lg bg-surface-2 py-2.5">
      <span className="text-lg font-bold tabular-nums text-text">{animated.toFixed(1)}</span>
      <span className="text-[10px] uppercase tracking-wide text-faint">{label}</span>
      {pct !== undefined ? (
        <span className="mt-0.5 text-[9px] text-accent">{ordinal(pct)} pct</span>
      ) : null}
    </div>
  );
}

function AdvChip({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-base font-bold tabular-nums text-accent">{value}</span>
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

/** Current-season shooting splits: FG / 2P / 3P / FT as made-attempt (pct). */
function ShootingSplits({ s }: { s: PlayerSeason }) {
  const rows = [
    { label: "Field goals", m: s.fgm, a: s.fga, pct: s.fgPct },
    { label: "2-pointers", m: s.fgm - s.tpm, a: s.fga - s.tpa, pct: (s.fga - s.tpa) > 0 ? ((s.fgm - s.tpm) / (s.fga - s.tpa)) * 100 : 0 },
    { label: "3-pointers", m: s.tpm, a: s.tpa, pct: s.tpPct },
    { label: "Free throws", m: s.ftm, a: s.fta, pct: s.ftPct },
  ];
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">Shooting splits · per game</p>
      <div className="overflow-hidden rounded-lg border border-line">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-3 py-1.5 text-xs ${i % 2 ? "bg-surface-2/40" : ""}`}
          >
            <span className="text-muted">{r.label}</span>
            <span className="tabular-nums text-text">
              {fmtAvg(r.m)}–{fmtAvg(r.a)}{" "}
              <span className="text-faint">({r.pct.toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-surface-2 py-1.5">
          <p className="text-sm font-semibold tabular-nums text-text">{fmtAvg(s.orb)}</p>
          <p className="text-[9px] uppercase tracking-wide text-faint">Off reb</p>
        </div>
        <div className="rounded-md bg-surface-2 py-1.5">
          <p className="text-sm font-semibold tabular-nums text-text">{fmtAvg(s.drb)}</p>
          <p className="text-[9px] uppercase tracking-wide text-faint">Def reb</p>
        </div>
        <div className="rounded-md bg-surface-2 py-1.5">
          <p className="text-sm font-semibold tabular-nums text-text">{s.gs}</p>
          <p className="text-[9px] uppercase tracking-wide text-faint">Games started</p>
        </div>
      </div>
    </div>
  );
}

function SeasonHistory({ seasons }: { seasons: PlayerSeason[] }) {
  const rows = [...seasons].reverse();
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted">Season history · per game</p>
      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[520px] text-xs">
          <thead>
            <tr className="bg-surface-2 text-faint">
              {["Season", "GP", "MIN", "PTS", "REB", "AST", "STL", "BLK", "FG%", "3P%", "FT%"].map(
                (h) => (
                  <th key={h} className="px-2 py-1.5 text-right font-medium first:text-left">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.seasonYear} className="border-t border-line tabular-nums">
                <td className="px-2 py-1.5 text-left text-muted">{s.seasonLabel}</td>
                <td className="px-2 py-1.5 text-right text-muted">{s.gp}</td>
                <td className="px-2 py-1.5 text-right text-muted">{fmtAvg(s.min)}</td>
                <td className="px-2 py-1.5 text-right font-medium text-text">{fmtAvg(s.pts)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{fmtAvg(s.reb)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{fmtAvg(s.ast)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{fmtAvg(s.stl)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{fmtAvg(s.blk)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{s.fgPct.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{s.tpPct.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-right text-muted">{s.ftPct.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

function SimilarPlayers({ player, pool }: { player: Player; pool: Player[] }) {
  const similar = useMemo(() => mostSimilar(player, pool, 5), [player, pool]);
  if (similar.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">
        Most similar players <span className="text-faint">· by statistical profile</span>
      </p>
      <ul className="space-y-1.5">
        {similar.map(({ player: p, match }) => (
          <li key={p.id} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
            <Avatar
              src={p.headshot}
              alt={p.name}
              fallback={initials(p.name)}
              size={30}
              rounded={false}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{p.name}</p>
              <p className="truncate text-[11px] text-faint">
                {p.teamAbbr} · {p.position} · {fmtAvg(p.stats.points)} / {fmtAvg(p.stats.rebounds)}{" "}
                / {fmtAvg(p.stats.assists)}
              </p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-accent">{match}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlayerDetailModal({ player }: { player: Player }) {
  const { stats } = player;
  const { data: allPlayers } = usePlayers();
  const { data: seasons } = usePlayerSeasons(player.id, true);
  const { data: teamStats } = useTeamStats();

  const pool = useMemo(() => qualified(allPlayers ?? []), [allPlayers]);
  const pct = useMemo(() => {
    if (pool.length === 0) return null;
    return {
      points: percentileFn(pool, (p) => p.stats.points)(stats.points),
      rebounds: percentileFn(pool, (p) => p.stats.rebounds)(stats.rebounds),
      assists: percentileFn(pool, (p) => p.stats.assists)(stats.assists),
      ts: percentileFn(pool, playerTS)(playerTS(player)),
    };
  }, [pool, player, stats]);

  // Latest season (highest year) carries the OR/DR split + games started.
  const current = useMemo(() => {
    if (!seasons?.length) return null;
    return seasons.reduce((a, b) => (b.seasonYear > a.seasonYear ? b : a));
  }, [seasons]);

  const team = teamStats?.find((t) => t.teamId === player.teamId) ?? null;

  const ts = trueShootingPct(stats.points, stats.fgAtt, stats.ftAtt);
  const efg = effectiveFgPct(stats.fgMade, stats.threeMade, stats.fgAtt);
  const diet = computeShotDiet(stats.fgMade, stats.threeMade, stats.ftMade);

  const usg =
    current && team
      ? usageRate(current.fga, current.fta, current.tov, current.min, team.teamFga, team.teamFta, team.teamTov)
      : null;
  const gmsc = current
    ? gameScore({
        pts: current.pts,
        fgm: current.fgm,
        fga: current.fga,
        fta: current.fta,
        ftm: current.ftm,
        orb: current.orb,
        drb: current.drb,
        stl: current.stl,
        ast: current.ast,
        blk: current.blk,
        pf: current.pf,
        tov: current.tov,
      })
    : null;

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
          <CountStat label="PTS" value={stats.points} pct={pct?.points} />
          <CountStat label="REB" value={stats.rebounds} pct={pct?.rebounds} />
          <CountStat label="AST" value={stats.assists} pct={pct?.assists} />
          <CountStat label="MIN" value={stats.minutes} />
        </div>

        {/* Advanced metrics */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <AdvChip
            label="TS%"
            value={fmtPct(ts)}
            hint={pct ? `${ordinal(pct.ts)} pct` : "true shooting"}
          />
          <AdvChip label="eFG%" value={fmtPct(efg)} hint="weights 3s" />
          <AdvChip label="Usage" value={usg !== null ? fmtPct(usg) : "…"} hint="possessions used" />
          <AdvChip
            label="Game Score"
            value={gmsc !== null ? gmsc.toFixed(1) : "…"}
            hint="Hollinger, per game"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">Scoring breakdown</p>
          <ShotDietBar diet={diet} />
        </div>

        <RecentForm playerId={player.id} />

        {current ? (
          <ShootingSplits s={current} />
        ) : (
          <Skeleton className="h-[168px] w-full" />
        )}

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

        {seasons && seasons.length > 1 ? <SeasonHistory seasons={seasons} /> : null}

        {pool.length > 0 ? <SimilarPlayers player={player} pool={pool} /> : null}
      </div>
    </div>
  );
}
