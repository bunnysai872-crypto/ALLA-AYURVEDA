import React, { useState, useCallback } from "react";
import { getStoredToken, getStoredUser, clearStoredAuth } from "./utils/auth";
import AuthRequired from "./components/AuthRequired";
import IECMemberDashboardPage from "./pages/IECMemberDashboardPage";
import IECMemberReviewQueuePage from "./pages/IECMemberReviewQueuePage";
import IECMemberStudyReviewPage from "./pages/IECMemberStudyReviewPage";
import "./ResearcherWorkspace.css";
import "./styles/IECMemberModule.css";

const IEC_MEMBER_TABS = {
  DASHBOARD: "dashboard",
  REVIEWS: "reviews",
  STUDY_REVIEW: "study-review",
};

export function IECMemberWorkspace() {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState(IEC_MEMBER_TABS.DASHBOARD);
  const [selectedStudyId, setSelectedStudyId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Assert IEC Member authorization
  const isMember = user && (user.role || "").toLowerCase().trim() === "iec_member";

  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    window.location.href = "/user-login/iec-member";
  }, []);

  const handleSelectTab = useCallback((tab, studyId = null) => {
    setActiveTab(tab);
    if (studyId) {
      setSelectedStudyId(studyId);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectStudy = useCallback((studyId) => {
    setSelectedStudyId(studyId);
  }, []);

  if (!token || !isMember) {
    return (
      <div className="alla-f3-workspace">
        <AuthRequired
          message={
            !token
              ? "No active session found. Please sign in as an IEC Member."
              : `Your account role (${user?.role || "unknown"}) is not authorized for the IEC Member Workspace.`
          }
          onNavigateToLogin={handleNavigateToLogin}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case IEC_MEMBER_TABS.DASHBOARD:
        return (
          <IECMemberDashboardPage
            onSelectTab={handleSelectTab}
            onSelectStudy={handleSelectStudy}
          />
        );

      case IEC_MEMBER_TABS.REVIEWS:
        return (
          <IECMemberReviewQueuePage
            onSelectTab={handleSelectTab}
            onSelectStudy={handleSelectStudy}
          />
        );

      case IEC_MEMBER_TABS.STUDY_REVIEW:
        return (
          <IECMemberStudyReviewPage
            selectedStudyIdentifier={selectedStudyId}
            onSelectTab={handleSelectTab}
          />
        );

      default:
        return (
          <IECMemberDashboardPage
            onSelectTab={handleSelectTab}
            onSelectStudy={handleSelectStudy}
          />
        );
    }
  };

  return (
    <div className="alla-f3-workspace">
      {/* Top Header */}
      <header className="f3-header" style={{ borderBottom: "1px solid rgba(212, 175, 55, 0.3)" }}>
        <div className="f3-header-left">
          <button
            type="button"
            className="f3-menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <div className="f3-brand">
            <span className="f3-brand-logo">A</span>
            <div className="f3-brand-text">
              <strong>ALLA Ayurveda</strong>
              <span>IEC Member Review Workspace</span>
            </div>
          </div>
        </div>

        <div className="f3-header-right">
          <div className="f3-user-badge">
            <div className="f3-avatar" style={{ background: "linear-gradient(135deg, #10b981, #d4af37)" }}>
              ✓
            </div>
            <div className="f3-user-info">
              <span className="f3-user-name">{user?.full_name || "IEC Reviewer"}</span>
              <span className="f3-user-role" style={{ color: "#d4af37" }}>
                Ethics Committee Member
              </span>
            </div>
          </div>

          <button
            type="button"
            className="f3-btn-logout"
            onClick={handleLogout}
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="f3-layout-body">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="f3-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`f3-sidebar ${sidebarOpen ? "f3-sidebar-open" : ""}`}>
          <div className="f3-sidebar-section">
            <span className="f3-sidebar-section-title">ETHICS COMMITTEE</span>
            <nav className="f3-sidebar-nav">
              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_MEMBER_TABS.DASHBOARD ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_MEMBER_TABS.DASHBOARD);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📊</span>
                <span className="f3-nav-label">Dashboard</span>
                {activeTab === IEC_MEMBER_TABS.DASHBOARD && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_MEMBER_TABS.REVIEWS ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_MEMBER_TABS.REVIEWS);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📋</span>
                <span className="f3-nav-label">Review Queue</span>
                {activeTab === IEC_MEMBER_TABS.REVIEWS && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_MEMBER_TABS.STUDY_REVIEW ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_MEMBER_TABS.STUDY_REVIEW);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📖</span>
                <span className="f3-nav-label">Study Review</span>
                {selectedStudyId && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(212, 175, 55, 0.2)",
                      color: "#d4af37",
                      padding: "2px 5px",
                      borderRadius: "4px",
                    }}
                  >
                    Active
                  </span>
                )}
                {activeTab === IEC_MEMBER_TABS.STUDY_REVIEW && <span className="f3-nav-active-indicator" />}
              </button>
            </nav>
          </div>

          <div className="f3-sidebar-footer-card">
            <div className="f3-sidebar-footer-icon">⚖</div>
            <div className="f3-sidebar-footer-text">
              <strong>Ethics Review Board</strong>
              <p>Ayurveda Clinical Scrutiny</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="f3-main-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default IECMemberWorkspace;
