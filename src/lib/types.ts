/**
 * Clean, strictly-typed domain models.
 *
 * The frontend consumes ONLY these types. Raw ESPN response shapes are
 * normalized in the mapper layer (`lib/espn/mappers.ts`) so that no
 * component ever depends on the upstream API's structure. This is the
 * "internal SDK" boundary: if the data source changed tomorrow, only the
 * mappers would move.
 */

/** A player's per-game season averages. All values are for a single season. */
export interface PlayerStats {
  gamesPlayed: number;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  // Per-game shooting volume — needed to derive TS%, eFG%, and shot diet.
  fgMade: number;
  fgAtt: number;
  threeMade: number;
  threeAtt: number;
  ftMade: number;
  ftAtt: number;
}

/** A single game from a player's game log. */
export interface GameLogEntry {
  eventId: string;
  date: string;
  opponent: string;
  homeAway: "home" | "away" | "";
  result: string;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
}

/** Team-level efficiency metrics, derived from season totals. */
export interface TeamStats {
  teamId: string;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  netDiff: number;
  pace: number;
  offRating: number;
  defRating: number;
  netRating: number;
  fieldGoalPct: number;
  threePointPct: number;
  assistToTurnover: number;
}

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  headshot: string | null;
  position: string;
  age: number | null;
  teamId: string;
  teamName: string;
  teamAbbr: string;
  teamLogo: string | null;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  displayName: string;
  location: string;
  abbreviation: string;
  color: string | null;
  alternateColor: string | null;
  logo: string | null;
  standingSummary: string | null;
}

export type InjuryStatus =
  | "Out"
  | "Day-To-Day"
  | "Game Time Decision"
  | "Questionable"
  | "Doubtful"
  | string;

export interface PlayerInjury {
  id: string;
  playerId: string | null;
  playerName: string;
  headshot: string | null;
  status: InjuryStatus;
  date: string | null;
  detail: string;
}

export interface TeamInjuryReport {
  teamId: string;
  teamName: string;
  injuries: PlayerInjury[];
}

export interface NewsArticle {
  id: string;
  headline: string;
  description: string;
  published: string;
  imageUrl: string | null;
  url: string;
  byline: string | null;
}

export interface DraftPick {
  overall: number;
  pick: number;
  round: number;
  traded: boolean;
  tradeNote: string;
  teamId: string;
  playerId: string;
  playerName: string;
  headshot: string | null;
  height: string;
  weight: string;
  collegeAbbr: string;
  collegeName: string;
  link: string;
}

/** Leagues supported by the News tab (ESPN league slugs). */
export type NewsLeague = "nba" | "nba-summer-las-vegas" | "nba-development";

/** The sortable statistical categories for the Leaders tab. */
export type LeaderCategory = keyof Pick<
  PlayerStats,
  "points" | "rebounds" | "assists" | "steals" | "blocks" | "threePointPct"
>;
