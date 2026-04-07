# 🏏 IPL 2026 Playoff Tracker

Live standings, playoff paths, and scenario simulator for all 10 IPL teams.

## Features

- **Per-team colors** — every team card uses its authentic brand colors
- **Slide-out panel** — click any team to see their playoff path
- **Playoff path tab** — survival %, magic number, NRR health, scenarios
- **Scenario simulator** — drag a slider to simulate wins remaining
- **Key players tab** — top batter/bowler + season stats
- **Live scores** — optional CricAPI integration (see below)

## Setup

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

That's it. One command. Vercel auto-detects Vite.

## Live Scores (optional)

The app works great with static data out of the box. To enable live score fetching:

1. Sign up for a free API key at [cricapi.com](https://www.cricapi.com/)
2. Create a `.env.local` file:

```
VITE_CRIC_API_KEY=your_key_here
```

3. The app will auto-fetch live matches every 60 seconds and show a LIVE banner.

> **Free tier**: 100 requests/day. Enough for ~1.5 hours of polling at 60s intervals. For a fan site with many users, consider caching on the server side or using Vercel Edge Functions to proxy and cache the API response.

## Updating standings

Edit `src/data/teams.js` after each match day — just update `p`, `w`, `l`, `nr`, `pts`, `nrr`, and `recentForm` for each team.

The playoff logic in `src/data/playoff.js` recalculates everything automatically.

## Customising

- **Colors**: Each team has `primary`, `secondary`, `accent`, `textOnPrimary` in `teams.js`
- **Playoff threshold**: Change `PLAYOFF_THRESHOLD` in `teams.js` (default: 14)
- **Adding matches**: Update `remaining` count per team after each game

## Structure

```
src/
  App.jsx              — main layout, grid + panel
  styles.css           — all styling, dark theme
  data/
    teams.js           — team data + colors
    playoff.js         — playoff math + scenarios
  components/
    Header.jsx         — top nav
    LiveBanner.jsx     — live match strip
    TeamCard.jsx       — single team row
    SlidePanel.jsx     — right-side detail panel
```
