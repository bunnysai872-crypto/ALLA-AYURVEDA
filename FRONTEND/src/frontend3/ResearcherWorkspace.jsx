import React, { useState, useEffect, useCallback } from "react";
import "./ResearcherWorkspace.css";

import { getStoredToken, getStoredUser, clearStoredAuth, isResearcherUser } from "./utils/auth";
import { WORKSPACE_TABS } from "./utils/constants";
import researcherApi from "./services/researcherApi";

import AuthRequired from "./components/AuthRequired";
import ResearcherHeader from "./components/ResearcherHeader";
import ResearcherSidebar from "./components/ResearcherSidebar";

import ResearcherDashboard from "./pages/ResearcherDashboard";
import MyStudiesPage from "./pages/MyStudiesPage";
import CreateStudyPage from "./pages/CreateStudyPage";
import StudyDetailsPage from "./pages/StudyDetailsPage";
import EditStudyPage from "./pages/EditStudyPage";
import ProtocolBuilderPage from "./pages/ProtocolBuilderPage";
import DocumentationPage from "./pages/DocumentationPage";
import AIQualityGatePage from "./pages/AIQualityGatePage";
import ParticipantManagementPage from "./pages/ParticipantManagementPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";

/**
 * Initial auth evaluation helper
 */
function getInitialAuthState() {
  const initialToken = getStoredToken();
  const initialUser = getStoredUser();

  if (!initialToken) {
    return {
      token: null,
      user: null,
      errorMessage: "No active authentication token found. Please log in.",
    };
  }

  if (initialUser && !isResearcherUser(initialUser)) {
    return {
      token: null,
      user: null,
      errorMessage: `Your account role (${initialUser.role || "unknown"}) is not authorized for the Researcher Workspace. Expected role: researcher.`,
    };
  }

  return {
    token: initialToken,
    user: initialUser,
    errorMessage: "",
  };
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ResearcherWorkspace Component
 * 
 * Main entry point for Frontend 3.
 * Manages authentication verification, navigation state, responsive drawer,
 * active study context routing, and live backend connectivity check.
 */
export function ResearcherWorkspace() {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const [activeTab, setActiveTab] = useState(WORKSPACE_TABS.DASHBOARD);
  const [activeStudy, setActiveStudy] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking"); // "checking" | "online" | "offline"

  const { token, user, errorMessage } = authState;

  // Handle Tab Selection with optional study context
  const handleSelectTab = useCallback((tabId, studyContext = null) => {
    setActiveTab(tabId);
    if (studyContext) {
      setActiveStudy(studyContext);
    }
    // Scroll content to top on tab switch
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Perform live API health check when authenticated
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    async function checkBackendConnectivity() {
      try {
        setApiStatus("checking");
        await researcherApi.getMe();
        if (isMounted) {
          setApiStatus("online");
        }
      } catch (err) {
        console.warn("[ResearcherWorkspace] Backend connectivity check:", err.message);
        if (isMounted) {
          if (err.status === 401 || err.status === 403) {
            clearStoredAuth();
            setAuthState({
              token: null,
              user: null,
              errorMessage:
                err.message || "Your session has expired or is unauthorized. Please log in again.",
            });
          } else {
            setApiStatus("offline");
          }
        }
      }
    }

    checkBackendConnectivity();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Handle Logout
  const handleLogout = useCallback(() => {
    clearStoredAuth();
    setAuthState({
      token: null,
      user: null,
      errorMessage: "You have successfully signed out.",
    });
    window.location.href = "/login";
  }, []);

  // Handle Login Redirection
  const handleNavigateToLogin = useCallback(() => {
    window.location.href = "/user-login/researcher";
  }, []);

  // If not authenticated, render AuthRequired
  if (!token) {
    return (
      <div className="alla-f3-workspace">
        <AuthRequired
          message={errorMessage}
          onNavigateToLogin={handleNavigateToLogin}
        />
      </div>
    );
  }

  // Active study identifier
  const activeStudyId = activeStudy?.id ?? activeStudy?.study_id;

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case WORKSPACE_TABS.DASHBOARD:
        return (
          <ResearcherDashboard
            user={user}
            apiStatus={apiStatus}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.MY_STUDIES:
        return <MyStudiesPage onSelectTab={handleSelectTab} />;

      case WORKSPACE_TABS.CREATE_STUDY:
        return <CreateStudyPage onSelectTab={handleSelectTab} />;

      case WORKSPACE_TABS.STUDY_DETAILS:
        return (
          <StudyDetailsPage
            studyIdentifier={activeStudyId}
            initialStudy={activeStudy}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.EDIT_STUDY:
        return (
          <EditStudyPage
            studyIdentifier={activeStudyId}
            initialStudy={activeStudy}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.PROTOCOL_BUILDER:
        return (
          <ProtocolBuilderPage
            onSelectTab={handleSelectTab}
            activeStudy={activeStudy}
          />
        );

      case WORKSPACE_TABS.DOCUMENTS:
        return (
          <DocumentationPage
            activeStudy={activeStudy}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.AI_QUALITY_GATE:
        return (
          <AIQualityGatePage
            activeStudy={activeStudy}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.PARTICIPANTS:
        return (
          <ParticipantManagementPage
            activeStudy={activeStudy}
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.NOTIFICATIONS:
        return (
          <NotificationsPage
            onSelectTab={handleSelectTab}
          />
        );

      case WORKSPACE_TABS.PROFILE:
        return (
          <ProfilePage
            onSelectTab={handleSelectTab}
          />
        );

      default:
        return (
          <ResearcherDashboard
            user={user}
            apiStatus={apiStatus}
            onSelectTab={handleSelectTab}
          />
        );
    }
  };

  return (
    <div className="alla-f3-workspace">
      {/* Top Header */}
      <ResearcherHeader
        user={user}
        apiStatus={apiStatus}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Layout (Sidebar + Content) */}
      <div className="f3-layout-body">
        <ResearcherSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="f3-main-content">{renderTabContent()}</main>
      </div>
    </div>
  );
}

export default ResearcherWorkspace;
