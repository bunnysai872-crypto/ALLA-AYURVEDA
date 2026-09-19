import React from "react";

/**
 * IECDecisionConfirmation
 * Regulatory-grade confirmation modal before finalizing an official IEC Decision.
 */
export default function IECDecisionConfirmation({
  isOpen,
  study,
  decision,
  decisionLabel,
  comments,
  conditions,
  onConfirm,
  onCancel,
  isSubmitting,
}) {
  if (!isOpen) return null;

  const getBadgeClass = () => {
    if (decision === "approved") return "approved";
    if (decision === "modify" || decision === "modification_required") return "modify";
    return "not_approved";
  };

  const getTargetStatusLabel = () => {
    if (decision === "approved") return "approved (Ready for Regulatory & CTRI Registration)";
    if (decision === "modify" || decision === "modification_required") return "modification_required (Returned to Researcher)";
    return "not_approved (Ethical Disapproval - Terminal)";
  };

  return (
    <div className="iec-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="iec-confirm-title">
      <div className="iec-modal-dialog">
        <div className="iec-modal-header">
          <span style={{ fontSize: "1.5rem" }}>
            {decision === "approved" ? "⚖️" : decision === "modify" ? "⚠️" : "🛑"}
          </span>
          <h3 id="iec-confirm-title">Confirm Official IEC Ethical Committee Decision</h3>
        </div>

        <div className="iec-modal-body">
          <p style={{ margin: 0 }}>
            You are about to issue and record the binding institutional ethics committee decision for this clinical trial.
          </p>

          <div className="iec-modal-summary-box">
            <div className="iec-modal-summary-row">
              <span className="iec-modal-summary-label">Study Code:</span>
              <span className="iec-modal-summary-value" style={{ fontFamily: "monospace" }}>
                {study?.study_id || "N/A"}
              </span>
            </div>
            <div className="iec-modal-summary-row">
              <span className="iec-modal-summary-label">Study Title:</span>
              <span className="iec-modal-summary-value">{study?.title || "N/A"}</span>
            </div>
            <div className="iec-modal-summary-row">
              <span className="iec-modal-summary-label">Decision Outcome:</span>
              <span className="iec-modal-summary-value">
                <span className={`iec-decision-badge ${getBadgeClass()}`}>
                  {decisionLabel}
                </span>
              </span>
            </div>
            <div className="iec-modal-summary-row">
              <span className="iec-modal-summary-label">New Study Status:</span>
              <span className="iec-modal-summary-value" style={{ color: "#38bdf8", fontSize: "0.82rem" }}>
                {getTargetStatusLabel()}
              </span>
            </div>
            <div className="iec-modal-summary-row" style={{ flexDirection: "column", gap: "4px" }}>
              <span className="iec-modal-summary-label">Committee Remarks / Rationale:</span>
              <span
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#f1f5f9",
                  whiteSpace: "pre-wrap",
                }}
              >
                {comments}
              </span>
            </div>
            {conditions && (
              <div className="iec-modal-summary-row" style={{ flexDirection: "column", gap: "4px" }}>
                <span className="iec-modal-summary-label">Conditions / Stipulations:</span>
                <span
                  style={{
                    background: "rgba(0, 0, 0, 0.3)",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    color: "#fbbf24",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {conditions}
                </span>
              </div>
            )}
          </div>

          <div className="iec-modal-warning-alert">
            <span>⚠️</span>
            <div>
              <strong>Audit Notice:</strong> Once confirmed, this ethical committee decision is committed to the trial record and cannot be overwritten.
            </div>
          </div>
        </div>

        <div className="iec-modal-footer">
          <button
            type="button"
            className="iec-modal-cancel-btn"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`iec-modal-confirm-btn ${getBadgeClass()}`}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Recording Decision..." : "Confirm & Issue Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
