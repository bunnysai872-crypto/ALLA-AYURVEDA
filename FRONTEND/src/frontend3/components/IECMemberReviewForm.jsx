import React, { useState } from "react";

const RATING_OPTIONS = [
  { value: "satisfactory", label: "✓ Satisfactory" },
  { value: "minor_concerns", label: "⚠ Minor Concerns" },
  { value: "major_concerns", label: "✕ Major Concerns" },
  { value: "not_acceptable", label: "⛔ Not Acceptable" },
];

export function IECMemberReviewForm({ domains = [], onSubmit, isSubmitting = false }) {
  const [recommendation, setRecommendation] = useState("");
  const [comments, setComments] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [sectionData, setSectionData] = useState(() => {
    const initial = {};
    domains.forEach((d) => {
      initial[d.key] = { rating: "satisfactory", notes: "" };
    });
    return initial;
  });
  const [validationError, setValidationError] = useState("");

  const handleDomainChange = (key, field, value) => {
    setSectionData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { rating: "satisfactory", notes: "" }),
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    if (!recommendation) {
      setValidationError("Please select your overall review recommendation (Approval, Modification, or Rejection).");
      return;
    }

    if (!comments.trim()) {
      setValidationError("Overall review comments and observations are required.");
      return;
    }

    onSubmit({
      recommendation,
      comments: comments.trim(),
      sections: sectionData,
      reviewer_notes: reviewerNotes.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="iec-member-review-form">
      <div className="iec-panel-card" style={{ marginBottom: "20px" }}>
        <div className="iec-panel-header">
          <h3 className="iec-panel-title">
            <span>⚖</span> Structured IEC Ethical Review Evaluation
          </h3>
          <span style={{ fontSize: "0.78rem", color: "#d4af37" }}>
            10 Standardized Clinical & Ethical Domains
          </span>
        </div>

        <p style={{ fontSize: "0.84rem", color: "#94a3b8", marginTop: 0, marginBottom: "18px" }}>
          Scrutinize the study protocol, investigator documentation, participant safeguards, and Ayurvedic interventions against national ethical guidelines for biomedical and AYUSH research.
        </p>

        {domains.map((domain) => {
          const current = sectionData[domain.key] || { rating: "satisfactory", notes: "" };
          return (
            <div key={domain.key} className="iec-domain-card">
              <div className="iec-domain-header">
                <div>
                  <h4 className="iec-domain-title">{domain.label}</h4>
                  <p className="iec-domain-desc">{domain.description}</p>
                </div>
                <div>
                  <select
                    className="iec-domain-rating-select"
                    value={current.rating}
                    onChange={(e) => handleDomainChange(domain.key, "rating", e.target.value)}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                className="iec-domain-textarea"
                placeholder={`Observations & remarks on ${domain.label.replace(/^\d+\.\s*/, "")}...`}
                value={current.notes}
                onChange={(e) => handleDomainChange(domain.key, "notes", e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* OVERALL RECOMMENDATION SELECTOR */}
      <div className="iec-panel-card" style={{ marginBottom: "20px" }}>
        <div className="iec-panel-header">
          <h3 className="iec-panel-title">
            <span>🗳</span> Member Review Recommendation
          </h3>
          <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
            Mandatory Selection
          </span>
        </div>

        <p style={{ fontSize: "0.84rem", color: "#94a3b8", marginTop: 0 }}>
          Select your official recommendation for the Institutional Ethics Committee review. Note: This recommendation is submitted to the committee and does not directly activate or finalize the study.
        </p>

        <div className="iec-recommendation-options">
          {/* OPTION 1: RECOMMEND APPROVAL */}
          <div
            className={`iec-rec-card ${recommendation === "recommend_approval" ? "selected-approval" : ""}`}
            onClick={() => setRecommendation("recommend_approval")}
            role="button"
            tabIndex={0}
          >
            <div className="iec-rec-card-title">
              <span>✓</span> Recommend Approval
            </div>
            <div className="iec-rec-card-desc">
              Study protocol, participant safeguards, and Ayurvedic interventions meet ethical and scientific standards.
            </div>
          </div>

          {/* OPTION 2: RECOMMEND MODIFICATION */}
          <div
            className={`iec-rec-card ${recommendation === "recommend_modification" ? "selected-modification" : ""}`}
            onClick={() => setRecommendation("recommend_modification")}
            role="button"
            tabIndex={0}
          >
            <div className="iec-rec-card-title">
              <span>⚠</span> Recommend Modification
            </div>
            <div className="iec-rec-card-desc">
              Minor/major adjustments required (e.g. vernacular ICF clarification, adverse event reporting schedule).
            </div>
          </div>

          {/* OPTION 3: RECOMMEND REJECTION */}
          <div
            className={`iec-rec-card ${recommendation === "recommend_rejection" ? "selected-rejection" : ""}`}
            onClick={() => setRecommendation("recommend_rejection")}
            role="button"
            tabIndex={0}
          >
            <div className="iec-rec-card-title">
              <span>✕</span> Recommend Rejection
            </div>
            <div className="iec-rec-card-desc">
              Significant scientific or ethical deficiencies that pose unjustified participant risk.
            </div>
          </div>
        </div>

        {/* OVERALL COMMENTS */}
        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "#f1f5f9", marginBottom: "6px" }}>
            Executive Review Summary & Observations *
          </label>
          <textarea
            className="iec-domain-textarea"
            style={{ minHeight: "100px" }}
            placeholder="State your overall clinical and ethical rationale for this recommendation..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            required
          />
        </div>

        {/* CONFIDENTIAL REVIEWER NOTES */}
        <div style={{ marginTop: "16px" }}>
          <label style={{ display: "block", fontSize: "0.86rem", fontWeight: 600, color: "#94a3b8", marginBottom: "6px" }}>
            Confidential Committee Notes (Optional)
          </label>
          <textarea
            className="iec-domain-textarea"
            style={{ minHeight: "70px" }}
            placeholder="Internal notes visible to fellow IEC Members and Secretariat..."
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
          />
        </div>

        {validationError && (
          <div style={{ marginTop: "14px", padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "6px", color: "#f87171", fontSize: "0.84rem" }}>
            ⚠ {validationError}
          </div>
        )}

        <div style={{ marginTop: "22px", display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Action will record reviewer identity & timestamp into audit ledger
          </span>
          <button
            type="submit"
            className="iec-btn-primary"
            disabled={isSubmitting}
            style={{ padding: "11px 24px", fontSize: "0.92rem" }}
          >
            {isSubmitting ? "Submitting Recommendation..." : "Submit IEC Recommendation →"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default IECMemberReviewForm;
