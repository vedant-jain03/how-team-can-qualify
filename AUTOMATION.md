# Automation Setup Guide

The GitHub Action in `.github/workflows/update-standings.yml` keeps the
standings fresh automatically — no daily effort from you.

## How it works

```
Every day at 8:30am / 1:30pm / 8:30pm IST
  → GitHub Actions runs update-standings.mjs
  → Script fetches points table from CricAPI
  → Rewrites src/data/teams.js with fresh data
  → If anything changed, commits back to the repo
  → Vercel detects the commit → auto-deploys in ~30s
```

If the API ever fails (outage, rate limit), the script falls back to
the last known static data so the site never goes blank.

---

## One-time setup (15 minutes total)

### Step 1 — Get a CricAPI key

1. Go to [cricapi.com](https://www.cricapi.com) → Sign up (free)
2. Free tier gives you **100 req/day** — enough for 3 polls/day with headroom
3. Copy your API key from the dashboard

### Step 2 — Find the IPL 2026 series ID

```bash
CRIC_API_KEY=your_key_here node scripts/find-series-id.mjs
```

This prints a list of matching series. Copy the ID for "Indian Premier League 2026".

### Step 3 — Paste the series ID into the update script

Open `scripts/update-standings.mjs` and update line 18:

```js
const IPL_SERIES_ID = "paste-your-id-here";
```

Commit and push this change.

### Step 4 — Add your API key to GitHub Secrets

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `CRIC_API_KEY`
4. Value: your CricAPI key
5. Click **Add secret**

### Step 5 — Add your API key to Vercel too (for the live match banner)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add `VITE_CRIC_API_KEY` = your API key
3. Redeploy once

---

## Testing it manually

You can trigger the workflow at any time without waiting for the schedule:

1. Go to your GitHub repo → **Actions** tab
2. Click **"Update IPL Standings"** in the left sidebar
3. Click **"Run workflow"** → **"Run workflow"**

Or run it locally:

```bash
CRIC_API_KEY=your_key_here node scripts/update-standings.mjs
```

---

## Updating topBatter / topBowler

The script auto-updates standings (P/W/L/NRR/PTS) but the top batter/bowler
strings are static in `FALLBACK_TEAMS` inside `update-standings.mjs`.

Update those manually once a week if you care about them — or ignore them.

---

## What if CricAPI changes their response format?

The script logs everything to the GitHub Actions run. If you get a deploy
where nothing changed for a few days, check:

**Actions tab → most recent "Update IPL Standings" run → logs**

Common fixes:
- Series ID changed (new season) → re-run `find-series-id.mjs`
- API field names changed → update the field mapping in `mergeTeams()`
- Rate limit hit → reduce cron frequency to once/day

---

## After IPL 2026 ends

The workflow will keep running but find no changes. To pause it:

Either delete `.github/workflows/update-standings.yml`, or add this to the
top of `update-standings.mjs`:

```js
const SEASON_OVER = true;
if (SEASON_OVER) { console.log("Season over — exiting"); process.exit(0); }
```
