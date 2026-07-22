import { Avatar, initials } from "@/components/ui/Avatar";
import { Badge, injuryTone } from "@/components/ui/Badge";
import type { PlayerInjury } from "@/lib/types";
import { fmtShortDate } from "@/lib/utils";

/**
 * The injury rows for a single team. Extracted so the exact same markup is
 * reused by the collapsible accordion panels and the side-by-side compare view.
 */
export function InjuryList({ injuries }: { injuries: PlayerInjury[] }) {
  return (
    <ul className="divide-y divide-line">
      {injuries.map((inj) => (
        <li key={inj.id} className="flex items-start gap-3 px-5 py-3">
          <Avatar
            src={inj.headshot}
            alt={inj.playerName}
            fallback={initials(inj.playerName)}
            size={36}
            rounded={false}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-text">{inj.playerName}</span>
              <Badge tone={injuryTone(inj.status)}>{inj.status}</Badge>
            </div>
            {inj.detail ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{inj.detail}</p>
            ) : null}
            {inj.date ? (
              <p className="mt-1 text-[11px] text-faint">{fmtShortDate(inj.date)}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
