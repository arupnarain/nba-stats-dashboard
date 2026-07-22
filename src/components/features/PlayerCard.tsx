"use client";

import { memo } from "react";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { PlayerDetailModal } from "./PlayerDetailModal";
import type { Player } from "@/lib/types";
import { cn, fmtAvg, fmtPct } from "@/lib/utils";

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-md bg-surface-2 py-2">
      <span className="text-sm font-semibold tabular-nums text-text">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-faint">{label}</span>
    </div>
  );
}

interface PlayerCardProps {
  player: Player;
  className?: string;
}

/**
 * Pure presentational card, wrapped in React.memo so re-renders of the parent
 * list (e.g. while typing in search) never re-render cards whose `player`
 * reference is unchanged. Acts as the trigger for the detail modal.
 */
function PlayerCardBase({ player, className }: PlayerCardProps) {
  const { stats } = player;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="w-full text-left focus:outline-none">
          <Card
            className={cn(
              "p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lg hover:shadow-black/20",
              className,
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={player.headshot}
                alt={player.name}
                fallback={initials(player.name)}
                size={52}
                rounded={false}
                className="bg-surface-2"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{player.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  {player.teamLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.teamLogo} alt="" className="h-4 w-4 object-contain" />
                  ) : null}
                  <span>{player.teamAbbr || "FA"}</span>
                  <span className="text-faint">•</span>
                  <span>{player.position}</span>
                  {player.age ? <span className="text-faint">• {player.age}y</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <StatMini label="PTS" value={fmtAvg(stats.points)} />
              <StatMini label="REB" value={fmtAvg(stats.rebounds)} />
              <StatMini label="AST" value={fmtAvg(stats.assists)} />
              <StatMini label="3P%" value={fmtPct(stats.threePointPct)} />
            </div>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent label={`${player.name} player details`}>
        <PlayerDetailModal player={player} />
      </DialogContent>
    </Dialog>
  );
}

export const PlayerCard = memo(PlayerCardBase);
