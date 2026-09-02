import React from "react";
import { NAVIGATION_ITEMS } from "../utils/constants";

/**
 * Icons lookup using clean SVG/Unicode icons so no external icon package mismatch occurs.
 */
function NavIcon({ name }) {
  switch (name) {
    case "LayoutDashboard":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case "BookOpen":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case "FolderPlus":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 10v6" />
          <path d="M9 13h6" />
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
      );
    case "FileCode2":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m3 15 2-2-2-2" />
          <path d="m7 11 2 2-2 2" />
        </svg>
      );
    case "Files":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
          <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />
          <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h11" />
        </svg>
      );
    case "Sparkles":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
      );
    case "Bell":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "UserCheck":
      return (
        <svg className="f3-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    default:
      return <span className="f3-nav-icon-bullet">◈</span>;
  }
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ResearcherSidebar Component
 * 
 * Provides navigation across all Phase 1 and future Phase sections.
 */
export function ResearcherSidebar({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="f3-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`f3-sidebar ${isOpen ? "f3-sidebar-open" : ""}`}>
        {/* Navigation Category / Section */}
        <div className="f3-sidebar-section">
          <span className="f3-sidebar-section-title">RESEARCH WORKFLOW</span>

          <nav className="f3-sidebar-nav">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`f3-nav-item ${isActive ? "f3-nav-item-active" : ""}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onClose) onClose();
                  }}
                  title={item.description}
                >
                  <span className="f3-nav-icon">
                    <NavIcon name={item.icon} />
                  </span>

                  <span className="f3-nav-label">{item.label}</span>

                  {item.isComingSoon && (
                    <span className="f3-nav-badge-soon">Coming soon</span>
                  )}

                  {isActive && <span className="f3-nav-active-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Card */}
        <div className="f3-sidebar-footer-card">
          <div className="f3-sidebar-footer-icon">🌿</div>
          <div className="f3-sidebar-footer-text">
            <strong>Ayurveda Research</strong>
            <p>Phase 1 Foundation Active</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default ResearcherSidebar;

