import React from "react";
import { SEVERITY_META } from "../utils/qualityHelpers";

export default function RiskFlag({ flag }) {
  const meta = SEVERITY_META[flag.severity] || SEVERITY_META.WARNING;

  return (
    <div
      className="f4-risk-flag-card"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
      }}
    >
      <div className="f4-risk-flag-header">
        <span
          className="f4-severity-badge"
          style={{
            backgroundColor: meta.color,
            color: "#ffffff",
          }}
        >
          {meta.label}
        </span>
        <span className="f4-risk-flag-code">{flag.code || "RISK_FLAG"}</span>
      </div>
      <h4 className="f4-risk-flag-title">{flag.title}</h4>
      <p className="f4-risk-flag-desc">{flag.description}</p>
    </div>
  );
}
