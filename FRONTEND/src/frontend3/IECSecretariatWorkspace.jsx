import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { getStoredToken, getStoredUser, clearStoredAuth } from "./utils/auth";
import AuthRequired from "./components/AuthRequired";
import IECSecretariatDashboardPage from "./pages/IECSecretariatDashboardPage";
import IECSubmissionQueuePage from "./pages/IECSubmissionQueuePage";
import IECStudyReviewPage from "./pages/IECStudyReviewPage";
import IECDocumentVerificationPage from "./pages/IECDocumentVerificationPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import "./ResearcherWorkspace.css"; // Reuse general workspace layout grid & typography
import "./styles/IECSecretariatModule.css";

const IEC_TABS = {
  DASHBOARD: "dashboard",
  SUBMISSIONS: "submissions",
  DOCUMENT_VERIFICATION: "document-verification",
  STUDY_REVIEW: "study-review",
  IEC_REVIEW: "iec-review",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
};

export function IECSecretariatWorkspace({ initialTab }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (location.pathname.includes("/documents")) return IEC_TABS.DOCUMENT_VERIFICATION;
    if (location.pathname.includes("/studies/") && params.studyId) return IEC_TABS.STUDY_REVIEW;
    if (location.pathname.includes("/studies")) return IEC_TABS.SUBMISSIONS;
    return IEC_TABS.DASHBOARD;
  });
  const [selectedStudyId, setSelectedStudyId] = useState(params.studyId || null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync params if URL changes
  useEffect(() => {
    if (params.studyId) {
      setSelectedStudyId(params.studyId);
    }
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [params.studyId, initialTab]);

  // Assert IEC Secretariat authorization
  const isSecretariat = user && (user.role || "").toLowerCase().trim() === "iec_secretariat";

  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const handleNavigateToLogin = useCallback(() => {
    window.location.href = "/user-login/iec-secretariat";
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

  if (!token || !isSecretariat) {
    return (
      <div className="alla-f3-workspace">
        <AuthRequired
          message={
            !token
              ? "No active session found. Please sign in as IEC Secretariat."
              : `Your account role (${user?.role || "unknown"}) is not authorized for the IEC Secretariat Workspace.`
          }
          onNavigateToLogin={handleNavigateToLogin}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case IEC_TABS.DASHBOARD:
        return (
          <IECSecretariatDashboardPage
            onSelectTab={handleSelectTab}
            onSelectStudy={handleSelectStudy}
          />
        );

      case IEC_TABS.SUBMISSIONS:
        return (
          <IECSubmissionQueuePage
            onSelectTab={handleSelectTab}
            onSelectStudy={handleSelectStudy}
          />
        );

      case IEC_TABS.DOCUMENT_VERIFICATION:
        return (
          <IECDocumentVerificationPage
            selectedStudyIdentifier={selectedStudyId}
            onSelectTab={handleSelectTab}
          />
        );

      case IEC_TABS.STUDY_REVIEW:
      case IEC_TABS.IEC_REVIEW:
        return (
          <IECStudyReviewPage
            selectedStudyIdentifier={selectedStudyId}
            onSelectTab={handleSelectTab}
            onOpenVerification={(id) => handleSelectTab(IEC_TABS.DOCUMENT_VERIFICATION, id)}
          />
        );

      case IEC_TABS.NOTIFICATIONS:
        return (
          <NotificationsPage
            onSelectTab={handleSelectTab}
          />
        );

      case IEC_TABS.PROFILE:
        return (
          <ProfilePage
            onSelectTab={handleSelectTab}
          />
        );

      default:
        return (
          <IECSecretariatDashboardPage
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
              <span>IEC Secretariat</span>
            </div>
          </div>
        </div>

        <div className="f3-header-right">
          <div className="f3-user-badge">
            <div className="f3-avatar" style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
              🏛
            </div>
            <div className="f3-user-info">
              <span className="f3-user-name">{user?.full_name || "Secretariat Auditor"}</span>
              <span className="f3-user-role" style={{ color: "#d4af37" }}>
                IEC Secretariat ({user?.email})
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

      {/* Main Layout (Sidebar + Content) */}
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
            <span className="f3-sidebar-section-title">ETHICS SCRUTINY</span>
            <nav className="f3-sidebar-nav">
              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.DASHBOARD ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.DASHBOARD);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📊</span>
                <span className="f3-nav-label">Dashboard</span>
                {activeTab === IEC_TABS.DASHBOARD && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.SUBMISSIONS ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.SUBMISSIONS);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📋</span>
                <span className="f3-nav-label">Submitted Studies</span>
                {activeTab === IEC_TABS.SUBMISSIONS && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.DOCUMENT_VERIFICATION ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.DOCUMENT_VERIFICATION);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">🛡</span>
                <span className="f3-nav-label">Document Verification</span>
                {activeTab === IEC_TABS.DOCUMENT_VERIFICATION && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.STUDY_REVIEW || activeTab === IEC_TABS.IEC_REVIEW ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.STUDY_REVIEW);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">⚖</span>
                <span className="f3-nav-label">IEC Review</span>
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
                {(activeTab === IEC_TABS.STUDY_REVIEW || activeTab === IEC_TABS.IEC_REVIEW) && (
                  <span className="f3-nav-active-indicator" />
                )}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.NOTIFICATIONS ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.NOTIFICATIONS);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">🔔</span>
                <span className="f3-nav-label">Notifications</span>
                {activeTab === IEC_TABS.NOTIFICATIONS && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === IEC_TABS.PROFILE ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  handleSelectTab(IEC_TABS.PROFILE);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">👤</span>
                <span className="f3-nav-label">Profile</span>
                {activeTab === IEC_TABS.PROFILE && <span className="f3-nav-active-indicator" />}
              </button>
            </nav>
          </div>

          <div className="f3-sidebar-footer-card">
            <div className="f3-sidebar-footer-icon">⚖</div>
            <div className="f3-sidebar-footer-text">
              <strong>Ethics Committee</strong>
              <p>IEC Secretariat Unit Active</p>
            </div>
          </div>
        </aside>

        {/* Content Body */}
        <main className="f3-main-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default IECSecretariatWorkspace;
