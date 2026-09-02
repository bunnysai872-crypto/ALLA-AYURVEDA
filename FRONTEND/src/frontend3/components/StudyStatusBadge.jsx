import React from "react";
import { getStatusInfo } from "../utils/formatters";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * StudyStatusBadge Component
 * 
 * Standardized status badge for Ayurveda clinical studies.
 */
export function StudyStatusBadge({ status }) {
  const { label, variant, icon } = getStatusInfo(status);

  return (
    <span className={`f3-status-badge ${variant}`}>
      <span className="f3-status-badge-icon">{icon}</span>
      <span className="f3-status-badge-label">{label}</span>
    </span>
  );
}

export default StudyStatusBadge;

