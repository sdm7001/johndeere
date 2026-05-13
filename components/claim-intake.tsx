"use client";

import { useEffect, useMemo, useState } from "react";

type CdrStep = {
  description: string;
  timeHours: number | null;
};

type CoverageLabel =
  | "BASIC WARRANTY"
  | "EMISSIONS WARRANTY"
  | "POWERGARD COMPREHENSIVE"
  | "EXTENDED WARRANTY";

type CdrResult = {
  coverageLabel: CoverageLabel;
  keyPartNumber: string;
  cause: string;
  diagnose: CdrStep[];
  repair: CdrStep[];
  cleanUp: CdrStep[];
  workorderTimeRequested: number | null;
  claimableTime: number;
  timeDifference: number | null;
  warnings: string[];
  sourceNotes: string[];
  copyText: string;
};

type CdrDenialResult = {
  denied: true;
  reason: string;
  explanation: string;
  wamCitations: string[];
  alternatives: string[];
  specialAllowanceNote: string | null;
};

type ClaimRecordSummary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  status: ClaimStatus;
  customerComplaintPreview: string;
  workorderTime: string;
  claimableTime: number;
  warningsCount: number;
  keyPartNumber: string;
};

type ClaimStatus = "draft" | "needs_clarification" | "approved" | "copied";

const statusLabels: Record<ClaimStatus, string> = {
  draft: "Draft",
  needs_clarification: "Needs clarification",
  approved: "Approved",
  copied: "Copied",
};

const coverageEmoji: Record<CoverageLabel, string> = {
  "BASIC WARRANTY": "🟩",
  "EMISSIONS WARRANTY": "🟦",
  "POWERGARD COMPREHENSIVE": "🟨",
  "EXTENDED WARRANTY": "🟥",
};

const emptyForm = {
  customerComplaint: "",
  technicianWriteup: "",
  workorderTime: "",
  machineModel: "",
  serialNumber: "",
  machineHours: "",
  saleDate: "",
  warrantyPlan: "",
  repairDate: "",
};

export function ClaimIntake() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<CdrResult | null>(null);
  const [denial, setDenial] = useState<CdrDenialResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [records, setRecords] = useState<ClaimRecordSummary[]>([]);
  const [recordsStatus, setRecordsStatus] = useState("Loading record history...");
  const completedFields = [
    Boolean(form.customerComplaint.trim()),
    Boolean(form.technicianWriteup.trim()),
    Boolean(form.workorderTime.trim()),
  ].filter(Boolean).length;

  const canSubmit = useMemo(
    () => form.customerComplaint.trim() && form.technicianWriteup.trim() && form.workorderTime.trim(),
    [form],
  );

  useEffect(() => {
    void loadRecords();
  }, []);

  async function loadRecords() {
    try {
      const response = await fetch("/api/claims", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load records.");
      }

      setRecords(payload.records);
      setRecordsStatus(payload.records.length ? "Latest saved claim drafts" : "No saved claim drafts yet");
    } catch (caught) {
      setRecordsStatus(caught instanceof Error ? caught.message : "Unable to load records.");
    }
  }

  async function submitClaim() {
    setError(null);
    setCopyStatus(null);
    setDenial(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/claims/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate CDR draft.");
      }

      if (payload.denial) {
        setDenial(payload.denial);
        setResult(null);
        return;
      }

      setResult(payload.result);
      if (payload.record) {
        setRecords((current) => [toRecordSummary(payload.record), ...current].slice(0, 25));
        setRecordsStatus("Latest saved claim drafts");
      } else {
        await loadRecords();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate CDR draft.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyCdr() {
    if (!result) return;

    await navigator.clipboard.writeText(result.copyText);
    setCopyStatus("CDR copied to clipboard.");
  }

  async function updateRecordStatus(id: string, status: ClaimStatus) {
    const response = await fetch("/api/claims", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, status }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setRecordsStatus(payload.error ?? "Unable to update claim status.");
      return;
    }

    setRecords((current) => current.map((record) => (record.id === id ? payload.record : record)));
    setRecordsStatus("Latest saved claim drafts");
  }

  return (
    <div className="claim-workspace">
      <section className="card claim-card">
        <div className="claim-card-header">
          <div>
            <span className="section-kicker">Warranty desk</span>
            <h2>Claim intake</h2>
            <p>Paste the three workorder inputs and generate a copy-ready CDR draft for review.</p>
          </div>
          <div className="completion-meter" aria-label={`${completedFields} of 3 required fields complete`}>
            <span>{completedFields}/3</span>
            <small>ready fields</small>
          </div>
        </div>

        <div className="intake-steps" aria-label="Claim intake steps">
          <span className={form.customerComplaint.trim() ? "step-chip complete" : "step-chip"}>Complaint</span>
          <span className={form.technicianWriteup.trim() ? "step-chip complete" : "step-chip"}>Technician</span>
          <span className={form.workorderTime.trim() ? "step-chip complete" : "step-chip"}>Time</span>
        </div>

        <div className="form">
          <div className="field field-card complaint-field">
            <div className="field-heading">
              <span className="field-number">01</span>
              <div>
                <label htmlFor="customerComplaint">Original customer complaint</label>
                <p>Paste the customer concern exactly as provided on the workorder.</p>
              </div>
              <span className="required-pill">Required</span>
            </div>
            <textarea
              id="customerComplaint"
              value={form.customerComplaint}
              onChange={(event) => setForm({ ...form, customerComplaint: event.target.value })}
              placeholder="Example: Customer states tractor has active hydraulic warning and loader settles overnight..."
            />
            <div className="field-footer">
              <span>Preserve the customer's words.</span>
              <strong>{form.customerComplaint.trim().length} chars</strong>
            </div>
          </div>

          <div className="field field-card technician-field">
            <div className="field-heading">
              <span className="field-number">02</span>
              <div>
                <label htmlFor="technicianWriteup">Technician&apos;s write-up</label>
                <p>Paste diagnostic steps, tests, parts replaced, repair actions, verification, and cleanup notes.</p>
              </div>
              <span className="required-pill">Required</span>
            </div>
            <textarea
              id="technicianWriteup"
              value={form.technicianWriteup}
              onChange={(event) => setForm({ ...form, technicianWriteup: event.target.value })}
              placeholder="Example: Connected Service Advisor 0.3 hr. Performed continuity test 0.4 hr. Replaced failed pressure sensor part RE123456 0.5 hr..."
            />
            <div className="field-footer">
              <span>Include time next to each diagnostic and repair step.</span>
              <strong>{form.technicianWriteup.trim().length} chars</strong>
            </div>
          </div>

          <div className="field field-card time-field">
            <div className="field-heading">
              <span className="field-number">03</span>
              <div>
                <label htmlFor="workorderTime">Workorder time to collect</label>
                <p>Paste or enter the total hours the dealership is trying to collect for this warranty job.</p>
              </div>
              <span className="required-pill">Required</span>
            </div>
            <textarea
              className="time-box"
              id="workorderTime"
              value={form.workorderTime}
              onChange={(event) => setForm({ ...form, workorderTime: event.target.value })}
              placeholder="Example: 1.7"
            />
            <div className="field-footer">
              <span>Use decimal hours when possible.</span>
              <strong>{form.workorderTime.trim() || "0.0"} hr target</strong>
            </div>
          </div>

          <div className="field field-card machine-field">
            <div className="field-heading">
              <span className="field-number">04</span>
              <div>
                <label>Machine details</label>
                <p>Enter equipment information required for claim submission. All fields optional but improve CDR accuracy.</p>
              </div>
              <span className="optional-pill">Optional</span>
            </div>
            <div className="machine-grid">
              <div className="machine-input-group">
                <label htmlFor="machineModel">Model</label>
                <input
                  id="machineModel"
                  type="text"
                  value={form.machineModel}
                  onChange={(event) => setForm({ ...form, machineModel: event.target.value })}
                  placeholder="e.g. 6155M"
                />
              </div>
              <div className="machine-input-group">
                <label htmlFor="serialNumber">Serial number</label>
                <input
                  id="serialNumber"
                  type="text"
                  value={form.serialNumber}
                  onChange={(event) => setForm({ ...form, serialNumber: event.target.value })}
                  placeholder="e.g. 1RW6155MXPM123456"
                />
              </div>
              <div className="machine-input-group">
                <label htmlFor="machineHours">Machine hours</label>
                <input
                  id="machineHours"
                  type="text"
                  value={form.machineHours}
                  onChange={(event) => setForm({ ...form, machineHours: event.target.value })}
                  placeholder="e.g. 412"
                />
              </div>
              <div className="machine-input-group">
                <label htmlFor="warrantyPlan">Warranty plan</label>
                <input
                  id="warrantyPlan"
                  type="text"
                  value={form.warrantyPlan}
                  onChange={(event) => setForm({ ...form, warrantyPlan: event.target.value })}
                  placeholder="e.g. Basic, PowerGard"
                />
              </div>
              <div className="machine-input-group">
                <label htmlFor="saleDate">Sale date</label>
                <input
                  id="saleDate"
                  type="text"
                  value={form.saleDate}
                  onChange={(event) => setForm({ ...form, saleDate: event.target.value })}
                  placeholder="e.g. 2024-03-15"
                />
              </div>
              <div className="machine-input-group">
                <label htmlFor="repairDate">Repair date</label>
                <input
                  id="repairDate"
                  type="text"
                  value={form.repairDate}
                  onChange={(event) => setForm({ ...form, repairDate: event.target.value })}
                  placeholder="e.g. 2026-05-10"
                />
              </div>
            </div>
          </div>

          <div className="actions claim-actions">
            <button className="button primary-action" disabled={!canSubmit || isSubmitting} type="button" onClick={submitClaim}>
              {isSubmitting ? "Generating..." : "Generate CDR draft"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setResult(null);
                setDenial(null);
                setError(null);
                setCopyStatus(null);
              }}
            >
              Clear
            </button>
            {error ? <span className="status error-status">{error}</span> : <span className="status">WAM guardrails enabled</span>}
          </div>
        </div>

        <div className="record-history-panel">
          <div className="record-history-header">
            <div>
              <span className="section-kicker">Saved records</span>
              <h3>Claim draft history</h3>
            </div>
            <span>{records.length} saved</span>
          </div>
          {records.length ? (
            <div className="record-list">
              {records.slice(0, 6).map((record) => (
                <article className="record-row" key={record.id}>
                  <div>
                    <strong>{record.customerComplaintPreview || "No complaint preview"}</strong>
                    <span>
                      {formatDate(record.createdAt)} · key part {record.keyPartNumber || "blank"}
                    </span>
                  </div>
                  <div className="approval-state">
                    <span className={`approval-pill ${record.status}`}>{statusLabels[record.status]}</span>
                    <div className="approval-actions">
                      {(["draft", "needs_clarification", "approved", "copied"] as ClaimStatus[]).map((status) => (
                        <button
                          disabled={record.status === status}
                          key={status}
                          onClick={() => void updateRecordStatus(record.id, status)}
                          type="button"
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="record-meta">
                    <span>{record.workorderTime} hr requested</span>
                    <span>{record.claimableTime.toFixed(1)} hr claimable</span>
                    <span>{record.warningsCount} warnings</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="record-empty">{recordsStatus}</p>
          )}
        </div>
      </section>

      <section className="card result claim-result-card">
        <div className="claim-card-header compact">
          <div>
            <span className="section-kicker">Output monitor</span>
            <h2>CDR draft</h2>
            <p>Review labor, warnings, and source guardrails before copying into the claim system.</p>
          </div>
        </div>
        {denial ? (
          <div className="denial-panel">
            <div className="denial-header">
              <span className="denial-stop">STOP — Not Covered</span>
              <p>{denial.explanation}</p>
            </div>
            <div className="denial-section">
              <strong>WAM denial citations</strong>
              <ul>
                {denial.wamCitations.map((cite) => (
                  <li key={cite}>{cite}</li>
                ))}
              </ul>
            </div>
            <div className="denial-section">
              <strong>Alternative paths</strong>
              <ul>
                {denial.alternatives.map((alt) => (
                  <li key={alt}>{alt}</li>
                ))}
              </ul>
            </div>
            {denial.specialAllowanceNote ? (
              <div className="denial-allowance">
                <strong>Special Allowance / D-Policy</strong>
                <p>{denial.specialAllowanceNote}</p>
              </div>
            ) : null}
          </div>
        ) : result ? (
          <>
            <div className="coverage">
              {coverageEmoji[result.coverageLabel]} {result.coverageLabel}
            </div>
            <pre className="cdr-output">{result.copyText}</pre>
            <div className="actions result-actions">
              <button className="button secondary" type="button" onClick={copyCdr}>
                Copy CDR
              </button>
              {copyStatus ? <span className="status">{copyStatus}</span> : null}
            </div>
            <div className="metric-grid">
              <div className="metric">
                <span>Workorder time requested</span>
                <strong>{formatHours(result.workorderTimeRequested)}</strong>
              </div>
              <div className="metric">
                <span>Current claimable CDR time</span>
                <strong>{formatHours(result.claimableTime)}</strong>
              </div>
              <div className="metric">
                <span>Difference</span>
                <strong>{formatHours(result.timeDifference)}</strong>
              </div>
            </div>
            {result.warnings.length ? (
              <div className="warning">
                <strong>Review before submission</strong>
                <ul>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="sources">
              <strong>Source guardrails applied</strong>
              <ul>
                {result.sourceNotes.map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className="empty result-empty">
            <span className="empty-icon">CDR</span>
            <h3>Ready when the workorder is.</h3>
            <p>
              Paste the complaint, technician write-up, and requested workorder time to generate a copy-ready
              CDR draft. The MVP flags missing labor time and differences between requested time and currently
              claimable CDR time.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function toRecordSummary(record: {
  id: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string | null;
  status?: ClaimStatus;
  input: { customerComplaint: string; workorderTime: string };
  result: { claimableTime: number; warnings: string[]; keyPartNumber: string };
}): ClaimRecordSummary {
  return {
    id: record.id,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt ?? record.createdAt,
    createdBy: record.createdBy,
    status: record.status ?? "draft",
    customerComplaintPreview: preview(record.input.customerComplaint),
    workorderTime: record.input.workorderTime,
    claimableTime: record.result.claimableTime,
    warningsCount: record.result.warnings.length,
    keyPartNumber: record.result.keyPartNumber,
  };
}

function preview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 96 ? `${normalized.slice(0, 96)}...` : normalized;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatHours(value: number | null) {
  if (value === null) {
    return "Needs review";
  }

  return `${value.toFixed(1)} hr`;
}
