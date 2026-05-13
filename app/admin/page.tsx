"use client";

import { useEffect, useState } from "react";

type MstEntry = {
  id: string;
  jobCode: string;
  description: string;
  productFamily: string;
  modelRange: string;
  allowedHours: number;
  sourceReference: string;
  effectiveDate: string;
};

type OperationCode = {
  id: string;
  code: string;
  description: string;
  productFamily: string;
  modelRange: string;
  sourceReference: string;
  effectiveDate: string;
};

const emptyMst: Omit<MstEntry, "id"> = {
  jobCode: "",
  description: "",
  productFamily: "",
  modelRange: "",
  allowedHours: 0,
  sourceReference: "",
  effectiveDate: "",
};

const emptyOpc: Omit<OperationCode, "id"> = {
  code: "",
  description: "",
  productFamily: "",
  modelRange: "",
  sourceReference: "",
  effectiveDate: "",
};

export default function AdminPage() {
  const [mstEntries, setMstEntries] = useState<MstEntry[]>([]);
  const [opCodes, setOpCodes] = useState<OperationCode[]>([]);
  const [mstForm, setMstForm] = useState(emptyMst);
  const [opcForm, setOpcForm] = useState(emptyOpc);
  const [mstStatus, setMstStatus] = useState<string | null>(null);
  const [opcStatus, setOpcStatus] = useState<string | null>(null);
  const [mstError, setMstError] = useState<string | null>(null);
  const [opcError, setOpcError] = useState<string | null>(null);
  const [savingMst, setSavingMst] = useState(false);
  const [savingOpc, setSavingOpc] = useState(false);

  useEffect(() => {
    void loadMst();
    void loadOpc();
  }, []);

  async function loadMst() {
    const res = await fetch("/api/warranty-data/mst");
    const data = await res.json();
    if (res.ok) setMstEntries(data.entries);
  }

  async function loadOpc() {
    const res = await fetch("/api/warranty-data/operation-codes");
    const data = await res.json();
    if (res.ok) setOpCodes(data.codes);
  }

  async function addMst(e: React.FormEvent) {
    e.preventDefault();
    setMstError(null);
    setMstStatus(null);
    setSavingMst(true);
    try {
      const res = await fetch("/api/warranty-data/mst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mstForm, allowedHours: Number(mstForm.allowedHours) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setMstEntries((prev) => [...prev, data.entry].sort((a, b) => a.description.localeCompare(b.description)));
      setMstForm(emptyMst);
      setMstStatus("MST entry saved.");
    } catch (err) {
      setMstError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSavingMst(false);
    }
  }

  async function deleteMst(id: string) {
    await fetch(`/api/warranty-data/mst?id=${id}`, { method: "DELETE" });
    setMstEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function addOpc(e: React.FormEvent) {
    e.preventDefault();
    setOpcError(null);
    setOpcStatus(null);
    setSavingOpc(true);
    try {
      const res = await fetch("/api/warranty-data/operation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opcForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setOpCodes((prev) => [...prev, data.code].sort((a, b) => a.code.localeCompare(b.code)));
      setOpcForm(emptyOpc);
      setOpcStatus("Operation code saved.");
    } catch (err) {
      setOpcError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSavingOpc(false);
    }
  }

  async function deleteOpc(id: string) {
    await fetch(`/api/warranty-data/operation-codes?id=${id}`, { method: "DELETE" });
    setOpCodes((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="admin-shell">
      <header className="topbar">
        <div className="brand">
          <strong>John Deere Warranty CDR</strong>
          <span>Warranty data admin</span>
        </div>
        <a href="/" className="admin-back-link">← Back to claims</a>
      </header>

      <main className="admin-main">
        <div className="admin-hero">
          <span className="section-kicker">Admin</span>
          <h1>Warranty data entry</h1>
          <p>
            Enter MST flat-rate times and operation codes as you look them up in JDIS and servicetime.deere.com.
            These feed directly into CDR generation and source citations.
          </p>
        </div>

        <div className="admin-grid">
          {/* MST Flat-Rate Panel */}
          <section className="card admin-panel">
            <div className="admin-panel-header">
              <span className="section-kicker">MST flat-rate</span>
              <h2>Machine Service Times</h2>
              <p>Approved labor hours from servicetime.deere.com for specific job codes and model ranges.</p>
            </div>

            <form className="admin-form" onSubmit={addMst}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="mst-description">Job description *</label>
                  <input
                    id="mst-description"
                    type="text"
                    required
                    value={mstForm.description}
                    onChange={(e) => setMstForm({ ...mstForm, description: e.target.value })}
                    placeholder="e.g. Replace hydraulic pressure sensor"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="mst-job-code">Job code</label>
                  <input
                    id="mst-job-code"
                    type="text"
                    value={mstForm.jobCode}
                    onChange={(e) => setMstForm({ ...mstForm, jobCode: e.target.value })}
                    placeholder="e.g. HY4501"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="mst-hours">Allowed hours *</label>
                  <input
                    id="mst-hours"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={mstForm.allowedHours || ""}
                    onChange={(e) => setMstForm({ ...mstForm, allowedHours: Number(e.target.value) })}
                    placeholder="e.g. 1.4"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="mst-product-family">Product family</label>
                  <input
                    id="mst-product-family"
                    type="text"
                    value={mstForm.productFamily}
                    onChange={(e) => setMstForm({ ...mstForm, productFamily: e.target.value })}
                    placeholder="e.g. 6M Series Tractors"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="mst-model-range">Model range</label>
                  <input
                    id="mst-model-range"
                    type="text"
                    value={mstForm.modelRange}
                    onChange={(e) => setMstForm({ ...mstForm, modelRange: e.target.value })}
                    placeholder="e.g. 6120M – 6175M"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="mst-effective">Effective date</label>
                  <input
                    id="mst-effective"
                    type="text"
                    value={mstForm.effectiveDate}
                    onChange={(e) => setMstForm({ ...mstForm, effectiveDate: e.target.value })}
                    placeholder="e.g. 2026-01-01"
                  />
                </div>
                <div className="admin-field admin-field-wide">
                  <label htmlFor="mst-source">Source reference</label>
                  <input
                    id="mst-source"
                    type="text"
                    value={mstForm.sourceReference}
                    onChange={(e) => setMstForm({ ...mstForm, sourceReference: e.target.value })}
                    placeholder="e.g. servicetime.deere.com · retrieved 2026-05-13"
                  />
                </div>
              </div>
              <div className="admin-form-actions">
                <button className="button primary-action" type="submit" disabled={savingMst}>
                  {savingMst ? "Saving…" : "Add MST entry"}
                </button>
                {mstStatus && <span className="status">{mstStatus}</span>}
                {mstError && <span className="status error-status">{mstError}</span>}
              </div>
            </form>

            {mstEntries.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Job code</th>
                      <th>Product / models</th>
                      <th>Allowed hrs</th>
                      <th>Effective</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mstEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.description}</td>
                        <td className="code-cell">{entry.jobCode || "—"}</td>
                        <td>{[entry.productFamily, entry.modelRange].filter(Boolean).join(" · ") || "—"}</td>
                        <td className="hours-cell">{entry.allowedHours.toFixed(1)} hr</td>
                        <td>{entry.effectiveDate || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => void deleteMst(entry.id)}
                            title="Delete entry"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">No MST entries yet. Add the first one above.</p>
            )}
          </section>

          {/* Operation Codes Panel */}
          <section className="card admin-panel">
            <div className="admin-panel-header">
              <span className="section-kicker">Operation codes</span>
              <h2>Warranty operation codes</h2>
              <p>Complaint/Cause/Correction codes from JDIS used for CDR claim submission.</p>
            </div>

            <form className="admin-form" onSubmit={addOpc}>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <label htmlFor="opc-code">Operation code *</label>
                  <input
                    id="opc-code"
                    type="text"
                    required
                    value={opcForm.code}
                    onChange={(e) => setOpcForm({ ...opcForm, code: e.target.value })}
                    placeholder="e.g. HY4501A"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="opc-description">Description *</label>
                  <input
                    id="opc-description"
                    type="text"
                    required
                    value={opcForm.description}
                    onChange={(e) => setOpcForm({ ...opcForm, description: e.target.value })}
                    placeholder="e.g. Hydraulic pressure sensor replacement"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="opc-product-family">Product family</label>
                  <input
                    id="opc-product-family"
                    type="text"
                    value={opcForm.productFamily}
                    onChange={(e) => setOpcForm({ ...opcForm, productFamily: e.target.value })}
                    placeholder="e.g. 6M Series Tractors"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="opc-model-range">Model range</label>
                  <input
                    id="opc-model-range"
                    type="text"
                    value={opcForm.modelRange}
                    onChange={(e) => setOpcForm({ ...opcForm, modelRange: e.target.value })}
                    placeholder="e.g. 6120M – 6175M"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="opc-effective">Effective date</label>
                  <input
                    id="opc-effective"
                    type="text"
                    value={opcForm.effectiveDate}
                    onChange={(e) => setOpcForm({ ...opcForm, effectiveDate: e.target.value })}
                    placeholder="e.g. 2026-01-01"
                  />
                </div>
                <div className="admin-field">
                  <label htmlFor="opc-source">Source reference</label>
                  <input
                    id="opc-source"
                    type="text"
                    value={opcForm.sourceReference}
                    onChange={(e) => setOpcForm({ ...opcForm, sourceReference: e.target.value })}
                    placeholder="e.g. JDIS warranty codes · retrieved 2026-05-13"
                  />
                </div>
              </div>
              <div className="admin-form-actions">
                <button className="button primary-action" type="submit" disabled={savingOpc}>
                  {savingOpc ? "Saving…" : "Add operation code"}
                </button>
                {opcStatus && <span className="status">{opcStatus}</span>}
                {opcError && <span className="status error-status">{opcError}</span>}
              </div>
            </form>

            {opCodes.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Product / models</th>
                      <th>Effective</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {opCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="code-cell">{code.code}</td>
                        <td>{code.description}</td>
                        <td>{[code.productFamily, code.modelRange].filter(Boolean).join(" · ") || "—"}</td>
                        <td>{code.effectiveDate || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => void deleteOpc(code.id)}
                            title="Delete code"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="admin-empty">No operation codes yet. Add the first one above.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
