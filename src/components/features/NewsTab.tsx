"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SegmentedControl, type Segment } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useNews } from "@/hooks/useNbaData";
import type { NewsLeague } from "@/lib/types";
import { fmtShortDate } from "@/lib/utils";

const LEAGUES: Segment<NewsLeague>[] = [
  { value: "nba", label: "NBA" },
  { value: "nba-summer-las-vegas", label: "Summer League" },
  { value: "nba-development", label: "G League" },
];

export function NewsTab() {
  const [league, setLeague] = useState<NewsLeague>("nba");
  const { data: articles, isLoading, isError, refetch } = useNews(league);

  return (
    <div className="space-y-4">
      <SegmentedControl
        ariaLabel="News league"
        value={league}
        onChange={setLeague}
        segments={LEAGUES}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !articles || articles.length === 0 ? (
        <EmptyState title="No stories right now" hint="Check back soon." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="flex h-full flex-col overflow-hidden hover:border-line-strong">
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full bg-surface-2" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-sm font-semibold leading-snug text-text group-hover:text-accent">
                    {a.headline}
                  </h3>
                  {a.description ? (
                    <p className="mt-1.5 line-clamp-3 text-xs text-muted">{a.description}</p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between pt-3 text-[11px] text-faint">
                    <span>
                      {a.byline ? `${a.byline} · ` : ""}
                      {fmtShortDate(a.published)}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
