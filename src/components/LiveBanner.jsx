export default function LiveBanner({ match }) {
  if (!match) return null;
  return (
    <div className="live-banner">
      <span className="live-dot" />
      <span className="live-label">LIVE</span>
      <span className="live-teams">{match.name}</span>
      {match.score?.map((s, i) => (
        <span key={i} className="live-score">
          {s.inning}: {s.r}/{s.w} ({s.o} ov)
        </span>
      ))}
    </div>
  );
}
