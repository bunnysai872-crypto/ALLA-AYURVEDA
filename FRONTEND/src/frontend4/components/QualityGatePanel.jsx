import React from "react";
import QualityScoreCard from "./QualityScoreCard";
import QualityIssueList from "./QualityIssueList";
import RiskFlag from "./RiskFlag";

export default function QualityGatePanel({
  qualityCheck,
  onRunCheck,
  isLoading,
  error,
}) {
  const riskFlags = qualityCheck?.risk_flags || [];
  const completeness = qualityCheck?.completeness?.issues || [];
  const consistency = qualityCheck?.consistency?.issues || [];
  const crossDoc = qualityCheck?.cross_document?.issues || [];
  const recommendations = qualityCheck?.recommendations || [];

  return (
    <div className="f4-quality-gate-panel">
      {error && (
        <div className="f4-alert f4-alert-error">
          <span>⚠</span>
          <div>
            <strong>Quality Gate Error:</strong> {error}
          </div>
        </div>
      )}

      {/* SCORE CARD */}
      <QualityScoreCard
        qualityCheck={qualityCheck}
        onRunCheck={onRunCheck}
        isLoading={isLoading}
      />

      {/* RISK FLAGS */}
      {riskFlags.length > 0 && (
        <div className="f4-risk-flags-section">
          <div className="f4-section-subhead">
            <span>🚩</span>
            <h4>Critical & High Risk Flags ({riskFlags.length})</h4>
          </div>
          <div className="f4-risk-flags-grid">
            {riskFlags.map((flag, idx) => (
              <RiskFlag key={flag.code || idx} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* ISSUES AND RECOMMENDATIONS */}
      <div className="f4-findings-section">
        <div className="f4-section-subhead">
          <span>📋</span>
          <h4>Detailed Quality Findings & Audit Trail</h4>
        </div>
        <QualityIssueList
          completenessIssues={completeness}
          consistencyIssues={consistency}
          crossDocIssues={crossDoc}
          recommendations={recommendations}
        />
      </div>
    </div>
  );
}
