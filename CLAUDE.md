# IPL 2026 Playoff Tracker — Claude Code Guide

You are the sole developer agent for this project. The owner is a CSK fan who
does not watch every match and wants zero daily maintenance. Your job is to keep
the site accurate, working, and deployed — on request or autonomously.

---

## Project overview

A React + Vite fan site deployed on Vercel. Shows IPL 2026 standings, lets
users click any team to see a slide-out panel with their playoff path, a
per-fixture scenario simulator, and key player stats.

**Live URL:** (update this once deployed)
**GitHub repo:** (update this once set up)
**Vercel project:** (update this once deployed)

---

## File map — know this cold

```
src/data/teams.js          ← THE most important file. All standings live here.
src/data/playoff.js        ← Playoff math: survival odds, magic number, scenarios
src/data/schedule.js       ← Remaining fixtures per team (home/away)
src/components/TeamCard    ← One row in the standings table
src/components/SlidePanel  ← The slide-out detail panel (3 tabs)
src/components/Header      ← Top nav
src/components/LiveBanner  ← Shows during live matches if API key is set
src/App.jsx                ← Layout, sorting, qualifier divider line
src/styles.css             ← All CSS, dark theme, mobile drawer
scripts/update-standings.mjs   ← Node script that rewrites teams.js from API
scripts/find-series-id.mjs     ← One-time helper to find CricAPI series ID
.github/workflows/update-standings.yml  ← GitHub Action: runs 3x/day
AUTOMATION.md              ← Step-by-step automation setup guide
```

---

## Data model — `src/data/teams.js`

Each team object has these fields:

```js
{
  id: "csk",                    // lowercase slug — never change
  name: "Chennai Super Kings",  // full name — must match CricAPI exactly
  shortName: "CSK",             // 2-3 char abbreviation
  primary: "#F5C400",           // brand color (used for card accent + panel header)
  secondary: "#0081E9",
  accent: "#0081E9",
  textOnPrimary: "#111111",     // readable text on primary bg (check contrast!)
  emoji: "🦁",
  p: 3,          // matches played
  w: 0,          // wins
  l: 3,          // losses
  nr: 0,         // no results / abandoned
  pts: 0,        // points (win=2, nr=1, loss=0)
  nrr: -2.517,   // net run rate (3 decimal places)
  remaining: 11, // = 14 - p (always keep in sync)
  recentForm: ["L", "L", "L"],  // newest first, max 5, values: "W" | "L" | "NR"
  topBatter: "Sarfaraz Khan (99 runs)",
  topBowler: "Anshul Kamboj (5 wkts)",
}
```

**Rules when editing standings:**
- Always recalculate `remaining = 14 - p`
- `pts = (w * 2) + nr`  — double-check this
- NRR to exactly 3 decimal places
- `recentForm` newest result goes at index 0 (left = most recent)
- Never change `id`, `primary`, `secondary`, `accent`, `textOnPrimary`, `emoji`

---

## Common tasks — do these without asking

### "Update standings after today's match"
1. Use web search to find today's IPL result and updated points table
2. Update the relevant teams in `src/data/teams.js`
3. Verify `remaining`, `pts`, `recentForm` are all consistent
4. Run `git add src/data/teams.js && git commit -m "chore: update standings after [TeamA] vs [TeamB]" && git push`
5. Vercel auto-deploys — confirm by checking the live URL

### "Update all standings"
1. Search for the current full IPL 2026 points table
2. Update every team's `p`, `w`, `l`, `nr`, `pts`, `nrr`, `remaining`, `recentForm`
3. Commit and push

### "Update CSK's result — they won/lost by X runs"
1. Update CSK's stats in teams.js
2. Add "W" or "L" to the front of `recentForm`, trim to last 5
3. Recalculate NRR if you have innings data, otherwise leave a note
4. Commit and push

### "Add a new feature"
- Read `src/App.jsx` and `src/styles.css` before touching anything
- The dark theme uses CSS variables — always use `var(--text)`, `var(--bg)` etc, never hardcoded colors
- Per-team colors come from `--team-primary` / `--panel-primary` CSS vars set inline
- Test responsiveness: the panel becomes a bottom drawer on mobile (<768px)
- Never change team `id` values — they're used as React keys and in `schedule.js`

### "Fix a bug"
1. Read the relevant component first — don't guess
2. Check `playoff.js` if the math looks wrong
3. Don't touch `id`, colors, or emoji fields while fixing unrelated bugs

### "The GitHub Action isn't running / API is broken"
1. Check `.github/workflows/update-standings.yml` — is the cron correct?
2. Check `scripts/update-standings.mjs` — is `IPL_SERIES_ID` set?
3. Verify `CRIC_API_KEY` secret exists in GitHub repo settings
4. Test locally: `CRIC_API_KEY=xxx node scripts/update-standings.mjs`
5. The script has a fallback — if API fails it uses last known static data

### "Deploy to Vercel"
```bash
npm install
vercel          # first time: follow prompts
vercel --prod   # subsequent deploys
```
Vercel also auto-deploys on every git push to main.

### "Run the dev server"
```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Commit message conventions

```
chore: update standings after CSK vs MI (match 14)
chore: update all standings — Apr 12
feat: add X feature
fix: Y bug in SlidePanel
style: tweak Z color
```

Always push after committing — Vercel needs the push to trigger a deploy.

---

## NRR calculation (if innings data is available)

```
NRR = (runs scored / overs faced) - (runs conceded / overs bowled)
      across ALL matches in the season
```

If you only have match-level data, approximate:
- Win by 40 runs → NRR improves by ~+0.05 to +0.08
- Lose by 30 runs → NRR drops by ~-0.04 to -0.06
- When in doubt, search for the exact updated NRR from ESPNcricinfo or iplt20.com

---

## Playoff qualification rules

- Top 4 teams by points qualify
- Tiebreaker: NRR
- Each team plays 14 league matches
- `PLAYOFF_THRESHOLD` in teams.js is set to 14 — the historically typical cutoff
- The playoff math in `playoff.js` uses this threshold — update it if the cutoff shifts

---

## Sources to trust for standings data

In order of preference:
1. `iplt20.com/points-table/men` — official IPL site
2. `espncricinfo.com/series/ipl-2026-*/points-table-standings`
3. `bcci.tv`
4. News articles (cross-check NRR carefully — they often round differently)

---

## What NOT to do

- Don't change team color values (`primary`, `secondary`, `accent`) — these are brand colors
- Don't reorder teams manually in teams.js — App.jsx sorts by pts/NRR at runtime
- Don't commit node_modules
- Don't add new dependencies without checking bundle size impact
- Don't hardcode colors in JSX — use the CSS variable system
- Don't run `npm run build` unless testing — Vercel builds on deploy

---

## Project owner context

- CSK fan, based in Bangalore
- Doesn't watch every match — only CSK games
- Wants the site to run itself with zero daily effort
- Side project — keep it simple, don't over-engineer
- Deploys on Vercel, code on GitHub
