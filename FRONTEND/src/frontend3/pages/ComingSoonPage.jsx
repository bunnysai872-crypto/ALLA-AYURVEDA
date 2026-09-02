import React from "react";
import { NAVIGATION_ITEMS } from "../utils/constants";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ComingSoonPage Component
 * 
 * Displays "Coming soon" state for future modules (Documents, AI Quality Gate, Notifications, Profile)
 */
export function ComingSoonPage({ tabId, onNavigateToDashboard }) {
  const item = NAVIGATION_ITEMS.find((n) => n.id === tabId) || {
    label: "Feature",
    description: "This module will be available in the upcoming phase.",
  };

  return (
    <div className="f3-page-container">
      <div className="f3-coming-soon-card">
        {/* Visual Badge */}
        <div className="f3-coming-soon-badge">
          <span className="f3-coming-soon-icon">⏳</span>
          <span className="f3-coming-soon-tag">FUTURE PHASE MODULE</span>
        </div>

        {/* Feature Info */}
        <h1 className="f3-coming-soon-title">{item.label}</h1>
        <p className="f3-coming-soon-description">{item.description}</p>

        {/* Requirement highlight */}
        <div className="f3-coming-soon-status-box">
          <div className="f3-coming-soon-status-badge">Coming soon</div>
          <p>
            The <strong>{item.label}</strong> module is currently scheduled for subsequent
            development phases of the ALLA Ayurveda clinical research workspace.
          </p>
        </div>

        {/* Action */}
        <div className="f3-coming-soon-actions">
          {onNavigateToDashboard && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={onNavigateToDashboard}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComingSoonPage;

