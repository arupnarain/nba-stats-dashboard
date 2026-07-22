"use client";

import * as Tabs from "@radix-ui/react-tabs";
import {
  Activity,
  BarChart3,
  Newspaper,
  Scale,
  ScatterChart,
  Trophy,
  Users,
  Shield,
} from "lucide-react";
import type { ComponentType } from "react";
import { PlayersTab } from "./features/PlayersTab";
import { TeamsTab } from "./features/TeamsTab";
import { LeadersTab } from "./features/LeadersTab";
import { ExploreTab } from "./features/ExploreTab";
import { CompareTab } from "./features/CompareTab";
import { InjuriesTab } from "./features/InjuriesTab";
import { NewsTab } from "./features/NewsTab";
import { DraftTab } from "./features/DraftTab";

/** A basketball mark — orange ball with seam lines. */
function BasketballMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="var(--color-accent)" />
      <g stroke="#160c06" strokeWidth="1.25" fill="none" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="22.5" y2="12" />
        <path d="M4.7 4.7c3.9 3.2 3.9 12.4 0 15.6" />
        <path d="M19.3 4.7c-3.9 3.2 -3.9 12.4 0 15.6" />
      </g>
    </svg>
  );
}

interface TabDef {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  Panel: ComponentType;
}

const TABS: TabDef[] = [
  { value: "players", label: "Players", icon: Users, Panel: PlayersTab },
  { value: "teams", label: "Teams", icon: Shield, Panel: TeamsTab },
  { value: "leaders", label: "Leaders", icon: BarChart3, Panel: LeadersTab },
  { value: "explore", label: "Explore", icon: ScatterChart, Panel: ExploreTab },
  { value: "compare", label: "Compare", icon: Scale, Panel: CompareTab },
  { value: "injuries", label: "Injuries", icon: Activity, Panel: InjuriesTab },
  { value: "news", label: "News", icon: Newspaper, Panel: NewsTab },
  { value: "draft", label: "Draft", icon: Trophy, Panel: DraftTab },
];

export function Dashboard() {
  return (
    <div className="min-h-dvh">
      <header className="app-glow border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
          <BasketballMark className="h-10 w-10" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-text">Hardwood</h1>
            <p className="text-xs text-muted">NBA Stats &amp; Analytics · 2025-26</p>
          </div>
        </div>
      </header>

      <Tabs.Root defaultValue="players" className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Tabs.List
          aria-label="Dashboard sections"
          className="mb-6 flex gap-1 overflow-x-auto border-b border-line pb-px"
        >
          {TABS.map(({ value, label, icon: Icon }) => (
            <Tabs.Trigger
              key={value}
              value={value}
              className="group relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium text-muted outline-none transition-colors hover:text-text data-[state=active]:text-text focus-visible:text-text"
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent opacity-0 transition-opacity group-data-[state=active]:opacity-100" />
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {TABS.map(({ value, Panel }) => (
          <Tabs.Content key={value} value={value} className="tab-fade outline-none">
            <Panel />
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-xs text-faint">
          Data via ESPN public endpoints, proxied and normalized server-side. Built with
          Next.js, TypeScript, Tailwind CSS, Radix UI, React Query &amp; Recharts. Not
          affiliated with the NBA or ESPN.
        </p>
      </footer>
    </div>
  );
}
