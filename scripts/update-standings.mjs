/**
 * scripts/update-standings.mjs
 *
 * Fetches the current IPL 2026 points table from CricAPI and rewrites
 * src/data/teams.js with fresh standings data.
 *
 * Runs via GitHub Actions daily. Also runnable locally:
 *   CRIC_API_KEY=yourkey node scripts/update-standings.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEAMS_FILE = path.join(__dirname, "../src/data/teams.js");

// IPL 2026 series ID on CricAPI
const IPL_SERIES_ID = "your-ipl-2026-series-id"; // UPDATE after checking CricAPI

const API_KEY = process.env.CRIC_API_KEY;
if (!API_KEY) {
  console.error("❌  CRIC_API_KEY env var not set");
  process.exit(1);
}

// ─── Static team metadata (colors, emoji — never changes) ───────────────────
const TEAM_META = {
  "Punjab Kings":                  { id: "pbks", shortName: "PBKS", primary: "#ED1B24", secondary: "#DCDDDE", accent: "#fff",    textOnPrimary: "#fff",    emoji: "🦁" },
  "Royal Challengers Bengaluru":   { id: "rcb",  shortName: "RCB",  primary: "#EC1C24", secondary: "#000000", accent: "#C8A84B", textOnPrimary: "#fff",    emoji: "🔥" },
  "Rajasthan Royals":              { id: "rr",   shortName: "RR",   primary: "#254AA5", secondary: "#FFC72C", accent: "#FFC72C", textOnPrimary: "#fff",    emoji: "👑" },
  "Delhi Capitals":                { id: "dc",   shortName: "DC",   primary: "#0078BC", secondary: "#EF1C25", accent: "#EF1C25", textOnPrimary: "#fff",    emoji: "⚡" },
  "Sunrisers Hyderabad":           { id: "srh",  shortName: "SRH",  primary: "#F26522", secondary: "#000000", accent: "#FDB913", textOnPrimary: "#fff",    emoji: "☀️" },
  "Mumbai Indians":                { id: "mi",   shortName: "MI",   primary: "#004BA0", secondary: "#D1AB3E", accent: "#D1AB3E", textOnPrimary: "#fff",    emoji: "💙" },
  "Lucknow Super Giants":          { id: "lsg",  shortName: "LSG",  primary: "#A0CFF0", secondary: "#FFCC00", accent: "#FFCC00", textOnPrimary: "#002D5B", emoji: "🦅" },
  "Kolkata Knight Riders":         { id: "kkr",  shortName: "KKR",  primary: "#3A225D", secondary: "#B3A123", accent: "#B3A123", textOnPrimary: "#B3A123", emoji: "🕵️" },
  "Gujarat Titans":                { id: "gt",   shortName: "GT",   primary: "#1C1C1C", secondary: "#1D9BF0", accent: "#1D9BF0", textOnPrimary: "#1D9BF0", emoji: "🏔️" },
  "Chennai Super Kings":           { id: "csk",  shortName: "CSK",  primary: "#F5C400", secondary: "#0081E9", accent: "#0081E9", textOnPrimary: "#111111", emoji: "🦁" },
};

// Fallback static data — used if API fails, so the site never breaks
const FALLBACK_TEAMS = [
  { name: "Punjab Kings",               p: 3,  w: 2, l: 0, nr: 1, pts: 5,  nrr:  0.637, remaining: 11, recentForm: ["W","NR","W"], topBatter: "Cooper Connolly (108 runs)",  topBowler: "V. Vyshak (5 wkts)"    },
  { name: "Royal Challengers Bengaluru",p: 2,  w: 2, l: 0, nr: 0, pts: 4,  nrr:  2.501, remaining: 12, recentForm: ["W","W"],     topBatter: "Devdutt Padikkal (111 runs)", topBowler: "Jacob Duffy (5 wkts)"  },
  { name: "Rajasthan Royals",           p: 2,  w: 2, l: 0, nr: 0, pts: 4,  nrr:  2.233, remaining: 12, recentForm: ["W","W"],     topBatter: "Riyan Parag",                topBowler: "Ravi Bishnoi (5 wkts)" },
  { name: "Delhi Capitals",             p: 2,  w: 2, l: 0, nr: 0, pts: 4,  nrr:  1.170, remaining: 12, recentForm: ["W","W"],     topBatter: "Sameer Rizvi (160 runs)",    topBowler: "T. Natarajan (4 wkts)" },
  { name: "Sunrisers Hyderabad",        p: 3,  w: 1, l: 2, nr: 0, pts: 2,  nrr:  0.275, remaining: 11, recentForm: ["L","L","W"], topBatter: "H. Klaasen (145 runs)",      topBowler: "Harsh Dubey (4 wkts)"  },
  { name: "Mumbai Indians",             p: 2,  w: 1, l: 1, nr: 0, pts: 2,  nrr: -0.206, remaining: 12, recentForm: ["L","W"],     topBatter: "Rohit Sharma (113 runs)",    topBowler: "Jasprit Bumrah"        },
  { name: "Lucknow Super Giants",       p: 2,  w: 1, l: 1, nr: 0, pts: 2,  nrr: -0.542, remaining: 12, recentForm: ["L","W"],     topBatter: "Nicholas Pooran",            topBowler: "Prince Yadav (4 wkts)" },
  { name: "Kolkata Knight Riders",      p: 3,  w: 0, l: 2, nr: 1, pts: 1,  nrr: -1.964, remaining: 11, recentForm: ["NR","L","L"],topBatter: "A. Raghuvanshi (103 runs)",  topBowler: "Varun Chakravarthy"    },
  { name: "Gujarat Titans",             p: 2,  w: 0, l: 2, nr: 0, pts: 0,  nrr: -0.424, remaining: 12, recentForm: ["L","L"],     topBatter: "Shubman Gill",               topBowler: "Prasidh Krishna (4 wkts)"},
  { name: "Chennai Super Kings",        p: 3,  w: 0, l: 3, nr: 0, pts: 0,  nrr: -2.517, remaining: 11, recentForm: ["L","L","L"], topBatter: "Sarfaraz Khan (99 runs)",    topBowler: "Anshul Kamboj (5 wkts)"},
];

// ─── Fetch points table from CricAPI ────────────────────────────────────────
async function fetchStandings() {
  const url = `https://api.cricapi.com/v1/series_points?apikey=${API_KEY}&id=${IPL_SERIES_ID}`;
  console.log("📡 Fetching standings from CricAPI...");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  if (json.status !== "success") throw new Error(`API error: ${json.reason || "unknown"}`);

  return json.data; // array of team standing objects
}

// ─── Fetch recent match results per team ────────────────────────────────────
async function fetchRecentForm() {
  const url = `https://api.cricapi.com/v1/series_matches?apikey=${API_KEY}&id=${IPL_SERIES_ID}`;
  const res = await fetch(url);
  if (!res.ok) return {};

  const json = await res.json();
  if (json.status !== "success") return {};

  // Build a map of teamName → last 3 results ["W","L","W"]
  const formMap = {};
  const matches = (json.data || [])
    .filter((m) => m.matchStarted && m.matchEnded)
    .slice(-30); // last 30 completed matches

  for (const match of matches) {
    if (!match.teams || !match.winner) continue;
    for (const team of match.teams) {
      if (!formMap[team]) formMap[team] = [];
      const result = match.winner === team ? "W"
        : match.winner === "NR" ? "NR"
        : "L";
      formMap[team].unshift(result); // newest first
    }
  }

  // Trim to last 3
  for (const t of Object.keys(formMap)) {
    formMap[t] = formMap[t].slice(0, 3);
  }

  return formMap;
}

// ─── Merge API data with static metadata ────────────────────────────────────
function mergeTeams(standings, formMap, fallback) {
  return standings.map((s) => {
    const name = s.teamname;
    const meta = TEAM_META[name];
    if (!meta) {
      console.warn(`⚠️  Unknown team name from API: "${name}" — skipping`);
      return null;
    }

    // Find fallback for static fields like topBatter/topBowler
    const fb = fallback.find((f) => f.name === name) || {};

    const p   = parseInt(s.matchesPlayed ?? s.played ?? 0);
    const w   = parseInt(s.win ?? s.won ?? 0);
    const l   = parseInt(s.loss ?? s.lost ?? 0);
    const nr  = parseInt(s.nr ?? s.noResult ?? 0);
    const pts = parseInt(s.points ?? s.pts ?? 0);
    const nrr = parseFloat(s.nrr ?? s.netRunRate ?? 0);
    const remaining = 14 - p;
    const recentForm = formMap[name] || fb.recentForm || ["?","?","?"];

    return {
      ...meta,
      name,
      p, w, l, nr, pts, nrr,
      remaining,
      recentForm,
      topBatter: fb.topBatter || "—",
      topBowler: fb.topBowler || "—",
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
// Do not edit manually — changes will be overwritten on next run.
// To update manually, run: CRIC_API_KEY=yourkey node scripts/update-standings.mjs

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
  let teams;

  try {
    const [standings, formMap] = await Promise.all([
      fetchStandings(),
      fetchRecentForm(),
    ]);

    teams = mergeTeams(standings, formMap, FALLBACK_TEAMS);

    if (teams.length === 0) {
      throw new Error("API returned 0 teams — using fallback");
    }

    console.log(`📊  Got standings for ${teams.length} teams`);
  } catch (err) {
    console.error(`⚠️  API fetch failed: ${err.message}`);
    console.log("📦  Using fallback static data instead");

    teams = FALLBACK_TEAMS.map((t) => ({
      ...TEAM_META[t.name],
      ...t,
    }));
  }

  writeTeamsFile(teams);
}

main();
