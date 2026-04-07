import { TOTAL_MATCHES, PLAYOFF_THRESHOLD } from "./teams";

export function getPlayoffAnalysis(team) {
  const { pts, nrr, remaining, w, l, nr, p } = team;
  const maxPossible = pts + remaining * 2;
  const winsNeeded = Math.max(0, Math.ceil((PLAYOFF_THRESHOLD - pts) / 2));
  const winsForSafe = Math.ceil((18 - pts) / 2); // ~18 pts = comfortable
  const isEliminated = maxPossible < PLAYOFF_THRESHOLD - 2;
  const isQualified = pts >= 16 && p >= 10;

  let situation = "alive";
  if (isEliminated) situation = "eliminated";
  else if (isQualified) situation = "qualified";
  else if (pts <= 2 && p >= 5) situation = "critical";
  else if (winsNeeded <= 3) situation = "comfortable";

  // NRR outlook
  const nrrGap = nrr < -1 ? "severe" : nrr < 0 ? "poor" : nrr < 0.5 ? "okay" : "good";

  // Build scenario messages
  const scenarios = buildScenarios(team, winsNeeded);

  return {
    maxPossible,
    winsNeeded,
    winsForSafe,
    isEliminated,
    isQualified,
    situation,
    nrrGap,
    scenarios,
    survivalOdds: calcSurvivalOdds(pts, remaining, nrr),
  };
}

function buildScenarios(team, winsNeeded) {
  const { pts, nrr, remaining } = team;
  const list = [];

  if (pts === 0 && remaining <= 11) {
    list.push({
      label: "Minimum path",
      desc: `Win ${winsNeeded} of remaining ${remaining} matches`,
      detail: `That's ${winsNeeded}W from ${remaining} = ${pts + winsNeeded * 2} pts — likely on the bubble`,
      type: "warning",
    });
    list.push({
      label: "Safe path",
      desc: `Win ${Math.min(winsNeeded + 2, remaining)} matches with big margins`,
      detail: `Need to fix NRR (currently ${nrr.toFixed(3)}) — chase quick or win by 50+ runs`,
      type: "info",
    });
    list.push({
      label: "Miracle path",
      desc: `Win 9 of ${remaining} remaining`,
      detail: `18 pts + improved NRR = strong playoff berth. Needs consistent batting AND bowling`,
      type: "success",
    });
  } else if (pts >= 4) {
    const wn = Math.max(0, winsNeeded);
    list.push({
      label: "Steady path",
      desc: `Win ${wn} more from ${remaining} remaining`,
      detail: `${pts + wn * 2} pts should be enough if NRR stays above 0`,
      type: "success",
    });
    list.push({
      label: "Comfortable path",
      desc: `Win ${Math.min(wn + 2, remaining)} to avoid NRR drama`,
      detail: "More wins = more buffer. Don't rely on other results.",
      type: "info",
    });
  } else {
    const wn = winsNeeded;
    list.push({
      label: "Must-win path",
      desc: `${wn} wins needed from ${remaining} games`,
      detail: `Every match from here is critical. No more slip-ups.`,
      type: "warning",
    });
  }

  return list;
}

function calcSurvivalOdds(pts, remaining, nrr) {
  if (pts + remaining * 2 < 12) return 2;
  const base = Math.min(95, Math.max(3, (pts / (pts + remaining * 2)) * 100 * 1.8));
  const nrrBonus = nrr > 0.5 ? 10 : nrr > 0 ? 5 : nrr > -1 ? 0 : -15;
  return Math.round(Math.min(97, Math.max(2, base + nrrBonus)));
}

export function getSimulatedPoints(team, wins, winMarginRuns = 40, lossMarginRuns = 25) {
  const { pts, nrr, remaining } = team;
  const losses = remaining - wins;
  const newPts = pts + wins * 2;
  // rough NRR delta: each big win improves by ~0.02 per run margin over 20 overs
  const nrrDelta = wins * (winMarginRuns * 0.016) - losses * (lossMarginRuns * 0.013);
  const projNRR = parseFloat((nrr + nrrDelta).toFixed(3));
  return { pts: newPts, nrr: projNRR };
}
