/**
 * League-relative player analytics: percentile ranks and statistical
 * similarity. These are the "compared to whom?" tools — they turn a raw
 * average into a rank against the rest of the league, and find the players
 * whose statistical profile is closest to a given player.
 */

import { trueShootingPct } from "./analytics";
import type { Player } from "./types";

/** Players below this games-played threshold are excluded from the peer pool. */
export const QUALIFY_GAMES = 15;

export function qualified(players: Player[]): Player[] {
  return players.filter((p) => p.stats.gamesPlayed >= QUALIFY_GAMES);
}

export function playerTS(p: Player): number {
  return trueShootingPct(p.stats.points, p.stats.fgAtt, p.stats.ftAtt);
}

/** The six dimensions used for the radar, similarity, and profile percentiles. */
export interface ProfileMetric {
  key: string;
  label: string;
  value: (p: Player) => number;
}

export const PROFILE_METRICS: ProfileMetric[] = [
  { key: "scoring", label: "Scoring", value: (p) => p.stats.points },
  { key: "efficiency", label: "Efficiency", value: playerTS },
  { key: "playmaking", label: "Playmaking", value: (p) => p.stats.assists },
  { key: "rebounding", label: "Rebounding", value: (p) => p.stats.rebounds },
  { key: "defense", label: "Defense", value: (p) => p.stats.steals + p.stats.blocks },
  { key: "volume", label: "Volume", value: (p) => p.stats.fgAtt },
];

/**
 * Build a percentile function from a peer pool and an accessor.
 * Returns 0–100: the share of the pool at or below a given value.
 */
export function percentileFn(pool: Player[], accessor: (p: Player) => number): (v: number) => number {
  const sorted = pool.map(accessor).sort((a, b) => a - b);
  return (v: number) => {
    if (sorted.length === 0) return 0;
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] <= v) lo = mid + 1;
      else hi = mid;
    }
    return (lo / sorted.length) * 100;
  };
}

export interface RadarAxis {
  axis: string;
  value: number; // percentile 0–100
  raw: number;
}

/** A player's percentile profile across the six dimensions, for the radar. */
export function radarProfile(player: Player, pool: Player[]): RadarAxis[] {
  return PROFILE_METRICS.map((m) => {
    const pct = percentileFn(pool, m.value);
    return { axis: m.label, value: Math.round(pct(m.value(player))), raw: m.value(player) };
  });
}

export interface SimilarPlayer {
  player: Player;
  match: number; // 0–100, higher = more similar
}

/**
 * Nearest-neighbour similarity on percentile-normalised profile vectors, so
 * every dimension contributes on the same 0–100 scale. Distance is converted
 * to an intuitive "match %".
 */
export function mostSimilar(target: Player, players: Player[], n = 5): SimilarPlayer[] {
  const pool = qualified(players);
  const fns = PROFILE_METRICS.map((m) => percentileFn(pool, m.value));
  const vec = (p: Player) => PROFILE_METRICS.map((m, i) => fns[i](m.value(p)));
  const t = vec(target);
  const maxDist = Math.sqrt(PROFILE_METRICS.length * 100 * 100);

  return pool
    .filter((p) => p.id !== target.id)
    .map((p) => {
      const v = vec(p);
      let sum = 0;
      for (let i = 0; i < v.length; i += 1) sum += (v[i] - t[i]) ** 2;
      const dist = Math.sqrt(sum);
      return { player: p, match: Math.max(0, Math.round((1 - dist / maxDist) * 100)) };
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, n);
}
