"use client";

import { useMemo, useState } from "react";

type CdrStep = {
  description: string;
  timeHours: number | null;
};

type CdrResult = {
  coverageLabel: "BASIC WARRANTY";
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

const emptyForm = {
  customerComplaint: "",
  technicianWriteup: "",
  workorderTime: "",
};

export function ClaimIntake() {
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState<CdrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => form.customerComplaint.trim() && form.technicianWriteup.trim() && form.workorderTime.trim(),
    [form],
  );

  async function submitClaim() {
    setError(null);
    setCopyStatus(null);
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

      setResult(payload.result);
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

  return (
    <div className="grid">
      <section className="card">
        <h2>Claim intake</h2>
        <div className="form">
          <div className="field">
            <label htmlFor="customerComplaint">Original customer complaint</label>
            <p>Paste the customer concern exactly as provided on the workorder.</p>
            <textarea
              id="customerComplaint"
              value={form.customerComplaint}
              onChange={(event) => setForm({ ...form, customerComplaint: event.target.value })}
              placeholder="Example: Customer states tractor has active hydraulic warning and loader settles overnight..."
            />
          </div>

          <div className="field">
            <label htmlFor="technicianWriteup">Technician&apos;s write-up</label>
            <p>Paste diagnostic steps, tests, parts replaced, repair actions, verification, and cleanup notes.</p>
            <textarea
              id="technicianWriteup"
              value={form.technicianWriteup}
              onChange={(event) => setForm({ ...form, technicianWriteup: event.target.value })}
              placeholder="Example: Connected Service Advisor 0.3 hr. Performed continuity test 0.4 hr. Replaced failed pressure sensor part RE123456 0.5 hr..."
            />
          </div>

          <div className="field">
            <label htmlFor="workorderTime">Workorder time to collect</label>
            <p>Paste or enter the total hours the dealership is trying to collect for this warranty job.</p>
            <textarea
              className="time-box"
              id="workorderTime"
              value={form.workorderTime}
              onChange={(event) => setForm({ ...form, workorderTime: event.target.value })}
              placeholder="Example: 1.7"
            />
          </div>

          <div className="actions">
            <button className="button" disabled={!canSubmit || isSubmitting} type="button" onClick={submitClaim}>
              {isSubmitting ? "Generating..." : "Generate CDR draft"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setResult(null);
                setError(null);
                setCopyStatus(null);
              }}
            >
              Clear
            </button>
            {error ? <span className="status">{error}</span> : null}
          </div>
        </div>
      </section>

      <section className="card result">
        <h2>CDR draft</h2>
        {result ? (
          <>
            <div className="coverage">🟩 {result.coverageLabel}</div>
            <pre className="cdr-output">{result.copyText}</pre>
            <div className="actions">
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
          <p className="empty">
            Paste the complaint, technician write-up, and requested workorder time to generate a copy-ready
            CDR draft. The MVP flags missing labor time and differences between requested time and currently
            claimable CDR time.
          </p>
        )}
      </section>
    </div>
  );
}

function formatHours(value: number | null) {
  if (value === null) {
    return "Needs review";
  }

  return `${value.toFixed(1)} hr`;
}
