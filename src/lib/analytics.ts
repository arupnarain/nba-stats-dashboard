/**
 * Basketball analytics — pure, documented functions.
 *
 * These turn raw box-score averages into the efficiency and pace-adjusted
 * metrics that a strategy group actually reasons with. Kept separate and
 * side-effect-free so the math is easy to read, reuse, and test.
 */

/**
 * True Shooting % — points per shooting possession, crediting 3s and free
 * throws. The 0.44 weights the fraction of free-throw trips that end a
 * possession. TS% = PTS / (2 · (FGA + 0.44 · FTA)).
 */
export function trueShootingPct(points: number, fga: number, fta: number): number {
  const shootingPossessions = 2 * (fga + 0.44 * fta);
  return shootingPossessions > 0 ? (points / shootingPossessions) * 100 : 0;
}

/**
 * Effective FG% — field-goal percentage that gives a three 1.5× the weight of
 * a two, since it's worth 1.5×. eFG% = (FGM + 0.5 · 3PM) / FGA.
 */
export function effectiveFgPct(fgMade: number, threeMade: number, fga: number): number {
  return fga > 0 ? ((fgMade + 0.5 * threeMade) / fga) * 100 : 0;
}

/** Share of a player's points coming from 2s, 3s, and free throws. */
export interface ShotDiet {
  two: number;
  three: number;
  ft: number;
}
export function shotDiet(fgMade: number, threeMade: number, ftMade: number): ShotDiet {
  const twoPts = 2 * Math.max(0, fgMade - threeMade);
  const threePts = 3 * threeMade;
  const ftPts = ftMade;
  const total = twoPts + threePts + ftPts;
  if (total <= 0) return { two: 0, three: 0, ft: 0 };
  return {
    two: (twoPts / total) * 100,
    three: (threePts / total) * 100,
    ft: (ftPts / total) * 100,
  };
}

/**
 * Estimated possessions per game — the standard box-score estimator:
 * POSS ≈ FGA + 0.44 · FTA − OREB + TOV. Used to pace-adjust scoring so a
 * fast team and a slow team can be compared fairly.
 */
export function possessions(fga: number, fta: number, oreb: number, tov: number): number {
  return fga + 0.44 * fta - oreb + tov;
}

/** Points per 100 possessions. */
export function ratingPer100(pointsPerGame: number, pace: number): number {
  return pace > 0 ? (pointsPerGame / pace) * 100 : 0;
}
