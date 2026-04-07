import { useState, useEffect } from "react";
import { getPlayoffAnalysis, getSimulatedPoints } from "../data/playoff";
import { getTeamSchedule } from "../data/schedule";

const SITUATION_LABELS = {
  qualified: { label: "Qualified", color: "#22c55e" },
  comfortable: { label: "Looking good", color: "#84cc16" },
  alive: { label: "In the race", color: "#f59e0b" },
  critical: { label: "Critical", color: "#ef4444" },
  eliminated: { label: "Eliminated", color: "#6b7280" },
};

const SCENARIO_COLORS = {
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  danger: "#ef4444",
};

export default function SlidePanel({ team, onClose }) {
  const [winMargin, setWinMargin] = useState(40);
  const [tab, setTab] = useState("path");
  // Per-fixture results: null | "W" | "L"
  const [fixtureResults, setFixtureResults] = useState({});

  // Reset when team changes
  useEffect(() => {
    if (team) {
      setFixtureResults({});
      setTab("path");
      setWinMargin(40);
    }
  }, [team?.id]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleFixture = (idx, result) => {
    setFixtureResults((prev) => ({
      ...prev,
      [idx]: prev[idx] === result ? null : result,
    }));
  };

  const wins = Object.values(fixtureResults).filter((r) => r === "W").length;
  const winsSlider = wins; // alias for projection

  if (!team) return <div className="slide-panel closed" />;

  const schedule = getTeamSchedule(team.id);
  const analysis = getPlayoffAnalysis(team);
  const sim = getSimulatedPoints(team, winsSlider, winMargin, 25);
  const situationMeta = SITUATION_LABELS[analysis.situation] || SITUATION_LABELS.alive;
  const bgGradient = `linear-gradient(135deg, ${team.primary}22 0%, ${team.secondary}11 100%)`;
  const decidedCount = Object.values(fixtureResults).filter(Boolean).length;

  return (
    <aside
      className="slide-panel open"
      style={{
        "--panel-primary": team.primary,
        "--panel-accent": team.accent,
        "--panel-text": team.textOnPrimary,
      }}
    >
      {/* Panel header */}
      <div
        className="panel-header"
        style={{ background: team.primary }}
      >
        <div className="panel-title-row">
          <div>
            <div className="panel-team-name" style={{ color: team.textOnPrimary }}>
              {team.name}
            </div>
            <div className="panel-sub" style={{ color: `${team.textOnPrimary}99` }}>
              {team.p} played · {team.remaining} remaining
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="situation-tag"
              style={{ background: situationMeta.color, color: "#fff" }}
            >
              {situationMeta.label}
            </span>
            <button className="panel-close" onClick={onClose} style={{ color: team.textOnPrimary }}>
              ✕
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="panel-stats-row">
          {[
            { label: "Points", value: team.pts },
            { label: "Max possible", value: analysis.maxPossible },
            { label: "Wins needed", value: analysis.winsNeeded },
            { label: "NRR", value: (team.nrr >= 0 ? "+" : "") + team.nrr.toFixed(3) },
          ].map((s) => (
            <div key={s.label} className="panel-stat">
              <div className="ps-value" style={{ color: team.textOnPrimary }}>{s.value}</div>
              <div className="ps-label" style={{ color: `${team.textOnPrimary}88` }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        {["path", "sim", "squad"].map((t) => (
          <button
            key={t}
            className={`ptab ${tab === t ? "active" : ""}`}
            style={tab === t ? { borderBottomColor: team.primary, color: team.primary } : {}}
            onClick={() => setTab(t)}
          >
            {{ path: "Playoff path", sim: "Scenario sim", squad: "Key players" }[t]}
          </button>
        ))}
      </div>

      <div className="panel-body" style={{ background: bgGradient }}>
        {/* PLAYOFF PATH TAB */}
        {tab === "path" && (
          <div className="tab-content">
            {/* Survival meter */}
            <div className="section-block">
              <div className="section-label">Playoff probability</div>
              <div className="survival-bar-wrap">
                <div className="survival-bar-bg">
                  <div
                    className="survival-bar-fill"
                    style={{
                      width: `${analysis.survivalOdds}%`,
                      background: analysis.survivalOdds > 60 ? team.primary : analysis.survivalOdds > 30 ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="survival-pct">{analysis.survivalOdds}%</span>
              </div>
            </div>

            {/* NRR status */}
            <div className="section-block">
              <div className="section-label">NRR health</div>
              <div className={`nrr-status nrr-${analysis.nrrGap}`}>
                {{
                  good: "✅ NRR is healthy — maintain it",
                  okay: "🟡 NRR is fine — room to improve",
                  poor: "🟠 NRR is negative — need big wins",
                  severe: "🔴 NRR is critical — must win by big margins",
                }[analysis.nrrGap]}
              </div>
            </div>

            {/* Scenarios */}
            <div className="section-block">
              <div className="section-label">Scenarios</div>
              {analysis.scenarios.map((s, i) => (
                <div key={i} className="scenario-card" style={{ borderLeft: `3px solid ${SCENARIO_COLORS[s.type]}` }}>
                  <div className="scenario-label" style={{ color: SCENARIO_COLORS[s.type] }}>
                    {s.label}
                  </div>
                  <div className="scenario-desc">{s.desc}</div>
                  <div className="scenario-detail">{s.detail}</div>
                </div>
              ))}
            </div>

            {/* Magic number */}
            {!analysis.isEliminated && (
              <div className="section-block">
                <div className="magic-number-card" style={{ background: `${team.primary}18`, border: `1px solid ${team.primary}40` }}>
                  <div className="mn-label">Magic number</div>
                  <div className="mn-value" style={{ color: team.primary }}>
                    {analysis.winsNeeded}
                  </div>
                  <div className="mn-sub">
                    wins needed from {team.remaining} remaining to realistically qualify
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCENARIO SIMULATOR TAB */}
        {tab === "sim" && (
          <div className="tab-content">

            {/* Live projection bar */}
            <div className="projection-card" style={{ background: `${team.primary}15`, borderColor: `${team.primary}40` }}>
              <div className="proj-row">
                <div className="proj-item">
                  <div className="proj-label">Projected pts</div>
                  <div className="proj-val" style={{ color: team.primary }}>{sim.pts}</div>
                </div>
                <div className="proj-item">
                  <div className="proj-label">Est. NRR</div>
                  <div className={`proj-val ${sim.nrr >= 0 ? "pos" : "neg"}`}>
                    {sim.nrr >= 0 ? "+" : ""}{sim.nrr.toFixed(3)}
                  </div>
                </div>
                <div className="proj-item">
                  <div className="proj-label">Record</div>
                  <div className="proj-val" style={{ fontSize: 14 }}>
                    <span style={{ color: "#22c55e" }}>{wins}W</span>
                    <span style={{ color: "var(--text3)", margin: "0 2px" }}>/</span>
                    <span style={{ color: "#ef4444" }}>{Object.values(fixtureResults).filter(r => r === "L").length}L</span>
                  </div>
                </div>
              </div>
              <div className="proj-verdict">
                {sim.pts >= 18 ? (
                  <span className="verdict-chip good">🏆 Strong playoff contender</span>
                ) : sim.pts >= 14 && sim.nrr > -0.5 ? (
                  <span className="verdict-chip maybe">🤞 On the bubble</span>
                ) : sim.pts >= 14 ? (
                  <span className="verdict-chip warn">⚠️ NRR is the problem</span>
                ) : decidedCount > 0 ? (
                  <span className="verdict-chip bad">😬 Not enough — tap matches to build your scenario</span>
                ) : (
                  <span className="verdict-chip" style={{ color: "var(--text3)" }}>👇 Tap each match — W or L</span>
                )}
              </div>
            </div>

            {/* Win margin slider */}
            <div className="section-block">
              <div className="section-label">Avg win margin assumption</div>
              <div className="slider-group">
                <input
                  type="range" min={10} max={80} value={winMargin} step={5}
                  onChange={(e) => setWinMargin(+e.target.value)}
                  style={{ accentColor: team.primary }}
                />
                <div className="slider-labels">
                  <span>10 runs</span>
                  <span className="slider-val" style={{ color: team.primary }}>{winMargin} runs</span>
                  <span>80 runs</span>
                </div>
              </div>
            </div>

            {/* Per-fixture toggle list */}
            <div className="section-block">
              <div className="section-label" style={{ marginBottom: 10 }}>
                Remaining fixtures — tap to set result
              </div>
              <div className="fixture-list">
                {schedule.map((fixture, idx) => {
                  const res = fixtureResults[idx];
                  return (
                    <div key={idx} className="fixture-row">
                      <span className="fix-num">{team.p + idx + 1}</span>
                      <span className="fix-vs">
                        <span className="fix-ha">{fixture.home ? "vs" : "@"}</span>
                        <span className="fix-opp">{fixture.opp}</span>
                      </span>
                      <div className="fix-btns">
                        <button
                          className={`fix-btn win-btn ${res === "W" ? "active-w" : ""}`}
                          style={res === "W" ? { background: "#22c55e22", color: "#16a34a", borderColor: "#22c55e66" } : {}}
                          onClick={() => toggleFixture(idx, "W")}
                        >W</button>
                        <button
                          className={`fix-btn lose-btn ${res === "L" ? "active-l" : ""}`}
                          style={res === "L" ? { background: "#ef444422", color: "#dc2626", borderColor: "#ef444466" } : {}}
                          onClick={() => toggleFixture(idx, "L")}
                        >L</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {decidedCount > 0 && (
                <button
                  className="reset-btn"
                  onClick={() => setFixtureResults({})}
                >Reset all</button>
              )}
            </div>
          </div>
        )}

        {/* SQUAD / KEY PLAYERS TAB */}
        {tab === "squad" && (
          <div className="tab-content">
            <div className="section-block">
              <div className="section-label">Top performers</div>
              <div className="squad-card">
                <div className="squad-role">🏏 Top batter</div>
                <div className="squad-name">{team.topBatter}</div>
              </div>
              <div className="squad-card">
                <div className="squad-role">🎳 Top bowler</div>
                <div className="squad-name">{team.topBowler}</div>
              </div>
            </div>
            <div className="section-block">
              <div className="section-label">Season stats</div>
              <div className="stats-grid">
                {[
                  { label: "Matches played", value: team.p },
                  { label: "Wins", value: team.w },
                  { label: "Losses", value: team.l },
                  { label: "No results", value: team.nr },
                  { label: "Points", value: team.pts },
                  { label: "NRR", value: (team.nrr >= 0 ? "+" : "") + team.nrr.toFixed(3) },
                ].map((s) => (
                  <div key={s.label} className="sg-cell">
                    <div className="sg-val" style={{ color: team.primary }}>{s.value}</div>
                    <div className="sg-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section-block">
              <div className="section-label">Recent form</div>
              <div className="form-row-big">
                {team.recentForm.map((r, i) => (
                  <span
                    key={i}
                    className="form-big"
                    style={{
                      background: r === "W" ? "#22c55e22" : r === "L" ? "#ef444422" : "#94a3b822",
                      color: r === "W" ? "#16a34a" : r === "L" ? "#dc2626" : "#64748b",
                      border: `1px solid ${r === "W" ? "#16a34a44" : r === "L" ? "#dc262644" : "#64748b44"}`,
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
