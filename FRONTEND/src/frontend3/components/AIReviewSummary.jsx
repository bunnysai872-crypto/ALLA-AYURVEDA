import React from "react";
import AIReviewSummarySection from "./AIReviewSummarySection";

export function AIReviewSummary({ summaryData, onRefresh }) {
  if (!summaryData) return null;

  const {
    meta,
    study_overview,
    protocol_summary,
    document_readiness,
    quality_gate,
    iec_member_review,
    ethical_risk_summary,
    key_strengths,
    key_concerns,
    required_follow_up,
    overall_snapshot,
  } = summaryData;

  const getRecBadge = (rec) => {
    switch (rec) {
      case "recommend_approval":
        return <span className="iec-badge iec-badge-rec-approval">✓ Recommend Approval</span>;
      case "recommend_modification":
        return <span className="iec-badge iec-badge-rec-modification">⚠ Recommend Modification</span>;
      case "recommend_rejection":
        return <span className="iec-badge iec-badge-rec-rejection">✕ Recommend Rejection</span>;
      default:
        return <span className="iec-badge iec-badge-ready">{rec || "Recommendation Recorded"}</span>;
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case "satisfactory":
        return "#34d399";
      case "minor_concerns":
        return "#fbbf24";
      case "major_concerns":
        return "#f87171";
      case "not_acceptable":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="ai-summary-wrapper">
      {/* 1. DISCLAIMER & TRANSPARENCY NOTICE */}
      <div className="ai-summary-disclaimer-box">
        <div className="ai-summary-disclaimer-title">
          <span>ⓘ</span> AI-Assisted Review Summary • Transparency & Governance Notice
        </div>
        <p className="ai-summary-disclaimer-text">
          {meta?.transparency_notice}
        </p>
        <p className="ai-summary-disclaimer-text" style={{ marginTop: "6px", color: "#d4af37", fontWeight: 600 }}>
          {meta?.decision_disclaimer}
        </p>
      </div>

      {/* 2. OVERALL REVIEW SNAPSHOT */}
      <div className="ai-summary-snapshot-card">
        <div className="ai-summary-snapshot-header">
          <span className="ai-summary-snapshot-label">
            <span>✦</span> Executive Review Synthesis Snapshot
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {getRecBadge(iec_member_review?.recommendation)}
            {onRefresh && (
              <button
                type="button"
                className="iec-btn-secondary"
                style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                onClick={onRefresh}
              >
                ↻ Refresh
              </button>
            )}
          </div>
        </div>
        <p className="ai-summary-snapshot-text">{overall_snapshot}</p>
      </div>

      {/* 3. STUDY OVERVIEW */}
      <AIReviewSummarySection
        title="Study Overview"
        icon="📖"
        badge={
          <span style={{ fontSize: "0.78rem", color: "#d4af37", fontWeight: 600 }}>
            {study_overview?.study_id}
          </span>
        }
      >
        <div className="ai-summary-grid">
          <div className="ai-summary-meta-item">
            <strong>Study Title</strong>
            <span>{study_overview?.title}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Study Type</strong>
            <span>{study_overview?.study_type}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Study Design</strong>
            <span>{study_overview?.study_design}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Clinical Condition</strong>
            <span>{study_overview?.condition}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Principal Researcher</strong>
            <span>{study_overview?.principal_researcher?.full_name} ({study_overview?.principal_researcher?.email})</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Estimated Sample Size</strong>
            <span>{study_overview?.sample_size}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Study Duration</strong>
            <span>{study_overview?.study_duration}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Target Population</strong>
            <span>{study_overview?.target_population}</span>
          </div>
        </div>

        <div style={{ marginTop: "14px" }}>
          <strong style={{ display: "block", fontSize: "0.74rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
            Research Objective
          </strong>
          <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#e2e8f0" }}>
            {study_overview?.research_objective}
          </div>
        </div>
      </AIReviewSummarySection>

      {/* 4. PROTOCOL ASSESSMENT */}
      <AIReviewSummarySection
        title="Protocol Assessment"
        icon="🔬"
        badge={
          <span style={{ fontSize: "0.76rem", color: protocol_summary?.protocol_available ? "#34d399" : "#f87171" }}>
            {protocol_summary?.protocol_available ? `Protocol v${protocol_summary?.protocol_version}` : "Protocol Not Linked"}
          </span>
        }
      >
        <div className="ai-summary-grid" style={{ marginBottom: "14px" }}>
          <div className="ai-summary-meta-item">
            <strong>Intervention Name & Regimen</strong>
            <span>{protocol_summary?.intervention?.name} ({protocol_summary?.intervention?.dosage})</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Route & Frequency</strong>
            <span>{protocol_summary?.intervention?.route} • {protocol_summary?.intervention?.frequency}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Primary Outcome</strong>
            <span>{protocol_summary?.outcomes?.primary}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Secondary Outcome</strong>
            <span>{protocol_summary?.outcomes?.secondary}</span>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong style={{ display: "block", fontSize: "0.74rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
            Background & Classical Ayurvedic Rationale
          </strong>
          <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#e2e8f0" }}>
            {protocol_summary?.background_and_rationale}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <strong style={{ display: "block", fontSize: "0.74rem", color: "#34d399", textTransform: "uppercase", marginBottom: "4px" }}>
              Inclusion Criteria
            </strong>
            <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 12px", borderRadius: "6px", fontSize: "0.82rem", color: "#cbd5e1" }}>
              {protocol_summary?.eligibility_criteria?.inclusion}
            </div>
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "0.74rem", color: "#f87171", textTransform: "uppercase", marginBottom: "4px" }}>
              Exclusion Criteria
            </strong>
            <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 12px", borderRadius: "6px", fontSize: "0.82rem", color: "#cbd5e1" }}>
              {protocol_summary?.eligibility_criteria?.exclusion}
            </div>
          </div>
        </div>

        <div>
          <strong style={{ display: "block", fontSize: "0.74rem", color: "#fbbf24", textTransform: "uppercase", marginBottom: "4px" }}>
            Safety Monitoring & Adverse Event Procedures
          </strong>
          <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.84rem", color: "#cbd5e1" }}>
            {protocol_summary?.safety_procedures?.monitoring}
          </div>
        </div>
      </AIReviewSummarySection>

      {/* 5. DOCUMENT READINESS */}
      <AIReviewSummarySection
        title="Document Readiness"
        icon="🛡"
        badge={
          <span style={{ fontSize: "0.76rem", color: document_readiness?.mandatory_documents_verified ? "#34d399" : "#f59e0b" }}>
            {document_readiness?.verified_count}/{document_readiness?.total_documents} Verified
          </span>
        }
      >
        <div className="ai-summary-grid" style={{ marginBottom: "14px" }}>
          <div className="ai-summary-meta-item">
            <strong>Total Submitted Documents</strong>
            <span>{document_readiness?.total_documents}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Secretariat Verified</strong>
            <span style={{ color: "#34d399" }}>{document_readiness?.verified_count}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Pending Verification</strong>
            <span style={{ color: "#fbbf24" }}>{document_readiness?.pending_count}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Correction Required</strong>
            <span style={{ color: "#f87171" }}>{document_readiness?.correction_required_count}</span>
          </div>
        </div>

        <strong style={{ display: "block", fontSize: "0.76rem", color: "#d4af37", textTransform: "uppercase", marginBottom: "8px" }}>
          Document Inventory & Verification Records
        </strong>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "8px" }}>
          {document_readiness?.documents_catalog?.map((d) => (
            <div
              key={d.id}
              style={{
                background: "rgba(10, 22, 19, 0.7)",
                border: "1px solid rgba(45, 75, 65, 0.4)",
                padding: "8px 12px",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "#f8fafc" }}>{d.name}</div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{d.document_type} (v{d.version})</div>
              </div>
              <span className={`iec-badge ${d.status === "verified" ? "iec-badge-ready" : "iec-badge-under-review"}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </AIReviewSummarySection>

      {/* 6. QUALITY GATE SUMMARY */}
      <AIReviewSummarySection
        title="AI Quality Gate Summary"
        icon="✦"
        badge={
          quality_gate?.score != null ? (
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: quality_gate.score >= 70 ? "#34d399" : "#f87171" }}>
              Score: {quality_gate.score}/100 ({quality_gate.status})
            </span>
          ) : (
            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Not Evaluated</span>
          )
        }
      >
        <p style={{ margin: "0 0 12px 0", fontSize: "0.86rem", color: "#cbd5e1" }}>
          {quality_gate?.summary}
        </p>

        {quality_gate?.risk_flags && quality_gate.risk_flags.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ display: "block", fontSize: "0.74rem", color: "#f87171", textTransform: "uppercase", marginBottom: "4px" }}>
              Identified Risk Flags
            </strong>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#f87171", fontSize: "0.82rem" }}>
              {quality_gate.risk_flags.map((flag, idx) => (
                <li key={idx} style={{ marginBottom: "2px" }}>
                  {typeof flag === "string" ? flag : flag.message || JSON.stringify(flag)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {quality_gate?.recommendations && quality_gate.recommendations.length > 0 && (
          <div>
            <strong style={{ display: "block", fontSize: "0.74rem", color: "#34d399", textTransform: "uppercase", marginBottom: "4px" }}>
              Quality Gate Improvement Recommendations
            </strong>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1", fontSize: "0.82rem" }}>
              {quality_gate.recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: "2px" }}>
                  {typeof rec === "string" ? rec : rec.text || JSON.stringify(rec)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AIReviewSummarySection>

      {/* 7. IEC MEMBER REVIEW */}
      <AIReviewSummarySection
        title="IEC Member Review"
        icon="🗳"
        badge={getRecBadge(iec_member_review?.recommendation)}
      >
        <div className="ai-summary-grid" style={{ marginBottom: "14px" }}>
          <div className="ai-summary-meta-item">
            <strong>Reviewer Name</strong>
            <span>{iec_member_review?.reviewer?.full_name}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Reviewer Email</strong>
            <span>{iec_member_review?.reviewer?.email}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Review Timestamp</strong>
            <span>{iec_member_review?.review_date ? new Date(iec_member_review.review_date).toLocaleString() : "Recorded"}</span>
          </div>
          <div className="ai-summary-meta-item">
            <strong>Recommendation Type</strong>
            <span>{iec_member_review?.recommendation_label}</span>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <strong style={{ display: "block", fontSize: "0.74rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
            Reviewer Observations & Comments
          </strong>
          <div style={{ background: "rgba(10, 22, 19, 0.7)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#f1f5f9", lineHeight: 1.5 }}>
            {iec_member_review?.comments}
          </div>
        </div>

        {/* Structured Domains Table */}
        <strong style={{ display: "block", fontSize: "0.74rem", color: "#d4af37", textTransform: "uppercase", marginBottom: "6px" }}>
          Review Domain Ratings & Field Notes
        </strong>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.entries(iec_member_review?.domains || {}).map(([key, domain]) => (
            <div
              key={key}
              style={{
                background: "rgba(14, 28, 25, 0.6)",
                border: "1px solid rgba(45, 75, 65, 0.4)",
                padding: "8px 12px",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "#f8fafc", textTransform: "capitalize" }}>
                  {key.replace(/_/g, " ")}
                </span>
                {domain?.notes && (
                  <div style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
                    {domain.notes}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: getRatingColor(domain?.rating) }}>
                {domain?.rating?.replace(/_/g, " ").toUpperCase() || "SATISFACTORY"}
              </span>
            </div>
          ))}
        </div>
      </AIReviewSummarySection>

      {/* 8. ETHICAL RISK SUMMARY */}
      <AIReviewSummarySection
        title="Ethical Risk Summary (Synthesized Across Dossier)"
        icon="⚖"
      >
        <div className="ai-summary-risk-grid">
          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>🛡</span> Participant Safety
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.participant_safety?.domain_evaluation}
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>✍</span> Informed Consent
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.informed_consent?.domain_evaluation} (ICF {ethical_risk_summary?.informed_consent?.document_status})
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>🔒</span> Confidentiality & Data Protection
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.confidentiality?.domain_evaluation}
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>⚖</span> Risk-Benefit Profile
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.risk_benefit?.domain_evaluation}
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>🔬</span> Methodology & Validity
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.methodology?.domain_evaluation}
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>🌿</span> Ayurvedic Formulation Regimen
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.intervention?.domain_evaluation}
            </div>
          </div>

          <div className="ai-summary-risk-card">
            <div className="ai-summary-risk-card-title">
              <span>🤝</span> Ethical Considerations & Community
            </div>
            <div className="ai-summary-risk-card-body">
              {ethical_risk_summary?.other_ethical_concerns?.domain_evaluation}
            </div>
          </div>
        </div>
      </AIReviewSummarySection>

      {/* 9. KEY STRENGTHS */}
      <AIReviewSummarySection
        title="Key Strengths"
        icon="✓"
        badge={<span style={{ fontSize: "0.76rem", color: "#34d399" }}>{key_strengths?.length || 0} Positive Factors</span>}
      >
        <ul className="ai-summary-list">
          {key_strengths?.map((strength, idx) => (
            <li key={idx} className="ai-summary-list-item ai-summary-strength-item">
              <span>✓</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </AIReviewSummarySection>

      {/* 10. KEY CONCERNS */}
      <AIReviewSummarySection
        title="Key Concerns"
        icon="⚠"
        badge={<span style={{ fontSize: "0.76rem", color: "#f59e0b" }}>{key_concerns?.length || 0} Cautionary Notes</span>}
      >
        <ul className="ai-summary-list">
          {key_concerns?.map((concern, idx) => (
            <li key={idx} className="ai-summary-list-item ai-summary-concern-item">
              <span>⚠</span>
              <span>{concern}</span>
            </li>
          ))}
        </ul>
      </AIReviewSummarySection>

      {/* 11. REQUIRED FOLLOW-UP */}
      <AIReviewSummarySection
        title="Required Follow-up Actions"
        icon="📋"
        badge={<span style={{ fontSize: "0.76rem", color: "#60a5fa" }}>Actionable Items</span>}
      >
        <ul className="ai-summary-list">
          {required_follow_up?.map((item, idx) => (
            <li key={idx} className="ai-summary-list-item ai-summary-followup-item">
              <span>→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </AIReviewSummarySection>
    </div>
  );
}

export default AIReviewSummary;
