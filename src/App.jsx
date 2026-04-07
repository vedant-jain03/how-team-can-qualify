import { useState, useEffect, useCallback } from "react";
import { TEAMS } from "./data/teams";
import TeamCard from "./components/TeamCard";
import SlidePanel from "./components/SlidePanel";
import Header from "./components/Header";
import LiveBanner from "./components/LiveBanner";
import "./styles.css";

export default function App() {
  const [teams] = useState(TEAMS);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null);

  // Read initial team from URL ?team=csk
  const initialTeamId = new URLSearchParams(window.location.search).get("team");
  const [selected, setSelected] = useState(
    () => teams.find((t) => t.id === initialTeamId) ?? null
  );

  const handleSelect = useCallback((team) => {
    setSelected((prev) => {
      const next = prev?.id === team.id ? null : team;
      const url = new URL(window.location);
      if (next) url.searchParams.set("team", next.id);
      else url.searchParams.delete("team");
      window.history.pushState({}, "", url);
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setSelected(null);
    const url = new URL(window.location);
    url.searchParams.delete("team");
    window.history.pushState({}, "", url);
  }, []);

  // Try fetching live data from CricAPI (free tier)
  useEffect(() => {
    const CRIC_API_KEY = import.meta.env.VITE_CRIC_API_KEY;
    if (!CRIC_API_KEY) return;

    const fetchLive = async () => {
      try {
        const res = await fetch(
          `https://api.cricapi.com/v1/currentMatches?apikey=${CRIC_API_KEY}&offset=0`
        );
        const data = await res.json();
        if (data.status === "success" && data.data?.length) {
          const ipl = data.data.find(
            (m) => m.series_id === "d5a498c8-7596-4b93-8ab0-e0efc3345312"
          );
          if (ipl) setLiveMatch(ipl);
        }
        setLastUpdated(new Date());
      } catch (e) {
        console.warn("Live fetch failed, using static data");
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    return b.nrr - a.nrr;
  });

  return (
    <div className="app">
      <Header lastUpdated={lastUpdated} />
      {liveMatch && <LiveBanner match={liveMatch} />}

      <main className="main">
        <div className={`grid-area ${selected ? "panel-open" : ""}`}>
          <div className="standings-header">
            <span className="sh-rank">#</span>
            <span className="sh-team">Team</span>
            <span className="sh-stat">P</span>
            <span className="sh-stat">W</span>
            <span className="sh-stat">L</span>
            <span className="sh-pts">PTS</span>
            <span className="sh-nrr">NRR</span>
            <span className="sh-form">Form</span>
          </div>
          <div className="team-list">
            {sortedTeams.map((team, i) => (
              <div key={team.id}>
                <TeamCard
                  team={team}
                  rank={i + 1}
                  isSelected={selected?.id === team.id}
                  isTop4={i < 4}
                  onClick={() => handleSelect(team)}
                />
                {i === 3 && (
                  <div className="qualifier-line">
                    <span className="ql-label">— Playoff qualification line —</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="table-footer">
            <span className="legend-dot top4" /> Top 4 qualify for playoffs
            <span className="legend-dot danger" style={{ marginLeft: 16 }} /> Elimination zone
            <span className="update-note">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Static data · Add VITE_CRIC_API_KEY for live scores"}
            </span>
          </div>
        </div>

        {selected && (
          <div className="mobile-backdrop" onClick={handleClose} />
        )}
        <SlidePanel team={selected} onClose={handleClose} />
      </main>
    </div>
  );
}
