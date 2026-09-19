import React from "react";

export function IECKpiCard({ label, value, subtext, icon, highlight = false }) {
  return (
    <div className={`iec-kpi-card ${highlight ? "highlight" : ""}`}>
      <div className="iec-kpi-card-header">
        <span className="iec-kpi-label">{label}</span>
        <span className="iec-kpi-icon">{icon}</span>
      </div>
      <div className="iec-kpi-value">{value ?? 0}</div>
      {subtext && <div className="iec-kpi-subtext">{subtext}</div>}
    </div>
  );
}

export default IECKpiCard;
