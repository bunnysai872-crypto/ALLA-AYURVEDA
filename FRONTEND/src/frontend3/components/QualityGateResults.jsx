import React from "react";

function getScoreColor(score) {
  if (score === null || score === undefined) return "var(--f3-text-muted)";
  if (score >= 80) return "var(--f3-status-online, #22c55e)";
  if (score >= 60) return "var(--f3-status-warning, #eab308)";
  return "var(--f3-status-offline, #ef4444)";
}

function getStatusBadge(status) {
  switch (status) {
    case "passed":
      return <span className="f3-qg-status-pill f3-qg-status-passed">✓ Passed</span>;
    case "passed_with_warnings":
      return <span className="f3-qg-status-pill f3-qg-status-warning">⚠️ Warnings</span>;
    case "issues_found":
      return <span className="f3-qg-status-pill f3-qg-status-issues">⚠️ Issues Found</span>;
    case "blocked":
      return <span className="f3-qg-status-pill f3-qg-status-blocked">🚫 Blocked</span>;
    default:
      return <span className="f3-qg-status-pill">Pending</span>;
  }
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * QualityGateResults Component
 * 
 * Renders the AI Quality Gate evaluation score hero and the 3 category cards:
 * Completeness, Consistency, Cross-Document Concordance.
 */
export function QualityGateResults({ qualityCheck, onReRun, running }) {
  if (!qualityCheck) return null;

  const {
    score,
    status,
    summary,
    completeness_data,
    consistency_data,
    cross_document_data,
    created_at,
  } = qualityCheck;

  const scoreColor = getScoreColor(score);

  return (
    <div>
      {/* Deterministic / Rule-Based Notice */}
      <div className="f3-qg-disclosure-banner">
        <span style={{ fontSize: "18px" }}>⚖️</span>
        <div>
          <strong>Deterministic Quality Gate Engine:</strong> Evaluated using algorithmic cross-validation
          against Good Clinical Practice (GCP), Indian GCP, and AYUSH standardized clinical trial metrics.
          Rules are deterministic and reproducible.
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="f3-qg-score-hero">
        <div className="f3-qg-score-left">
          <div className="f3-qg-score-badge-circle" style={{ borderColor: scoreColor }}>
            <span className="f3-qg-score-num" style={{ color: scoreColor }}>
              {score !== null ? score : "—"}
            </span>
            <span className="f3-qg-score-max">/ 100</span>
          </div>

          <div className="f3-qg-score-info">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h2>Clinical Trial Readiness Evaluation</h2>
              {getStatusBadge(status)}
            </div>
            <p>{summary || "Comprehensive cross-document consistency and completeness check."}</p>
            {created_at && (
              <span style={{ fontSize: "11px", color: "var(--f3-text-muted)" }}>
                Last evaluated: {new Date(created_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {onReRun && (
          <button
            type="button"
            className="f3-btn f3-btn-primary"
            onClick={onReRun}
            disabled={running}
          >
            {running ? (
              <>
                <span className="f3-refresh-icon f3-spinning">↻</span>
                <span>Running Checks...</span>
              </>
            ) : (
              <>
                <span>⚡ Re-Run Quality Gate</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 3 Core Categories Grid */}
      <div className="f3-qg-categories-grid">
        {/* Category 1: Completeness */}
        <div className="f3-qg-category-card">
          <div className="f3-qg-category-header">
            <div className="f3-qg-cat-title-wrap">
              <span className="f3-qg-cat-icon">📋</span>
              <h3 className="f3-qg-cat-title">Completeness</h3>
            </div>
            {getStatusBadge(completeness_data?.status || "pending")}
          </div>
          <p style={{ fontSize: "12px", color: "var(--f3-text-secondary)", margin: 0 }}>
            Verifies presence of required trial metadata, mandatory document types (Protocol, ICF), and protocol boundaries.
          </p>
          <div style={{ borderTop: "1px solid var(--f3-border-subtle)", paddingTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f3-text-muted)", textTransform: "uppercase" }}>
              Verification Rules:
            </span>
            <ul className="f3-qg-checklist" style={{ marginTop: "6px" }}>
              {(completeness_data?.checked_items || [
                "Study Title & Protocol Number",
                "Study Description / Rationale",
                "Mandatory Document Types (Protocol, ICF)",
                "Inclusion & Exclusion Criteria",
                "Safety Monitoring Plan",
              ]).map((item, idx) => (
                <li key={idx} className="f3-qg-check-item">
                  <span className="f3-qg-check-bullet">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Category 2: Consistency */}
        <div className="f3-qg-category-card">
          <div className="f3-qg-category-header">
            <div className="f3-qg-cat-title-wrap">
              <span className="f3-qg-cat-icon">🎯</span>
              <h3 className="f3-qg-cat-title">Consistency</h3>
            </div>
            {getStatusBadge(consistency_data?.status || "pending")}
          </div>
          <p style={{ fontSize: "12px", color: "var(--f3-text-secondary)", margin: 0 }}>
            Inspects internal coherence between title, objectives, intervention details, and study design parameters.
          </p>
          <div style={{ borderTop: "1px solid var(--f3-border-subtle)", paddingTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f3-text-muted)", textTransform: "uppercase" }}>
              Verification Rules:
            </span>
            <ul className="f3-qg-checklist" style={{ marginTop: "6px" }}>
              {(consistency_data?.checked_items || [
                "Protocol Number Uniformity",
                "Study Objective Alignment",
                "Botanical Formulation Specifications",
                "Internal Section Consistency",
              ]).map((item, idx) => (
                <li key={idx} className="f3-qg-check-item">
                  <span className="f3-qg-check-bullet">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Category 3: Cross-Document Concordance */}
        <div className="f3-qg-category-card">
          <div className="f3-qg-category-header">
            <div className="f3-qg-cat-title-wrap">
              <span className="f3-qg-cat-icon">📑</span>
              <h3 className="f3-qg-cat-title">Cross-Document</h3>
            </div>
            {getStatusBadge(cross_document_data?.status || "pending")}
          </div>
          <p style={{ fontSize: "12px", color: "var(--f3-text-secondary)", margin: 0 }}>
            Automated cross-check comparing extracted text across Study record ↔ Protocol document ↔ Informed Consent Form.
          </p>
          <div style={{ borderTop: "1px solid var(--f3-border-subtle)", paddingTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--f3-text-muted)", textTransform: "uppercase" }}>
              Verification Rules:
            </span>
            <ul className="f3-qg-checklist" style={{ marginTop: "6px" }}>
              {(cross_document_data?.checked_items || [
                "Sample Size Concordance (Protocol vs ICF)",
                "Intervention Duration Matching",
                "Protocol ID Mention Uniformity",
                "Safety Schedule Harmonization",
              ]).map((item, idx) => (
                <li key={idx} className="f3-qg-check-item">
                  <span className="f3-qg-check-bullet">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QualityGateResults;
