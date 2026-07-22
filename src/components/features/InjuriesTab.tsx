"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { InjuryList } from "./InjuryList";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useInjuries } from "@/hooks/useNbaData";

const MAX_COMPARE = 2;

function TeamTitle({ name, count }: { name: string; count: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm font-semibold tracking-tight text-text">{name}</span>
      <Badge>{count}</Badge>
    </span>
  );
}

export function InjuriesTab() {
  const { data: reports, isLoading, isError, refetch } = useInjuries();
  const [selected, setSelected] = useState<string[]>([]);

  const options = useMemo(
    () =>
      (reports ?? []).map((r) => ({
        value: r.teamId,
        label: `${r.teamName} (${r.injuries.length})`,
      })),
    [reports],
  );
  const available = useMemo(
    () => options.filter((o) => !selected.includes(o.value)),
    [options, selected],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
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

  const addTeam = (id: string) =>
    setSelected((s) => (s.length < MAX_COMPARE && !s.includes(id) ? [...s, id] : s));
  const removeTeam = (id: string) => setSelected((s) => s.filter((x) => x !== id));
  const comparing = selected.length > 0;
  const selectedReports = reports.filter((r) => selected.includes(r.teamId));

  return (
    <div className="space-y-4">
      {/* Compare filter */}
      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 sm:flex-row sm:items-center">
        <span className="shrink-0 text-xs font-medium text-muted">
          Compare teams (up to {MAX_COMPARE}):
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {selectedReports.map((r) => (
            <span
              key={r.teamId}
              className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/15 px-2 py-1 text-xs font-medium text-accent"
            >
              {r.teamName}
              <button
                type="button"
                onClick={() => removeTeam(r.teamId)}
                aria-label={`Remove ${r.teamName}`}
                className="rounded transition-colors hover:text-accent-hover"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length < MAX_COMPARE ? (
            <Select
              ariaLabel="Add a team to compare"
              value=""
              onValueChange={addTeam}
              options={available}
              placeholder="Add a team…"
              className="w-56"
            />
          ) : (
            <span className="text-xs text-faint">Max reached — remove one to swap</span>
          )}
          {comparing ? (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-xs text-muted underline underline-offset-2 hover:text-text"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {comparing ? (
        // Side-by-side comparison of the picked teams.
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {selectedReports.map((team) => (
            <Card key={team.teamId} className="overflow-hidden">
              <CardHeader className="flex items-center justify-between border-b border-line pb-3">
                <CardTitle>{team.teamName}</CardTitle>
                <Badge>{team.injuries.length}</Badge>
              </CardHeader>
              <InjuryList injuries={team.injuries} />
            </Card>
          ))}
        </div>
      ) : (
        // Collapsible panels — expand only the teams you care about.
        <Accordion.Root type="multiple" className="space-y-2">
          {reports.map((team) => (
            <Accordion.Item
              key={team.teamId}
              value={team.teamId}
              className="overflow-hidden rounded-lg border border-line bg-surface"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between px-5 py-3 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2">
                  <TeamTitle name={team.teamName} count={team.injuries.length} />
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="acc-content border-t border-line">
                <InjuryList injuries={team.injuries} />
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </div>
  );
}
