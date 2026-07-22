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
  GameLogEntry,
  NewsArticle,
  Player,
  PlayerInjury,
  PlayerStats,
  Team,
  TeamInjuryReport,
  TeamStats,
} from "@/lib/types";
import { possessions, ratingPer100 } from "@/lib/analytics";

const num = (v: unknown): number => (typeof v === "number" && !Number.isNaN(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
/** Parse a game-log stat cell (strings like "26" or "3-10") to a number. */
const numFrom = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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

/** Map each category name -> its ordered stat keys, from the glossary. */
function buildGlossary(rawGlossary: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const cat of (rawGlossary as RawStatCategory[]) ?? []) {
    if (cat.name && cat.names) map.set(cat.name, cat.names);
  }
  return map;
}

/**
 * Line up a player's positional `values` with the glossary's stat names.
 * ESPN keys stats by array position, not by name — the glossary tells us
 * which slot is which (e.g. offensive[0] = avgPoints).
 */
function statLookup(
  categories: RawStatCategory[] | undefined,
  glossary: Map<string, string[]>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const cat of categories ?? []) {
    const names = glossary.get(cat.name ?? "") ?? cat.names ?? [];
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

export function mapPlayers(rawAthletes: unknown[], rawGlossary: unknown): Player[] {
  const glossary = buildGlossary(rawGlossary);
  const players: Player[] = [];
  for (const raw of rawAthletes as RawAthleteEntry[]) {
    const a = raw.athlete;
    if (!a?.id || !a.displayName) continue;
    const s = statLookup(raw.categories, glossary);
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
      fgMade: s.get("avgFieldGoalsMade") ?? 0,
      fgAtt: s.get("avgFieldGoalsAttempted") ?? 0,
      threeMade: s.get("avgThreePointFieldGoalsMade") ?? 0,
      threeAtt: s.get("avgThreePointFieldGoalsAttempted") ?? 0,
      ftMade: s.get("avgFreeThrowsMade") ?? 0,
      ftAtt: s.get("avgFreeThrowsAttempted") ?? 0,
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

/* ------------------------------ Game log -------------------------------- */

interface RawGameLog {
  names?: string[];
  events?: Record<
    string,
    {
      gameDate?: string;
      homeAway?: string;
      gameResult?: string;
      opponent?: { abbreviation?: string };
    }
  >;
  seasonTypes?: { categories?: { events?: { eventId?: string; stats?: string[] }[] }[] }[];
}

export function mapGameLog(raw: unknown): GameLogEntry[] {
  const data = raw as RawGameLog;
  const names = data.names ?? [];
  const iPts = names.indexOf("points");
  const iReb = names.indexOf("totalRebounds");
  const iAst = names.indexOf("assists");
  const iMin = names.indexOf("minutes");
  const meta = data.events ?? {};
  const rows: GameLogEntry[] = [];
  const seen = new Set<string>();

  for (const st of data.seasonTypes ?? []) {
    for (const cat of st.categories ?? []) {
      for (const ev of cat.events ?? []) {
        const id = str(ev.eventId);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const stats = ev.stats ?? [];
        const m = meta[id];
        const ha = m?.homeAway;
        rows.push({
          eventId: id,
          date: str(m?.gameDate),
          opponent: str(m?.opponent?.abbreviation),
          homeAway: ha === "home" || ha === "away" ? ha : "",
          result: str(m?.gameResult),
          minutes: numFrom(stats[iMin]),
          points: numFrom(stats[iPts]),
          rebounds: numFrom(stats[iReb]),
          assists: numFrom(stats[iAst]),
        });
      }
    }
  }
  return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/* ----------------------------- Team stats ------------------------------- */

interface RawByTeam {
  categories?: { name?: string; names?: string[] }[];
  teams?: {
    team?: { id?: string };
    categories?: { name?: string; values?: number[] }[];
  }[];
}

export function mapTeamStats(raw: unknown): TeamStats[] {
  const data = raw as RawByTeam;
  const glossary = new Map<string, string[]>();
  for (const c of data.categories ?? []) {
    if (c.name && c.names?.length && !glossary.has(c.name)) glossary.set(c.name, c.names);
  }

  const out: TeamStats[] = [];
  for (const t of data.teams ?? []) {
    const id = str(t.team?.id);
    if (!id) continue;
    const lut = new Map<string, number>();
    for (const c of t.categories ?? []) {
      const names = glossary.get(c.name ?? "") ?? [];
      const vals = c.values ?? [];
      for (let i = 0; i < names.length; i += 1) {
        if (!lut.has(names[i])) lut.set(names[i], num(vals[i]));
      }
    }

    const ppg = lut.get("avgPoints") ?? 0;
    const netDiff = lut.get("avgPointsDifferential") ?? 0;
    const oppPpg = ppg - netDiff;
    const pace = possessions(
      lut.get("avgFieldGoalsAttempted") ?? 0,
      lut.get("avgFreeThrowsAttempted") ?? 0,
      lut.get("avgOffensiveRebounds") ?? 0,
      lut.get("avgTurnovers") ?? 0,
    );
    const offRating = ratingPer100(ppg, pace);
    const defRating = ratingPer100(oppPpg, pace);

    out.push({
      teamId: id,
      gamesPlayed: lut.get("gamesPlayed") ?? 0,
      pointsFor: ppg,
      pointsAgainst: oppPpg,
      netDiff,
      pace,
      offRating,
      defRating,
      netRating: offRating - defRating,
      fieldGoalPct: lut.get("fieldGoalPct") ?? 0,
      threePointPct: lut.get("threePointFieldGoalPct") ?? 0,
      assistToTurnover: lut.get("assistTurnoverRatio") ?? 0,
    });
  }
  return out;
}
