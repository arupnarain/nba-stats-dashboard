/**
 * Normalizers: raw ESPN JSON -> clean domain models.
 *
 * Everything here is defensive. ESPN's shapes are undocumented and can shift,
 * so each mapper reads through optional chaining and falls back to safe
 * defaults rather than throwing. A single malformed record is skipped, not
 * fatal to the whole response.
 */

import type {
  DraftPick,
  NewsArticle,
  Player,
  PlayerInjury,
  PlayerStats,
  Team,
  TeamInjuryReport,
} from "@/lib/types";

const num = (v: unknown): number => (typeof v === "number" && !Number.isNaN(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

/* ------------------------------- Players -------------------------------- */

interface RawStatCategory {
  name?: string;
  names?: string[];
  values?: number[];
}
interface RawAthleteEntry {
  athlete?: {
    id?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    headshot?: { href?: string };
    position?: { abbreviation?: string };
    age?: number;
    teamId?: string;
    teamName?: string;
    teamShortName?: string;
    teamLogos?: { href?: string; rel?: string[] }[];
  };
  categories?: RawStatCategory[];
}

/** Flatten ESPN's parallel names[]/values[] arrays into one lookup. */
function statLookup(categories: RawStatCategory[] | undefined): Map<string, number> {
  const map = new Map<string, number>();
  for (const cat of categories ?? []) {
    const names = cat.names ?? [];
    const values = cat.values ?? [];
    for (let i = 0; i < names.length; i += 1) {
      if (!map.has(names[i])) map.set(names[i], num(values[i]));
    }
  }
  return map;
}

function pickLogo(logos: { href?: string; rel?: string[] }[] | undefined): string | null {
  if (!logos?.length) return null;
  const def = logos.find((l) => l.rel?.includes("default"));
  return def?.href ?? logos[0]?.href ?? null;
}

export function mapPlayers(rawAthletes: unknown[]): Player[] {
  const players: Player[] = [];
  for (const raw of rawAthletes as RawAthleteEntry[]) {
    const a = raw.athlete;
    if (!a?.id || !a.displayName) continue;
    const s = statLookup(raw.categories);
    const stats: PlayerStats = {
      gamesPlayed: s.get("gamesPlayed") ?? 0,
      minutes: s.get("avgMinutes") ?? 0,
      points: s.get("avgPoints") ?? 0,
      rebounds: s.get("avgRebounds") ?? 0,
      assists: s.get("avgAssists") ?? 0,
      steals: s.get("avgSteals") ?? 0,
      blocks: s.get("avgBlocks") ?? 0,
      turnovers: s.get("avgTurnovers") ?? 0,
      fieldGoalPct: s.get("fieldGoalPct") ?? 0,
      threePointPct: s.get("threePointFieldGoalPct") ?? 0,
      freeThrowPct: s.get("freeThrowPct") ?? 0,
    };
    players.push({
      id: a.id,
      name: a.displayName,
      firstName: str(a.firstName),
      lastName: str(a.lastName),
      headshot: a.headshot?.href ?? null,
      position: a.position?.abbreviation ?? "—",
      age: typeof a.age === "number" ? a.age : null,
      teamId: str(a.teamId),
      teamName: str(a.teamName),
      teamAbbr: str(a.teamShortName),
      teamLogo: pickLogo(a.teamLogos),
      stats,
    });
  }
  return players;
}

/* -------------------------------- Teams --------------------------------- */

interface RawTeamsResponse {
  sports?: {
    leagues?: {
      teams?: {
        team?: {
          id?: string;
          name?: string;
          displayName?: string;
          location?: string;
          abbreviation?: string;
          color?: string;
          alternateColor?: string;
          logos?: { href?: string }[];
          standingSummary?: string;
        };
      }[];
    }[];
  }[];
}

export function mapTeams(raw: unknown): Team[] {
  const data = raw as RawTeamsResponse;
  const teams = data.sports?.[0]?.leagues?.[0]?.teams ?? [];
  const out: Team[] = [];
  for (const wrapper of teams) {
    const t = wrapper.team;
    if (!t?.id || !t.displayName) continue;
    out.push({
      id: t.id,
      name: str(t.name),
      displayName: t.displayName,
      location: str(t.location),
      abbreviation: str(t.abbreviation),
      color: t.color ? `#${t.color}` : null,
      alternateColor: t.alternateColor ? `#${t.alternateColor}` : null,
      logo: t.logos?.[0]?.href ?? null,
      standingSummary: t.standingSummary ?? null,
    });
  }
  return out.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/* ------------------------------ Injuries -------------------------------- */

interface RawInjuries {
  injuries?: {
    id?: string;
    displayName?: string;
    injuries?: {
      id?: string;
      status?: string;
      date?: string;
      shortComment?: string;
      longComment?: string;
      athlete?: { id?: string; displayName?: string };
    }[];
  }[];
}

export function mapInjuries(raw: unknown): TeamInjuryReport[] {
  const data = raw as RawInjuries;
  const reports: TeamInjuryReport[] = [];
  for (const team of data.injuries ?? []) {
    const injuries: PlayerInjury[] = [];
    for (const inj of team.injuries ?? []) {
      const playerId = inj.athlete?.id ?? null;
      injuries.push({
        id: str(inj.id) || `${playerId}-${str(inj.date)}`,
        playerId,
        playerName: str(inj.athlete?.displayName) || "Unknown player",
        headshot: playerId
          ? `https://a.espncdn.com/i/headshots/nba/players/full/${playerId}.png`
          : null,
        status: str(inj.status) || "Unknown",
        date: inj.date ?? null,
        detail: str(inj.shortComment) || str(inj.longComment),
      });
    }
    if (injuries.length) {
      reports.push({
        teamId: str(team.id),
        teamName: str(team.displayName) || "Unknown team",
        injuries,
      });
    }
  }
  return reports.sort((a, b) => a.teamName.localeCompare(b.teamName));
}

/* -------------------------------- News ---------------------------------- */

interface RawNews {
  articles?: {
    id?: number | string;
    headline?: string;
    description?: string;
    published?: string;
    byline?: string;
    images?: { url?: string; type?: string }[];
    links?: { web?: { href?: string } };
  }[];
}

export function mapNews(raw: unknown): NewsArticle[] {
  const data = raw as RawNews;
  const out: NewsArticle[] = [];
  for (const art of data.articles ?? []) {
    const url = art.links?.web?.href;
    if (!art.headline || !url) continue;
    const image =
      art.images?.find((i) => i.type === "header")?.url ?? art.images?.[0]?.url ?? null;
    out.push({
      id: String(art.id ?? url),
      headline: art.headline,
      description: str(art.description),
      published: str(art.published),
      imageUrl: image,
      url,
      byline: art.byline ?? null,
    });
  }
  return out;
}

/* -------------------------------- Draft --------------------------------- */

interface RawDraft {
  picks?: {
    overall?: number;
    pick?: number;
    round?: number;
    teamId?: string;
    traded?: boolean;
    tradeNote?: string;
    athlete?: {
      id?: string;
      displayName?: string;
      displayHeight?: string;
      displayWeight?: string;
      headshot?: { href?: string };
      link?: string;
      team?: { abbreviation?: string; location?: string; name?: string };
    };
  }[];
}

export function mapDraft(raw: unknown): DraftPick[] {
  const data = raw as RawDraft;
  const out: DraftPick[] = [];
  for (const p of data.picks ?? []) {
    const a = p.athlete;
    if (!a?.displayName) continue;
    const college = a.team;
    out.push({
      overall: num(p.overall),
      pick: num(p.pick),
      round: num(p.round),
      traded: Boolean(p.traded),
      tradeNote: str(p.tradeNote),
      teamId: str(p.teamId),
      playerId: str(a.id),
      playerName: a.displayName,
      headshot: a.headshot?.href ?? null,
      height: str(a.displayHeight),
      weight: str(a.displayWeight),
      collegeAbbr: str(college?.abbreviation),
      collegeName: str(college?.location) || str(college?.name),
      link: str(a.link),
    });
  }
  return out.sort((a, b) => a.overall - b.overall);
}
