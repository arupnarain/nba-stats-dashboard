"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, injuryTone } from "@/components/ui/Badge";
import { Avatar, initials } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useInjuries } from "@/hooks/useNbaData";
import { fmtShortDate } from "@/lib/utils";

export function InjuriesTab() {
  const { data: reports, isLoading, isError, refetch } = useInjuries();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-52 w-full" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!reports || reports.length === 0) {
    return (
      <EmptyState
        title="No injuries currently reported"
        hint="The league is between seasons — this fills up once games resume."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {reports.map((team) => (
        <Card key={team.teamId} className="overflow-hidden">
          <CardHeader className="flex items-center justify-between border-b border-line pb-3">
            <CardTitle>{team.teamName}</CardTitle>
            <Badge>{team.injuries.length}</Badge>
          </CardHeader>
          <ul className="divide-y divide-line">
            {team.injuries.map((inj) => (
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
                    <span className="truncate text-sm font-medium text-text">
                      {inj.playerName}
                    </span>
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
        </Card>
      ))}
    </div>
  );
}
