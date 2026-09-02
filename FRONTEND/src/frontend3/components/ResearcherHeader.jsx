import React from "react";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ResearcherHeader Component
 * 
 * Top bar displaying brand identity, researcher user info,
 * system status indicator, mobile drawer trigger, and sign out.
 */
export function ResearcherHeader({
  user,
  apiStatus,
  onLogout,
  onToggleSidebar,
  sidebarOpen,
}) {
  const researcherName = user?.full_name || user?.email?.split("@")[0] || "Researcher";
  const researcherEmail = user?.email || "researcher@alla.ayurveda";

  return (
    <header className="f3-header">
      {/* Left brand area */}
      <div className="f3-header-left">
        {/* Mobile toggle button */}
        <button
          type="button"
          className="f3-header-mobile-toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        >
          <span className="f3-toggle-bar"></span>
          <span className="f3-toggle-bar"></span>
          <span className="f3-toggle-bar"></span>
        </button>

        {/* Brand */}
        <div className="f3-header-brand">
          <div className="f3-brand-logo">A</div>
          <div className="f3-brand-text">
            <h2>ALLA Ayurveda</h2>
            <span className="f3-brand-sub">Researcher Workspace</span>
          </div>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="f3-header-center">
        <div className={`f3-status-pill f3-status-${apiStatus || "online"}`}>
          <span className="f3-status-dot"></span>
          <span className="f3-status-text">
            {apiStatus === "checking" && "Connecting..."}
            {apiStatus === "online" && "Backend Connected"}
            {apiStatus === "offline" && "Backend Offline"}
          </span>
        </div>
      </div>

      {/* Right user & action area */}
      <div className="f3-header-right">
        {/* User Card */}
        <div className="f3-user-pill" title={researcherEmail}>
          <div className="f3-user-avatar">
            {researcherName.charAt(0).toUpperCase()}
          </div>
          <div className="f3-user-details">
            <span className="f3-user-name">{researcherName}</span>
            <span className="f3-user-role-badge">Researcher</span>
          </div>
        </div>

        {/* Logout action */}
        <button
          type="button"
          className="f3-header-logout-btn"
          onClick={onLogout}
          title="Sign out of Researcher Workspace"
        >
          <span className="f3-logout-icon">⎋</span>
          <span className="f3-logout-text">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default ResearcherHeader;

