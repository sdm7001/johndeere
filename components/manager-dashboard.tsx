import type { DashboardMetrics } from "@/lib/claim-records";

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

type Props = {
  metrics: DashboardMetrics | null;
  laborRate?: number;
};

function fmtDollars(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function fmt(n: number | undefined | null): string {
  if (n === null || n === undefined) return "—";
  return String(n);
}

function fmtHours(n: number | undefined | null): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(1)} hr`;
}

export function ManagerDashboard({ metrics, laborRate = 0 }: Props) {
  const reimbursementValue = metrics && laborRate > 0 ? metrics.totalClaimableHours * laborRate : null;

  const metricCards = [
    {
      label: "Draft queue",
      value: metrics ? fmt(metrics.draftCount + metrics.needsClarificationCount) : "—",
      detail: metrics
        ? `${fmt(metrics.draftCount)} draft · ${fmt(metrics.needsClarificationCount)} need clarification · ${fmt(metrics.approvedCount)} approved · ${fmt(metrics.copiedCount)} copied`
        : "Connecting to database…",
      tone: "green",
    },
    {
      label: reimbursementValue !== null ? "Reimbursement exposure" : "Total claimable hours",
      value: reimbursementValue !== null ? fmtDollars(reimbursementValue) : metrics ? fmtHours(metrics.totalClaimableHours) : "—",
      detail: metrics
        ? reimbursementValue !== null
          ? `${fmtHours(metrics.totalClaimableHours)} × ${fmtDollars(laborRate)}/hr across ${fmt(metrics.totalClaims)} claim${metrics.totalClaims === 1 ? "" : "s"}`
          : `Across ${fmt(metrics.totalClaims)} saved claim${metrics.totalClaims === 1 ? "" : "s"} · Set WARRANTY_LABOR_RATE to see dollar value`
        : "Connecting to database…",
      tone: "green",
    },
    {
      label: "Labor variance",
      value: metrics ? fmt(metrics.laborVarianceCount) : "—",
      detail:
        metrics && metrics.laborVarianceCount > 0
          ? `${fmt(metrics.laborVarianceCount)} claim${metrics.laborVarianceCount === 1 ? "" : "s"} where requested time doesn't match claimable CDR labor`
          : metrics
            ? "All saved claims reconcile requested vs. claimable time"
            : "Connecting to database…",
      tone: metrics && metrics.laborVarianceCount > 0 ? "yellow" : "green",
    },
    {
      label: "Audit flags",
      value: metrics ? fmt(metrics.missingKeyPartCount + metrics.claimsWithWarningsCount) : "—",
      detail: metrics
        ? `${fmt(metrics.missingKeyPartCount)} missing key part · ${fmt(metrics.claimsWithWarningsCount)} with active warnings`
        : "Connecting to database…",
      tone: metrics && metrics.missingKeyPartCount + metrics.claimsWithWarningsCount > 0 ? "yellow" : "green",
    },
  ];

  return (
    <section className="manager-dashboard" aria-labelledby="manager-dashboard-title">
      <div className="dashboard-hero card">
        <div>
          <span className="section-kicker">Manager dashboard</span>
          <h2 id="manager-dashboard-title">Warranty desk command center</h2>
          <p>
            Live claim queue, labor variance, and audit flags pulled from the database on every page load.
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

      </div>
    </section>
  );
}
