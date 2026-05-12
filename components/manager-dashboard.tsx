const metricCards = [
  {
    label: "Draft queue",
    value: "Saved",
    detail: "Generated drafts are retained in PostgreSQL-backed history.",
    tone: "green",
  },
  {
    label: "Reimbursement exposure",
    value: "Tracked next",
    detail: "Claimable hours are saved now; dollar reporting comes next.",
    tone: "yellow",
  },
  {
    label: "Labor variance",
    value: "Checked live",
    detail: "Each generated draft compares requested time to claimable time.",
    tone: "green",
  },
  {
    label: "Audit readiness",
    value: "Guarded",
    detail: "WAM/CDR rules and source notes are registered in the vault.",
    tone: "green",
  },
];

const watchlist = [
  {
    item: "Claims missing key part number",
    owner: "Warranty admin",
    impact: "Can slow reimbursement review",
  },
  {
    item: "Workorder time not matching CDR labor",
    owner: "Service manager",
    impact: "Risk of denied or reduced labor",
  },
  {
    item: "Cleanup time over dealer rule",
    owner: "Reviewer",
    impact: "Needs WAM-backed justification",
  },
];

const sourceStatus = [
  "WAM and CDR transition guide registered",
  "Confidential source PDFs stored off public web root",
  "MST and operation-code source placeholders registered; official references still needed",
  "Production Clerk certificates pending; development Clerk active for testing",
];

export function ManagerDashboard() {
  return (
    <section className="manager-dashboard" aria-labelledby="manager-dashboard-title">
      <div className="dashboard-hero card">
        <div>
          <span className="section-kicker">Manager dashboard</span>
          <h2 id="manager-dashboard-title">Warranty desk command center</h2>
          <p>
            A business snapshot for monitoring claim quality, reimbursement risk, source readiness, and
            what needs attention before this MVP becomes a production workflow.
          </p>
        </div>
        <div className="dashboard-mode">
          <span>Testing mode</span>
          <strong>Clerk development auth</strong>
        </div>
      </div>

      <div className="dashboard-metrics">
        {metricCards.map((card) => (
          <div className={`dashboard-metric ${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <span className="section-kicker">Watchlist</span>
            <h3>Manager review triggers</h3>
          </div>
          <div className="watchlist">
            {watchlist.map((row) => (
              <div className="watchlist-row" key={row.item}>
                <div>
                  <strong>{row.item}</strong>
                  <span>{row.impact}</span>
                </div>
                <em>{row.owner}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <span className="section-kicker">Source health</span>
            <h3>Warranty brain readiness</h3>
          </div>
          <ul className="source-checklist">
            {sourceStatus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="dashboard-panel next-actions">
          <div className="dashboard-panel-header">
            <span className="section-kicker">Next business moves</span>
            <h3>Best steps after MVP testing</h3>
          </div>
          <ol>
            <li>Add dollar-value reimbursement reporting from saved claim history.</li>
            <li>Attach official MST and operation-code source files.</li>
            <li>Turn Obsidian source citations into clickable in-app references.</li>
            <li>Add manager filters by approval state, user, warning count, and date.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
