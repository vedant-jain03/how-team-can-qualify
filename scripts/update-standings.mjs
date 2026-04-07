/**
 * scripts/update-standings.mjs
 *
 * Fetches the current IPL 2026 points table from the official iplt20.com
 * backend (S3-hosted JSONP feed) — no API key required.
 *
 * Runs via GitHub Actions 3x/day. Also runnable locally:
 *   node scripts/update-standings.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAMS_FILE = path.join(__dirname, "../src/data/teams.js");

// Official iplt20.com JSONP feed — no auth needed
const STANDINGS_URL =
  "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/stats/284-groupstandings.js";

// ─── Static team metadata (colors, emoji — never changes) ───────────────────
const TEAM_META = {
  CSK:  { id: "csk",  name: "Chennai Super Kings",          shortName: "CSK",  primary: "#F5C400", secondary: "#0081E9", accent: "#0081E9", textOnPrimary: "#111111", emoji: "🦁" },
  MI:   { id: "mi",   name: "Mumbai Indians",               shortName: "MI",   primary: "#004BA0", secondary: "#D1AB3E", accent: "#D1AB3E", textOnPrimary: "#fff",    emoji: "💙" },
  RCB:  { id: "rcb",  name: "Royal Challengers Bengaluru",  shortName: "RCB",  primary: "#EC1C24", secondary: "#000000", accent: "#C8A84B", textOnPrimary: "#fff",    emoji: "🔥" },
  DC:   { id: "dc",   name: "Delhi Capitals",               shortName: "DC",   primary: "#0078BC", secondary: "#EF1C25", accent: "#EF1C25", textOnPrimary: "#fff",    emoji: "⚡" },
  PBKS: { id: "pbks", name: "Punjab Kings",                 shortName: "PBKS", primary: "#ED1B24", secondary: "#DCDDDE", accent: "#fff",    textOnPrimary: "#fff",    emoji: "🦁" },
  KKR:  { id: "kkr",  name: "Kolkata Knight Riders",        shortName: "KKR",  primary: "#3A225D", secondary: "#B3A123", accent: "#B3A123", textOnPrimary: "#B3A123", emoji: "🕵️" },
  SRH:  { id: "srh",  name: "Sunrisers Hyderabad",          shortName: "SRH",  primary: "#F26522", secondary: "#000000", accent: "#FDB913", textOnPrimary: "#fff",    emoji: "☀️" },
  RR:   { id: "rr",   name: "Rajasthan Royals",             shortName: "RR",   primary: "#254AA5", secondary: "#FFC72C", accent: "#FFC72C", textOnPrimary: "#fff",    emoji: "👑" },
  GT:   { id: "gt",   name: "Gujarat Titans",               shortName: "GT",   primary: "#1C1C1C", secondary: "#1D9BF0", accent: "#1D9BF0", textOnPrimary: "#1D9BF0", emoji: "🏔️" },
  LSG:  { id: "lsg",  name: "Lucknow Super Giants",         shortName: "LSG",  primary: "#A0CFF0", secondary: "#FFCC00", accent: "#FFCC00", textOnPrimary: "#002D5B", emoji: "🦅" },
};


// ─── Fetch & parse JSONP from iplt20.com ────────────────────────────────────
async function fetchStandings() {
  console.log("📡 Fetching standings from iplt20.com S3 feed...");

  const res = await fetch(STANDINGS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ipl-tracker-bot/1.0)" },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();

  // Strip JSONP wrapper: ongroupstandings({...}) → {...}
  const match = text.match(/ongroupstandings\s*\(\s*(\{[\s\S]*\})\s*\)/);
  if (!match) throw new Error("Unexpected JSONP format — could not parse response");

  const data = JSON.parse(match[1]);
  // Response structure: { points: [ {...team...}, ... ] }
  const rows = data?.points;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No standings rows in response");
  }

  return rows;
}

// ─── Parse Performance string → recentForm array ────────────────────────────
// Performance field looks like: "W 1,L 2,N 3" or "W,W,L" — varies by season
function parseForm(perf) {
  if (!perf) return [];
  // Split on comma, take the letter before space or end
  return perf
    .split(",")
    .map((s) => {
      const c = s.trim()[0];
      if (c === "W") return "W";
      if (c === "L") return "L";
      if (c === "N") return "NR";
      return null;
    })
    .filter(Boolean)
    .slice(0, 5); // newest first, max 5
}

// ─── Merge API rows with static metadata ────────────────────────────────────
function mergeTeams(rows) {
  return rows.map((r) => {
    const code = r.TeamCode?.trim().toUpperCase();
    const meta = TEAM_META[code];
    if (!meta) {
      console.warn(`⚠️  Unknown team code: "${code}" — skipping`);
      return null;
    }

    const p   = parseInt(r.Matches   ?? 0);
    const w   = parseInt(r.Wins      ?? 0);
    const l   = parseInt(r.Loss      ?? 0);
    const nr  = parseInt(r.NoResult  ?? 0);
    const pts = parseInt(r.Points    ?? 0);
    const nrr = parseFloat(r.NetRunRate ?? 0);

    return {
      ...meta,
      p, w, l, nr, pts,
      nrr: parseFloat(nrr.toFixed(3)),
      remaining: 14 - p,
      recentForm: parseForm(r.Performance),
      topBatter: "—",
      topBowler: "—",
    };
  }).filter(Boolean);
}

// ─── Write teams.js ──────────────────────────────────────────────────────────
function writeTeamsFile(teams) {
  const now = new Date().toISOString();

  const teamLines = teams.map((t) => {
    const form = JSON.stringify(t.recentForm);
    return `  {
    id: "${t.id}",
    name: "${t.name}",
    shortName: "${t.shortName}",
    primary: "${t.primary}",
    secondary: "${t.secondary}",
    accent: "${t.accent}",
    textOnPrimary: "${t.textOnPrimary}",
    emoji: "${t.emoji}",
    p: ${t.p}, w: ${t.w}, l: ${t.l}, nr: ${t.nr}, pts: ${t.pts}, nrr: ${t.nrr},
    remaining: ${t.remaining},
    recentForm: ${form},
    topBatter: "${t.topBatter}",
    topBowler: "${t.topBowler}",
  }`;
  }).join(",\n");

  const content = `// AUTO-GENERATED by scripts/update-standings.mjs
// Last updated: ${now}
// Source: iplt20.com official S3 feed (no API key required)
// Do not edit manually — changes will be overwritten on next run.

export const TEAMS = [
${teamLines}
];

export const TOTAL_MATCHES = 14;
export const PLAYOFF_SPOTS = 4;
export const PLAYOFF_THRESHOLD = 14;
`;

  fs.writeFileSync(TEAMS_FILE, content, "utf8");
  console.log(`✅  Wrote ${teams.length} teams to src/data/teams.js`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const rows = await fetchStandings();
  const teams = mergeTeams(rows);

  if (teams.length === 0) throw new Error("Got 0 teams from feed — something is wrong");

  console.log(`📊  Got standings for ${teams.length} teams`);
  writeTeamsFile(teams);
}

main();
