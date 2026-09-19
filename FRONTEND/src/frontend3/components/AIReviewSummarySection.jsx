import React, { useState } from "react";

export function AIReviewSummarySection({
  title,
  icon,
  badge = null,
  children,
  defaultExpanded = true,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="ai-summary-section-card">
      <div
        className="ai-summary-section-header"
        onClick={() => setIsExpanded((prev) => !prev)}
        style={{ cursor: "pointer", userSelect: "none" }}
      >
        <h3 className="ai-summary-section-title">
          <span>{icon}</span> {title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {badge}
          <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
            {isExpanded ? "▲ Hide" : "▼ Show"}
          </span>
        </div>
      </div>

      {isExpanded && <div>{children}</div>}
    </div>
  );
}

export default AIReviewSummarySection;
