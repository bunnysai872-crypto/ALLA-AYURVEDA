import React, { useState } from "react";
import IECDecisionConfirmation from "./IECDecisionConfirmation";

const OUTCOME_OPTIONS = [
  {
    key: "approved",
    label: "Approved",
    subLabel: "Full Ethical Approval",
    icon: "✅",
    description: "Trial meets all clinical, classical Ayurvedic, and ethical guidelines. Cleared for regulatory submission and CTRI registration.",
    nextStep: "Updates study status to 'approved'. Enables CTRI tracking.",
  },
  {
    key: "modify",
    label: "Modify / Revision Required",
    subLabel: "Modifications Requested",
    icon: "📝",
    description: "Specific revisions needed in protocol, patient information sheet, or informed consent before ethical clearance can be granted.",
    nextStep: "Updates study status to 'modification_required'. Returns to researcher.",
  },
  {
    key: "not_approved",
    label: "Not Approved",
    subLabel: "Ethical Disapproval",
    icon: "🛑",
    description: "Study formulation, trial design, or safety risks fail to meet ethical standards. Disapproved for clinical conduct.",
    nextStep: "Updates study status to 'not_approved'. Terminal ethical rejection.",
  },
];

export default function IECDecisionPanel({
  study,
  existingDecision,
  isDecisionFinalized,
  onSubmitDecision,
  isSubmitting,
}) {
  const [selectedDecision, setSelectedDecision] = useState("");
  const [comments, setComments] = useState("");
  const [conditions, setConditions] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleSelectOutcome = (key) => {
    if (isDecisionFinalized) return;
    setSelectedDecision(key);
    setValidationError("");
  };

  const handleOpenConfirm = () => {
    if (!selectedDecision) {
      setValidationError("Please select one of the three ethical committee decision outcomes.");
      return;
    }
    if (!comments.trim()) {
      setValidationError("Official committee remarks / rationale are mandatory for regulatory audit compliance.");
      return;
    }
    setValidationError("");
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      await onSubmitDecision({
        decision: selectedDecision,
        comments: comments.trim(),
        conditions: conditions.trim() || undefined,
      });
      setShowConfirmModal(false);
    } catch (err) {
      // Error handled by parent page
    }
  };

  // If already finalized, show read-only audit dossier card
  if (isDecisionFinalized && existingDecision) {
    const outcomeObj = OUTCOME_OPTIONS.find((o) => o.key === existingDecision.decision) || {
      label: existingDecision.decision_label || existingDecision.decision,
      icon: "⚖️",
    };

    return (
      <div className="iec-decision-card">
        <div className="iec-decision-card-title">
          <span>🔒 Finalized Official IEC Decision Record</span>
          <span className={`iec-decision-badge ${existingDecision.decision}`}>
            {existingDecision.decision_label || existingDecision.decision}
          </span>
        </div>

        <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: 0 }}>
          This study has completed ethical review deliberation. The committee's official decision is binding and immutable.
        </p>

        <div className="iec-dossier-grid" style={{ marginTop: "16px" }}>
          <div className="iec-dossier-item">
            <div className="iec-dossier-item-label">Decision Outcome</div>
            <div className="iec-dossier-item-value" style={{ fontWeight: 700 }}>
              {outcomeObj.icon} {existingDecision.decision_label}
            </div>
          </div>
          <div className="iec-dossier-item">
            <div className="iec-dossier-item-label">Deliberation Date</div>
            <div className="iec-dossier-item-value">
              {existingDecision.decision_date ? new Date(existingDecision.decision_date).toLocaleString() : "N/A"}
            </div>
          </div>
          <div className="iec-dossier-item">
            <div className="iec-dossier-item-label">Recorded By</div>
            <div className="iec-dossier-item-value">
              {existingDecision.decided_by?.full_name} ({existingDecision.decided_by?.role})
            </div>
          </div>
          <div className="iec-dossier-item">
            <div className="iec-dossier-item-label">Resulting Study Status</div>
            <div className="iec-dossier-item-value" style={{ color: "#34d399", fontFamily: "monospace" }}>
              {existingDecision.study_status}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div className="iec-dossier-item-label">Committee Remarks / Clinical Rationale</div>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "14px",
              fontSize: "0.9rem",
              color: "#e2e8f0",
              whiteSpace: "pre-wrap",
              marginTop: "6px",
            }}
          >
            {existingDecision.remarks || existingDecision.comments || "No remarks recorded."}
          </div>
        </div>

        {existingDecision.conditions && (
          <div style={{ marginTop: "16px" }}>
            <div className="iec-dossier-item-label">Stipulations & Conditions for Conduct</div>
            <div
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "0.9rem",
                color: "#fbbf24",
                whiteSpace: "pre-wrap",
                marginTop: "6px",
              }}
            >
              {existingDecision.conditions}
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedOptionObj = OUTCOME_OPTIONS.find((o) => o.key === selectedDecision);

  return (
    <div className="iec-decision-card">
      <div className="iec-decision-card-title">
        <span>⚖️ Record Committee Ethical Decision</span>
        <span style={{ fontSize: "0.82rem", color: "#94a3b8", fontWeight: 400 }}>
          Authorized IEC Members & Secretariat
        </span>
      </div>

      <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: 0, marginBottom: "20px" }}>
        Select the formal ethical committee decision outcome. The selection will update the study's official workflow status across the platform.
      </p>

      {validationError && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.88rem",
          }}
        >
          ⚠️ {validationError}
        </div>
      )}

      {/* 3 Outcome Options */}
      <div className="iec-decision-options-grid">
        {OUTCOME_OPTIONS.map((opt) => {
          const isSelected = selectedDecision === opt.key;
          return (
            <div
              key={opt.key}
              className={`iec-decision-option-card ${opt.key} ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelectOutcome(opt.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleSelectOutcome(opt.key);
              }}
            >
              <div className="iec-decision-option-top">
                <span className="iec-decision-option-label">{opt.label}</span>
                <span className="iec-decision-option-icon">{opt.icon}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 500 }}>
                {opt.subLabel}
              </div>
              <p className="iec-decision-option-desc">{opt.description}</p>
              <div className="iec-decision-option-tag">{opt.nextStep}</div>
            </div>
          );
        })}
      </div>

      {/* Rationale & Remarks */}
      <div className="iec-decision-form-group">
        <label className="iec-decision-form-label" htmlFor="iec-decision-remarks">
          Committee Deliberation Remarks & Rationale <span className="iec-decision-required">*</span>
        </label>
        <textarea
          id="iec-decision-remarks"
          className="iec-decision-textarea"
          rows={4}
          placeholder="Provide detailed ethical justification, review findings, risk-benefit rationale, and discussion summary..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="iec-decision-field-hint">
          Mandatory for CDSCO/GCP ethics committee record keeping. Will be included in the official approval letter.
        </div>
      </div>

      {/* Conditions / Stipulations */}
      <div className="iec-decision-form-group">
        <label className="iec-decision-form-label" htmlFor="iec-decision-conditions">
          Specific Stipulations / Reporting Conditions (Optional)
        </label>
        <textarea
          id="iec-decision-conditions"
          className="iec-decision-textarea"
          style={{ minHeight: "80px" }}
          placeholder="e.g., Mandatory quarterly DSMB safety reporting, annual renewal requirement, or translation of ICF in local vernacular..."
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
          disabled={isSubmitting}
        />
        <div className="iec-decision-field-hint">
          Specify any ongoing compliance requirements or deadlines attached to this ethical clearance.
        </div>
      </div>

      {/* Submit Action */}
      <div className="iec-decision-actions">
        <button
          type="button"
          className="iec-decision-submit-btn"
          onClick={handleOpenConfirm}
          disabled={!selectedDecision || !comments.trim() || isSubmitting}
        >
          <span>⚖️ Review & Finalize Official Decision</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      <IECDecisionConfirmation
        isOpen={showConfirmModal}
        study={study}
        decision={selectedDecision}
        decisionLabel={selectedOptionObj?.label || selectedDecision}
        comments={comments}
        conditions={conditions}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmModal(false)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
