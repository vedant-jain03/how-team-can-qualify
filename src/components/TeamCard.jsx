export default function TeamCard({ team, rank, isSelected, isTop4, onClick }) {
  const isBottom = rank > 7;
  const formColors = { W: "#22c55e", L: "#ef4444", NR: "#94a3b8" };

  return (
    <div
      className={`team-card ${isSelected ? "selected" : ""} ${isTop4 ? "top4" : ""} ${isBottom ? "danger-zone" : ""}`}
      onClick={onClick}
      style={{
        "--team-primary": team.primary,
        "--team-secondary": team.secondary,
        "--team-accent": team.accent,
        "--team-text": team.textOnPrimary,
        borderLeft: isSelected ? `4px solid ${team.primary}` : isTop4 ? `4px solid ${team.primary}40` : "4px solid transparent",
      }}
    >
      {/* Rank */}
      <span className="tc-rank">
        {isTop4 ? <span className="rank-num playoff">{rank}</span> : <span className="rank-num">{rank}</span>}
      </span>

      {/* Team identity */}
      <span className="tc-team">
        <span
          className="team-dot"
          style={{ background: team.primary, border: `2px solid ${team.accent}` }}
        />
        <span className="team-abbr">{team.shortName}</span>
        <span className="team-fullname">{team.name}</span>
      </span>

      {/* Stats */}
      <span className="tc-stat">{team.p}</span>
      <span className="tc-stat">{team.w}</span>
      <span className="tc-stat">{team.l}</span>

      {/* Points */}
      <span className="tc-pts">
        <span
          className="pts-badge"
          style={isSelected ? { background: team.primary, color: team.textOnPrimary } : {}}
        >
          {team.pts}
        </span>
      </span>

      {/* NRR */}
      <span className={`tc-nrr ${team.nrr >= 0 ? "pos" : "neg"}`}>
        {team.nrr >= 0 ? "+" : ""}{team.nrr.toFixed(3)}
      </span>

      {/* Form */}
      <span className="tc-form">
        {team.recentForm.map((r, i) => (
          <span
            key={i}
            className="form-pip"
            style={{ background: formColors[r] || "#94a3b8" }}
            title={r}
          />
        ))}
      </span>

      {/* Arrow */}
      <span className={`tc-arrow ${isSelected ? "open" : ""}`}>›</span>
    </div>
  );
}
