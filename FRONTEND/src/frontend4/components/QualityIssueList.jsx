import React, { useState } from "react";
import { SEVERITY_META } from "../utils/qualityHelpers";

export default function QualityIssueList({
  completenessIssues = [],
  consistencyIssues = [],
  crossDocIssues = [],
  recommendations = [],
}) {
  const [activeTab, setActiveTab] = useState("all");

  const allIssues = [
    ...completenessIssues.map((i) => ({ ...i, category: "Completeness" })),
    ...consistencyIssues.map((i) => ({ ...i, category: "Internal Consistency" })),
    ...crossDocIssues.map((i) => ({ ...i, category: "Cross-Document" })),
  ];

  const filteredIssues =
    activeTab === "all"
      ? allIssues
      : activeTab === "completeness"
      ? completenessIssues.map((i) => ({ ...i, category: "Completeness" }))
      : activeTab === "consistency"
      ? consistencyIssues.map((i) => ({ ...i, category: "Internal Consistency" }))
      : activeTab === "cross_doc"
      ? crossDocIssues.map((i) => ({ ...i, category: "Cross-Document" }))
      : [];

  return (
    <div className="f4-quality-issues-container">
      {/* SECTION TABS */}
      <div className="f4-issues-tabs">
        <button
          type="button"
          className={`f4-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Findings ({allIssues.length})
        </button>
        <button
          type="button"
          className={`f4-tab-btn ${activeTab === "completeness" ? "active" : ""}`}
          onClick={() => setActiveTab("completeness")}
        >
          Completeness ({completenessIssues.length})
        </button>
        <button
          type="button"
          className={`f4-tab-btn ${activeTab === "consistency" ? "active" : ""}`}
          onClick={() => setActiveTab("consistency")}
        >
          Internal Consistency ({consistencyIssues.length})
        </button>
        <button
          type="button"
          className={`f4-tab-btn ${activeTab === "cross_doc" ? "active" : ""}`}
          onClick={() => setActiveTab("cross_doc")}
        >
          Cross-Document ({crossDocIssues.length})
        </button>
      </div>

      {/* ISSUES LIST */}
      <div className="f4-issues-list">
        {filteredIssues.length === 0 ? (
          <div className="f4-empty-issues">
            <span className="f4-empty-icon">✓</span>
            <p>No issues detected in this category. Quality requirements satisfied.</p>
          </div>
        ) : (
          filteredIssues.map((issue, idx) => {
            const meta = SEVERITY_META[issue.severity] || SEVERITY_META.INFO;
            return (
              <div key={issue.id || idx} className="f4-issue-card">
                <div className="f4-issue-top">
                  <span
                    className="f4-severity-tag"
                    style={{
                      backgroundColor: meta.bg,
                      color: meta.color,
                      border: `1px solid ${meta.border}`,
                    }}
                  >
                    {meta.label}
                  </span>
                  <span className="f4-issue-category">{issue.category}</span>
                  {issue.field && (
                    <span className="f4-issue-field">Field: <code>{issue.field}</code></span>
                  )}
                </div>

                <h4 className="f4-issue-message">{issue.message}</h4>

                {issue.recommendation && (
                  <div className="f4-issue-recommendation">
                    <strong>Action Required:</strong> {issue.recommendation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* RECOMMENDATIONS BOX */}
      {recommendations && recommendations.length > 0 && (
        <div className="f4-recommendations-box">
          <div className="f4-rec-header">
            <span>💡</span>
            <h4>Prioritized Researcher Recommendations</h4>
          </div>
          <ol className="f4-rec-list">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
