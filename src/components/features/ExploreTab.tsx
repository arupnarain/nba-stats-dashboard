"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { PlayerDetailModal } from "./PlayerDetailModal";
import { usePlayers } from "@/hooks/useNbaData";
import { playerTS, qualified } from "@/lib/playerAnalytics";
import type { Player } from "@/lib/types";
import { fmtAvg, fmtPct } from "@/lib/utils";

type PosKey = "all" | "G" | "F" | "C";

const POSITIONS: Segment<PosKey>[] = [
  { value: "all", label: "All" },
  { value: "G", label: "Guards" },
  { value: "F", label: "Forwards" },
  { value: "C", label: "Centers" },
];

const POS_COLORS: Record<Exclude<PosKey, "all">, string> = {
  G: "#f0803c",
  F: "#5b9bd5",
  C: "#34d39a",
};

function bucket(position: string): Exclude<PosKey, "all"> {
  if (position.includes("G")) return "G";
  if (position.includes("C")) return "C";
  return "F";
}

interface Point {
  x: number;
  y: number;
  player: Player;
  pos: Exclude<PosKey, "all">;
}

function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-text">{p.player.name}</p>
      <p className="text-muted">
        {p.player.teamAbbr} · {p.player.position}
      </p>
      <p className="mt-1 text-muted">
        <span className="tabular-nums text-text">{fmtAvg(p.x)}</span> pts ·{" "}
        <span className="tabular-nums text-text">{fmtPct(p.y)}</span> TS
      </p>
    </div>
  );
}

export function ExploreTab() {
  const { data: players, isLoading, isError, refetch } = usePlayers();
  const [position, setPosition] = useState<PosKey>("all");
  const [selected, setSelected] = useState<Player | null>(null);

  const { points, avgX, avgY } = useMemo(() => {
    const pool = qualified(players ?? []);
    const all: Point[] = pool.map((p) => ({
      x: p.stats.points,
      y: playerTS(p),
      player: p,
      pos: bucket(p.position),
    }));
    const ax = all.length ? all.reduce((s, p) => s + p.x, 0) / all.length : 0;
    const ay = all.length ? all.reduce((s, p) => s + p.y, 0) / all.length : 0;
    const filtered = position === "all" ? all : all.filter((p) => p.pos === position);
    return { points: filtered, avgX: ax, avgY: ay };
  }, [players, position]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Efficiency Landscape</CardTitle>
          <p className="mt-0.5 text-xs text-faint">
            Scoring volume vs True Shooting % · crosshairs = league average · click a dot
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Filter by position"
          value={position}
          onChange={setPosition}
          segments={POSITIONS}
        />
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-[440px] w-full" />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={440}>
              <ScatterChart margin={{ top: 12, right: 16, bottom: 24, left: 4 }}>
                <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Points"
                  tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Points per game →",
                    position: "insideBottom",
                    offset: -12,
                    fill: "var(--color-muted)",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="TS%"
                  domain={["dataMin - 2", "dataMax + 2"]}
                  tick={{ fill: "var(--color-faint)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "True Shooting % →",
                    angle: -90,
                    position: "insideLeft",
                    fill: "var(--color-muted)",
                    fontSize: 11,
                  }}
                />
                <ZAxis range={[45, 45]} />
                <ReferenceLine x={avgX} stroke="var(--color-line-strong)" strokeDasharray="4 4" />
                <ReferenceLine y={avgY} stroke="var(--color-line-strong)" strokeDasharray="4 4" />
                <Tooltip content={<PointTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  data={points}
                  onClick={(d) => {
                    const p = (d as unknown as { player?: Player }).player;
                    if (p) setSelected(p);
                  }}
                  className="cursor-pointer"
                >
                  {points.map((p) => (
                    <Cell key={p.player.id} fill={POS_COLORS[p.pos]} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-[11px] text-muted">
                {(Object.keys(POS_COLORS) as Exclude<PosKey, "all">[]).map((k) => (
                  <span key={k} className="flex items-center gap-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: POS_COLORS[k] }}
                    />
                    {k === "G" ? "Guards" : k === "F" ? "Forwards" : "Centers"}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-faint">
                Top-right = high-volume, efficient scorers. Top-left = efficient role players.
              </p>
            </div>
          </>
        )}
      </CardBody>

      <Dialog open={!!selected} onOpenChange={(o) => (!o ? setSelected(null) : undefined)}>
        {selected ? (
          <DialogContent label={`${selected.name} details`}>
            <PlayerDetailModal player={selected} />
          </DialogContent>
        ) : null}
      </Dialog>
    </Card>
  );
}
