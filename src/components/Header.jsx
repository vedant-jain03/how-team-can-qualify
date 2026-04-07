export default function Header({ lastUpdated }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <span className="brand-icon">🏏</span>
          <div>
            <h1 className="brand-title">IPL 2026</h1>
            <p className="brand-sub">Playoff Tracker</p>
          </div>
        </div>
        <div className="header-meta">
          <span className="season-badge">Season 19</span>
          <span className="matches-badge">74 matches · Mar–Jun 2026</span>
        </div>
      </div>
    </header>
  );
}
