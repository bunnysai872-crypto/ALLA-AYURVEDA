import React, { useState, useEffect } from "react";
import IECStatusBadge from "./IECStatusBadge";

export function IECVerificationModal({
  isOpen,
  onClose,
  document,
  mode = "verify", // "verify" | "correction" | "missing"
  onSubmit,
}) {
  const [activeAction, setActiveAction] = useState(mode);
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [isReject, setIsReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setActiveAction(mode);
    setRemarks("");
    setReason("");
    setIsReject(false);
  }, [mode, document, isOpen]);

  if (!isOpen || !document) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeAction === "correction" && !reason.trim()) {
      alert("Please provide a reason for the correction request.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        action: activeAction,
        documentId: document.id,
        remarks: remarks.trim(),
        reason: reason.trim(),
        reject: isReject,
      });
      onClose();
    } catch (err) {
      alert(err.message || "Failed to process verification action");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="iec-modal-overlay" onClick={onClose}>
      <div className="iec-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="iec-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🛡</span>
            <h3 className="iec-modal-title">Document Verification Scrutiny</h3>
          </div>
          <button type="button" className="iec-modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        {/* Document Information Summary Card */}
        <div
          style={{
            margin: "0 0 16px 0",
            padding: "12px 16px",
            background: "rgba(13, 21, 18, 0.7)",
            borderRadius: "8px",
            border: "1px solid rgba(45, 75, 60, 0.4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.95rem", color: "#f8fafc", fontWeight: 600 }}>
                {document.original_filename || document.document_name}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "3px" }}>
                Type: <strong style={{ color: "#cbd5e1" }}>{document.document_type}</strong> • Version:{" "}
                <span style={{ color: "#d4af37", fontWeight: 600 }}>v{document.version || 1}</span>
                {document.created_at && ` • Uploaded: ${document.created_at.slice(0, 10)}`}
              </div>
            </div>
            <IECStatusBadge status={document.status} type="document" />
          </div>
        </div>

        {/* Action Selection Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            className={`iec-btn-secondary ${activeAction === "verify" ? "active" : ""}`}
            style={{
              padding: "8px 10px",
              fontSize: "0.82rem",
              background: activeAction === "verify" ? "rgba(16, 185, 129, 0.2)" : "rgba(13, 21, 18, 0.5)",
              borderColor: activeAction === "verify" ? "#10b981" : "rgba(45, 75, 60, 0.5)",
              color: activeAction === "verify" ? "#34d399" : "#94a3b8",
              fontWeight: activeAction === "verify" ? 700 : 500,
            }}
            onClick={() => setActiveAction("verify")}
          >
            ✓ Verify
          </button>
          <button
            type="button"
            className={`iec-btn-secondary ${activeAction === "correction" ? "active" : ""}`}
            style={{
              padding: "8px 10px",
              fontSize: "0.82rem",
              background: activeAction === "correction" ? "rgba(245, 158, 11, 0.2)" : "rgba(13, 21, 18, 0.5)",
              borderColor: activeAction === "correction" ? "#f59e0b" : "rgba(45, 75, 60, 0.5)",
              color: activeAction === "correction" ? "#fbbf24" : "#94a3b8",
              fontWeight: activeAction === "correction" ? 700 : 500,
            }}
            onClick={() => setActiveAction("correction")}
          >
            ⚠ Requires Fix
          </button>
          <button
            type="button"
            className={`iec-btn-secondary ${activeAction === "missing" ? "active" : ""}`}
            style={{
              padding: "8px 10px",
              fontSize: "0.82rem",
              background: activeAction === "missing" ? "rgba(239, 68, 68, 0.2)" : "rgba(13, 21, 18, 0.5)",
              borderColor: activeAction === "missing" ? "#ef4444" : "rgba(45, 75, 60, 0.5)",
              color: activeAction === "missing" ? "#f87171" : "#94a3b8",
              fontWeight: activeAction === "missing" ? 700 : 500,
            }}
            onClick={() => setActiveAction("missing")}
          >
            ✕ Mark Missing
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeAction === "verify" && (
            <div className="iec-form-group">
              <label className="iec-form-label">
                Verification Remarks / Compliance Notes (Optional)
              </label>
              <textarea
                className="iec-textarea"
                placeholder="e.g. Verified in accordance with Good Clinical Practice (GCP) and AYUSH ethics standards. All required clauses confirmed."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          )}

          {activeAction === "correction" && (
            <>
              <div className="iec-form-group">
                <label className="iec-form-label">
                  Correction Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  className="iec-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. Missing investigator signature on page 4 / Translation discrepancy"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="iec-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="rejectDoc"
                  checked={isReject}
                  onChange={(e) => setIsReject(e.target.checked)}
                />
                <label htmlFor="rejectDoc" style={{ fontSize: "0.82rem", color: "#fca5a5", cursor: "pointer" }}>
                  Flag as Critical Rejection (Requires complete resubmission of this document)
                </label>
              </div>

              <div className="iec-form-group">
                <label className="iec-form-label">
                  Detailed Remediation Guidance for Researcher
                </label>
                <textarea
                  className="iec-textarea"
                  placeholder="Provide precise instructions so the research team can address the deficiency and re-upload..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </>
          )}

          {activeAction === "missing" && (
            <div className="iec-form-group">
              <label className="iec-form-label">
                Deficiency / Missing Document Note
              </label>
              <textarea
                className="iec-textarea"
                placeholder="e.g. Document is mandatory under ICMR/AYUSH ethical guidelines but not uploaded or inaccessible. Researcher must submit before IEC review."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          )}

          <div className="iec-modal-footer">
            <button type="button" className="iec-btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className={
                activeAction === "verify"
                  ? "iec-btn-primary"
                  : activeAction === "correction"
                  ? "iec-btn-warning"
                  : "iec-btn-danger"
              }
              style={{
                background:
                  activeAction === "verify"
                    ? "linear-gradient(135deg, #059669, #047857)"
                    : activeAction === "correction"
                    ? "linear-gradient(135deg, #d97706, #b45309)"
                    : "linear-gradient(135deg, #dc2626, #b91c1c)",
                borderColor:
                  activeAction === "verify"
                    ? "#10b981"
                    : activeAction === "correction"
                    ? "#f59e0b"
                    : "#ef4444",
              }}
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : activeAction === "verify"
                ? "✓ Confirm Verified"
                : activeAction === "correction"
                ? "⚠ Request Correction"
                : "✕ Flag as Missing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IECVerificationModal;
