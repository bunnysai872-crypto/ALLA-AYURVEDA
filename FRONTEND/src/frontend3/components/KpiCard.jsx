import React from "react";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * KpiCard Component
 * 
 * Displays key research metrics on the Researcher Dashboard.
 */
export function KpiCard({ title, value, icon, subtitle, colorVariant = "default", loading = false }) {
  return (
    <div className={`f3-kpi-card f3-kpi-${colorVariant}`}>
      <div className="f3-kpi-header">
        <div className="f3-kpi-icon-wrap">{icon}</div>
        <span className="f3-kpi-title">{title}</span>
      </div>

      <div className="f3-kpi-body">
        {loading ? (
          <div className="f3-kpi-skeleton"></div>
        ) : (
          <span className="f3-kpi-value">{value}</span>
        )}
      </div>

      {subtitle && <div className="f3-kpi-footer">{subtitle}</div>}
    </div>
  );
}

export default KpiCard;

