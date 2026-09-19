import React, { useState, useMemo } from "react";

function getSeverityBadge(severity) {
  const sev = (severity || "").toUpperCase();
  switch (sev) {
    case "CRITICAL":
      return <span className="f3-qg-severity-badge f3-qg-sev-critical">Critical</span>;
    case "HIGH":
      return <span className="f3-qg-severity-badge f3-qg-sev-high">High</span>;
    case "WARNING":
      return <span className="f3-qg-severity-badge f3-qg-sev-warning">Warning</span>;
    default:
      return <span className="f3-qg-severity-badge f3-qg-sev-info">Informational</span>;
  }
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * QualityGateIssues Component
 * 
 * Aggregates all issues detected across Completeness, Consistency,
 * and Cross-Document validation, with severity filters and actionable recommendations.
 */
export function QualityGateIssues({ qualityCheck }) {
  const [severityFilter, setSeverityFilter] = useState("all");

  // Collect all issues across all categories
  const allIssues = useMemo(() => {
    if (!qualityCheck) return [];

    const issues = [];
    if (Array.isArray(qualityCheck.completeness_data?.issues)) {
      qualityCheck.completeness_data.issues.forEach((i) =>
        issues.push({ ...i, category: "Completeness" })
      );
    }
    if (Array.isArray(qualityCheck.consistency_data?.issues)) {
      qualityCheck.consistency_data.issues.forEach((i) =>
        issues.push({ ...i, category: "Consistency" })
      );
    }
    if (Array.isArray(qualityCheck.cross_document_data?.issues)) {
      qualityCheck.cross_document_data.issues.forEach((i) =>
        issues.push({ ...i, category: "Cross-Document" })
      );
    }
    return issues;
  }, [qualityCheck]);

  // Filter issues by severity
  const filteredIssues = useMemo(() => {
    if (severityFilter === "all") return allIssues;
    return allIssues.filter(
      (i) => (i.severity || "").toLowerCase() === severityFilter.toLowerCase()
    );
  }, [allIssues, severityFilter]);

  const riskFlags = qualityCheck?.risk_flags || [];

  return (
    <div className="f3-qg-issues-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px 0", color: "var(--f3-text-primary)" }}>
            Detected Quality Discrepancies & Flags ({allIssues.length})
          </h3>
          <p style={{ fontSize: "13px", color: "var(--f3-text-muted)", margin: 0 }}>
            Resolve critical and high severity findings before submitting the dossier for IEC review.
          </p>
        </div>

        {/* Severity Filter Tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            { id: "all", label: `All (${allIssues.length})` },
            { id: "critical", label: "Critical" },
            { id: "high", label: "High" },
            { id: "warning", label: "Warnings" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`f3-filter-tab ${severityFilter === tab.id ? "f3-filter-tab-active" : ""}`}
              onClick={() => setSeverityFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Flags summary banner if present */}
      {riskFlags.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", color: "var(--f3-status-warning)", margin: "0 0 8px 0" }}>
            ⚠️ Regulatory Risk Flags Identified:
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {riskFlags.map((flag, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(234, 179, 8, 0.08)",
                  border: "1px solid rgba(234, 179, 8, 0.25)",
                  borderRadius: "var(--f3-radius-sm)",
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "#fde047",
                }}
              >
                <strong>{flag.title || flag.code}:</strong> {flag.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
          <h4 style={{ fontSize: "15px", margin: "0 0 6px 0", color: "var(--f3-brand-green-light)" }}>
            No Discrepancies Detected in This Category
          </h4>
          <p style={{ fontSize: "13px", color: "var(--f3-text-muted)", margin: 0 }}>
            All evaluated items meet consistency, completeness, and documentation standards.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredIssues.map((issue, idx) => (
            <div key={idx} className="f3-qg-issue-item">
              <div className="f3-qg-issue-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getSeverityBadge(issue.severity)}
                  <span style={{ fontSize: "11px", color: "var(--f3-text-muted)", textTransform: "uppercase" }}>
                    {issue.category}
                  </span>
                  {issue.field && (
                    <span className="f3-qg-issue-field">[{issue.field}]</span>
                  )}
                </div>
              </div>

              <p className="f3-qg-issue-msg">{issue.message}</p>

              {issue.recommendation && (
                <div className="f3-qg-recommendation-box">
                  <strong>Recommendation:</strong> {issue.recommendation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QualityGateIssues;
