import React from "react";
import { QUALITY_STATUS_META, getScoreColor } from "../utils/qualityHelpers";

export default function QualityScoreCard({ qualityCheck, onRunCheck, isLoading }) {
  const statusKey = qualityCheck?.status || "not_checked";
  const meta = QUALITY_STATUS_META[statusKey] || QUALITY_STATUS_META.not_checked;
  const score = qualityCheck?.score;
  const scoreColor = getScoreColor(score);

  return (
    <div className="f4-quality-score-card">
      <div className="f4-score-header">
        <div className="f4-score-header-left">
          <span className="f4-eyebrow">AI QUALITY GATE</span>
          <h3>Clinical Readiness Assessment</h3>
        </div>
        <button
          type="button"
          className="f4-btn f4-btn-primary f4-run-check-btn"
          onClick={onRunCheck}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="f4-spinner-inline" />
              <span>Analyzing Documents...</span>
            </>
          ) : (
            <>
              <span>✦</span>
              <span>Run Quality Check</span>
            </>
          )}
        </button>
      </div>

      <div className="f4-score-main">
        <div className="f4-score-gauge-box">
          <div
            className="f4-score-circle"
            style={{
              borderColor: score !== null && score !== undefined ? scoreColor : "#e2e8f0",
            }}
          >
            {score !== null && score !== undefined ? (
              <div className="f4-score-number" style={{ color: scoreColor }}>
                {score}
                <small>/100</small>
              </div>
            ) : (
              <div className="f4-score-unavailable">
                <span>—</span>
                <small>Not Tested</small>
              </div>
            )}
          </div>
          <span className="f4-score-caption">Overall Quality Score</span>
        </div>

        <div className="f4-score-status-box">
          <div
            className="f4-status-banner"
            style={{
              backgroundColor: meta.bg,
              borderColor: meta.border,
              color: meta.color,
            }}
          >
            <span className="f4-status-banner-icon">{meta.icon}</span>
            <div>
              <strong>{meta.label}</strong>
              <p>{qualityCheck?.summary || "No automated review run yet. Run the Quality Gate to verify study completeness and consistency."}</p>
            </div>
          </div>

          <div className="f4-category-pills">
            <div className="f4-pill">
              <span className="f4-pill-label">Completeness:</span>
              <strong className={`f4-pill-val f4-val-${qualityCheck?.completeness?.status || "pending"}`}>
                {qualityCheck?.completeness?.status ? qualityCheck.completeness.status.replace("_", " ") : "Pending"}
              </strong>
            </div>
            <div className="f4-pill">
              <span className="f4-pill-label">Consistency:</span>
              <strong className={`f4-pill-val f4-val-${qualityCheck?.consistency?.status || "pending"}`}>
                {qualityCheck?.consistency?.status ? qualityCheck.consistency.status.replace("_", " ") : "Pending"}
              </strong>
            </div>
            <div className="f4-pill">
              <span className="f4-pill-label">Cross-Document:</span>
              <strong className={`f4-pill-val f4-val-${qualityCheck?.cross_document?.status || "pending"}`}>
                {qualityCheck?.cross_document?.status ? qualityCheck.cross_document.status.replace("_", " ") : "Pending"}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
