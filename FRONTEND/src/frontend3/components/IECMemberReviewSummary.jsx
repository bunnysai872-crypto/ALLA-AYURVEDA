import React from "react";

export function IECMemberReviewSummary({ review, domains = [], onRevise = null }) {
  if (!review) return null;

  const getRecBadge = (rec) => {
    switch (rec) {
      case "recommend_approval":
        return <span className="iec-badge iec-badge-rec-approval">✓ Recommend Approval</span>;
      case "recommend_modification":
        return <span className="iec-badge iec-badge-rec-modification">⚠ Recommend Modification</span>;
      case "recommend_rejection":
        return <span className="iec-badge iec-badge-rec-rejection">✕ Recommend Rejection</span>;
      default:
        return <span className="iec-badge iec-badge-ready">{rec}</span>;
    }
  };

  const getRatingBadge = (rating) => {
    switch (rating) {
      case "satisfactory":
        return <span style={{ color: "#34d399", fontWeight: 600 }}>✓ Satisfactory</span>;
      case "minor_concerns":
        return <span style={{ color: "#fbbf24", fontWeight: 600 }}>⚠ Minor Concerns</span>;
      case "major_concerns":
        return <span style={{ color: "#f87171", fontWeight: 600 }}>✕ Major Concerns</span>;
      case "not_acceptable":
        return <span style={{ color: "#ef4444", fontWeight: 700 }}>⛔ Not Acceptable</span>;
      default:
        return <span style={{ color: "#94a3b8" }}>{rating || "Satisfactory"}</span>;
    }
  };

  const formattedDate = review.review_timestamp
    ? new Date(review.review_timestamp).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Timestamp recorded";

  return (
    <div className="iec-member-review-summary">
      <div className="iec-summary-banner">
        <div className="iec-summary-info">
          <span className="iec-summary-icon">⚖</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <strong style={{ fontSize: "1.1rem", color: "#f8fafc" }}>
                IEC Recommendation Submitted
              </strong>
              {getRecBadge(review.recommendation)}
            </div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#cbd5e1" }}>
              Reviewed by <strong>{review.reviewer_name}</strong> ({review.reviewer_email}) on {formattedDate}
            </p>
          </div>
        </div>

        {onRevise && (
          <button type="button" className="iec-btn-secondary" onClick={onRevise}>
            ✎ Update Recommendation
          </button>
        )}
      </div>

      <div className="iec-panel-card" style={{ marginBottom: "20px" }}>
        <div className="iec-panel-header">
          <h4 className="iec-panel-title">
            <span>📝</span> Executive Review Summary & Rationale
          </h4>
        </div>

        <div style={{ background: "rgba(10, 22, 19, 0.7)", padding: "14px 16px", borderRadius: "8px", border: "1px solid rgba(45, 75, 65, 0.4)", whiteSpace: "pre-wrap", fontSize: "0.9rem", color: "#f1f5f9", lineHeight: 1.6 }}>
          {review.comments}
        </div>

        {review.reviewer_notes && (
          <div style={{ marginTop: "16px" }}>
            <strong style={{ display: "block", fontSize: "0.78rem", color: "#d4af37", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              Confidential Committee Notes
            </strong>
            <div style={{ background: "rgba(20, 35, 30, 0.6)", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(212, 175, 55, 0.2)", fontSize: "0.84rem", color: "#cbd5e1" }}>
              {review.reviewer_notes}
            </div>
          </div>
        )}
      </div>

      {/* DOMAINS BREAKDOWN */}
      <div className="iec-panel-card">
        <div className="iec-panel-header">
          <h4 className="iec-panel-title">
            <span>🔬</span> 10 Review Domains Evaluation
          </h4>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {domains.map((domain) => {
            const item = review.sections?.[domain.key] || { rating: "satisfactory", notes: "" };
            return (
              <div
                key={domain.key}
                style={{
                  background: "rgba(14, 28, 25, 0.6)",
                  border: "1px solid rgba(45, 75, 65, 0.4)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "14px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>
                    {domain.label}
                  </div>
                  {item.notes ? (
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
                      {item.notes}
                    </p>
                  ) : (
                    <span style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic" }}>
                      No specific notes entered
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "0.82rem" }}>
                  {getRatingBadge(item.rating)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default IECMemberReviewSummary;
