import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredToken, getStoredUser, clearStoredAuth } from "../frontend3/utils/auth";
import AuthRequired from "../frontend3/components/AuthRequired";
import regulatoryApi from "../frontend3/services/regulatoryApi";
import NotificationsPage from "../frontend3/pages/NotificationsPage";
import ProfilePage from "../frontend3/pages/ProfilePage";
import "../frontend3/ResearcherWorkspace.css";
import "../frontend3/styles/RegulatoryModule.css";

const REG_TABS = {
  DASHBOARD: "dashboard",
  TRACKING: "tracking",
  ACTIVATION: "activation",
  NOTIFICATIONS: "notifications",
  PROFILE: "profile",
};

export function RegulatoryAdminWorkspace() {
  const navigate = useNavigate();
  const token = getStoredToken();
  const user = getStoredUser();

  const [activeTab, setActiveTab] = useState(REG_TABS.DASHBOARD);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Edit Modal State
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [editFormData, setEditFormData] = useState({
    regulatory_status: "In Progress",
    regulatory_submission_date: "",
    regulatory_reference_number: "",
    regulatory_approval_date: "",
    regulatory_remarks: "",
    ctri_status: "In Progress",
    ctri_submission_date: "",
    ctri_reg_number: "",
    ctri_registration_date: "",
    ctri_remarks: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Activation Board State
  const [activationStudyId, setActivationStudyId] = useState(null);
  const [readinessData, setReadinessData] = useState(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(null);

  // Check authorization
  const isAuthorized = user && (user.role || "").toLowerCase().trim() === "regulatory_admin";

  const handleLogout = useCallback(() => {
    clearStoredAuth();
    window.location.href = "/login";
  }, []);

  const loadStudies = useCallback(async () => {
    if (!token || !isAuthorized) return;
    try {
      setLoading(true);
      setError(null);
      const res = await regulatoryApi.getRegulatoryStudies({
        search,
        status: statusFilter,
      });
      if (res.success) {
        setStudies(res.data || []);
      } else {
        setError(res.message || "Failed to load regulatory studies pipeline.");
      }
    } catch (err) {
      console.error("Error loading regulatory studies:", err);
      setError(err.message || "Unable to connect to regulatory API.");
    } finally {
      setLoading(false);
    }
  }, [token, isAuthorized, search, statusFilter]);

  useEffect(() => {
    loadStudies();
  }, [loadStudies]);

  // Load readiness when selecting study in Activation tab
  const handleSelectActivationStudy = async (sId) => {
    setActivationStudyId(sId);
    setActivationSuccess(null);
    setLoadingReadiness(true);
    try {
      const res = await regulatoryApi.getActivationReadiness(sId);
      if (res.success) {
        setReadinessData(res.data);
      } else {
        alert(res.message || "Failed to evaluate readiness.");
      }
    } catch (err) {
      console.error("Readiness evaluation error:", err);
      alert(err.message || "Error evaluating activation prerequisites.");
    } finally {
      setLoadingReadiness(false);
    }
  };

  const handleOpenEdit = (study) => {
    setSelectedStudy(study);
    setSaveError(null);
    setEditFormData({
      regulatory_status: study.regulatory?.status || "In Progress",
      regulatory_submission_date: study.regulatory?.submission_date || "",
      regulatory_reference_number: study.regulatory?.reference_number || "",
      regulatory_approval_date: study.regulatory?.approval_date || "",
      regulatory_remarks: study.regulatory?.remarks || "",
      ctri_status: study.ctri?.status || "In Progress",
      ctri_submission_date: study.ctri?.submission_date || "",
      ctri_reg_number: study.ctri?.reg_number || "",
      ctri_registration_date: study.ctri?.registration_date || "",
      ctri_remarks: study.ctri?.remarks || "",
    });
  };

  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!selectedStudy) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await regulatoryApi.updateRegulatoryTracking(
        selectedStudy.study_id || selectedStudy.id,
        editFormData
      );
      if (res.success) {
        setSelectedStudy(null);
        await loadStudies();
      } else {
        setSaveError(res.message || "Failed to update tracking.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err.message || "Failed to update regulatory details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteActivation = async () => {
    if (!activationStudyId || !readinessData?.is_ready) return;
    setActivating(true);
    try {
      const res = await regulatoryApi.activateStudy(activationStudyId, {
        remarks: "All 9 institutional, regulatory, and CTRI prerequisites verified by Regulatory Admin.",
      });
      if (res.success) {
        setActivationSuccess(res.message || "Study activated successfully!");
        await handleSelectActivationStudy(activationStudyId);
        await loadStudies();
      } else {
        alert(res.message || "Failed to activate study.");
      }
    } catch (err) {
      console.error("Activation execution error:", err);
      alert(err.message || "Error during study activation.");
    } finally {
      setActivating(false);
    }
  };

  if (!token || !isAuthorized) {
    return (
      <div className="alla-f3-workspace">
        <AuthRequired
          message={
            !token
              ? "No active session found. Please log in as a Regulatory Admin."
              : `Your account role (${user?.role || "unknown"}) is not authorized for Regulatory & CTRI administration.`
          }
          onNavigateToLogin={() => (window.location.href = "/user-login/regulatory-admin")}
        />
      </div>
    );
  }

  // Calculate high level metrics
  const totalApproved = studies.length;
  const inRegulatoryReview = studies.filter(
    (s) => s.regulatory?.status === "Under Review" || s.regulatory?.status === "Submitted"
  ).length;
  const ctriRegistered = studies.filter(
    (s) => s.ctri?.status === "Approved/Registered" || s.ctri?.reg_number
  ).length;
  const activatedCount = studies.filter((s) => s.is_activated || s.workflow_status === "activated").length;

  return (
    <div className="alla-f3-workspace">
      {/* Header */}
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
              <span>Regulatory & CTRI Workspace</span>
            </div>
          </div>
        </div>

        <div className="f3-header-right">
          <div className="f3-user-badge">
            <div className="f3-avatar" style={{ background: "linear-gradient(135deg, #d4af37, #b8860b)" }}>
              ⚙
            </div>
            <div className="f3-user-info">
              <span className="f3-user-name">{user?.full_name || "Regulatory Admin"}</span>
              <span className="f3-user-role" style={{ color: "#d4af37" }}>
                Regulatory Oversight Unit ({user?.email})
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

      {/* Main Layout */}
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
            <span className="f3-sidebar-section-title">REGULATORY CLEARANCE</span>
            <nav className="f3-sidebar-nav">
              <button
                type="button"
                className={`f3-nav-item ${activeTab === REG_TABS.DASHBOARD ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(REG_TABS.DASHBOARD);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">📊</span>
                <span className="f3-nav-label">Overview</span>
                {activeTab === REG_TABS.DASHBOARD && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === REG_TABS.TRACKING ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(REG_TABS.TRACKING);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">🛡</span>
                <span className="f3-nav-label">Regulatory & CTRI</span>
                {activeTab === REG_TABS.TRACKING && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === REG_TABS.ACTIVATION ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(REG_TABS.ACTIVATION);
                  setSidebarOpen(false);
                  if (studies.length > 0 && !activationStudyId) {
                    handleSelectActivationStudy(studies[0].study_id || studies[0].id);
                  }
                }}
              >
                <span className="f3-nav-icon">⚡</span>
                <span className="f3-nav-label">Study Activation</span>
                {activeTab === REG_TABS.ACTIVATION && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === REG_TABS.NOTIFICATIONS ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(REG_TABS.NOTIFICATIONS);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">🔔</span>
                <span className="f3-nav-label">Notifications</span>
                {activeTab === REG_TABS.NOTIFICATIONS && <span className="f3-nav-active-indicator" />}
              </button>

              <button
                type="button"
                className={`f3-nav-item ${activeTab === REG_TABS.PROFILE ? "f3-nav-item-active" : ""}`}
                onClick={() => {
                  setActiveTab(REG_TABS.PROFILE);
                  setSidebarOpen(false);
                }}
              >
                <span className="f3-nav-icon">👤</span>
                <span className="f3-nav-label">Profile</span>
                {activeTab === REG_TABS.PROFILE && <span className="f3-nav-active-indicator" />}
              </button>
            </nav>
          </div>

          <div className="f3-sidebar-footer-card">
            <div className="f3-sidebar-footer-icon">⚖</div>
            <div className="f3-sidebar-footer-text">
              <strong>Statutory Compliance</strong>
              <p>Ayush / CTRI Mandate</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="f3-main-content">
          {/* TAB 1: DASHBOARD */}
          {activeTab === REG_TABS.DASHBOARD && (
            <div className="reg-module-container">
              <div className="reg-page-header">
                <div>
                  <span className="reg-header-tag">PLATFORM STATUS</span>
                  <h1 className="reg-header-title">Regulatory Oversight Dashboard</h1>
                  <p className="reg-header-subtitle">
                    Monitoring institutional trial compliance, CTRI registration credentials, and activation clearance.
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="reg-metrics-grid">
                <div className="reg-metric-card">
                  <div className="reg-metric-header">
                    <span className="reg-metric-title">IEC Approved Studies</span>
                    <span className="reg-metric-icon">✓</span>
                  </div>
                  <span className="reg-metric-value">{totalApproved}</span>
                  <span className="reg-metric-subtext">Passed Institutional Ethics Scrutiny</span>
                </div>

                <div className="reg-metric-card">
                  <div className="reg-metric-header">
                    <span className="reg-metric-title">In Regulatory Tracking</span>
                    <span className="reg-metric-icon">🏛</span>
                  </div>
                  <span className="reg-metric-value" style={{ color: "#60a5fa" }}>
                    {inRegulatoryReview}
                  </span>
                  <span className="reg-metric-subtext">Submitted or under authority review</span>
                </div>

                <div className="reg-metric-card">
                  <div className="reg-metric-header">
                    <span className="reg-metric-title">CTRI Registered</span>
                    <span className="reg-metric-icon">📜</span>
                  </div>
                  <span className="reg-metric-value" style={{ color: "#34d399" }}>
                    {ctriRegistered}
                  </span>
                  <span className="reg-metric-subtext">Assigned official CTRI reference</span>
                </div>

                <div className="reg-metric-card">
                  <div className="reg-metric-header">
                    <span className="reg-metric-title">Activated Clinical Trials</span>
                    <span className="reg-metric-icon">⚡</span>
                  </div>
                  <span className="reg-metric-value" style={{ color: "#facc15" }}>
                    {activatedCount}
                  </span>
                  <span className="reg-metric-subtext">Actively recruiting & managing subjects</span>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div style={{ background: "rgba(18, 30, 26, 0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px" }}>
                <h3 style={{ margin: "0 0 8px 0", color: "#ffffff" }}>Quick Workflow Access</h3>
                <p style={{ margin: "0 0 16px 0", color: "#94a3b8", fontSize: "0.88rem" }}>
                  Select a workflow action to review regulatory submissions or activate verified clinical trials.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="reg-btn reg-btn-gold"
                    onClick={() => setActiveTab(REG_TABS.TRACKING)}
                  >
                    🛡 Open Regulatory & CTRI Pipeline →
                  </button>
                  <button
                    type="button"
                    className="reg-btn reg-btn-primary"
                    onClick={() => {
                      setActiveTab(REG_TABS.ACTIVATION);
                      if (studies.length > 0) {
                        handleSelectActivationStudy(studies[0].study_id || studies[0].id);
                      }
                    }}
                  >
                    ⚡ Review Study Activation Readiness →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGULATORY & CTRI TRACKING */}
          {activeTab === REG_TABS.TRACKING && (
            <div className="reg-module-container">
              <div className="reg-page-header">
                <div>
                  <span className="reg-header-tag">COMPLIANCE PIPELINE</span>
                  <h1 className="reg-header-title">Regulatory & CTRI Tracking</h1>
                  <p className="reg-header-subtitle">
                    Manage National Ayush regulatory clearance details and Clinical Trial Registry - India (CTRI) registration records.
                  </p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="reg-controls-bar">
                <input
                  type="text"
                  className="reg-search-input"
                  placeholder="Search by study title, protocol number, PI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="reg-filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Pipeline Stages</option>
                  <option value="approved">IEC Approved</option>
                  <option value="activated">Activated</option>
                  <option value="Approved/Registered">Regulatory/CTRI Approved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                </select>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <p>Loading regulatory pipeline...</p>
                </div>
              ) : error ? (
                <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "10px", color: "#fca5a5" }}>
                  {error}
                </div>
              ) : studies.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", background: "rgba(18, 30, 26, 0.5)", borderRadius: "12px" }}>
                  <p style={{ color: "#94a3b8" }}>
                    No studies currently match this filter. Studies enter Regulatory Tracking after receiving an official IEC Decision of 'Approved'.
                  </p>
                </div>
              ) : (
                <div className="reg-table-container">
                  <table className="reg-table">
                    <thead>
                      <tr>
                        <th>Study Protocol</th>
                        <th>Principal Investigator</th>
                        <th>IEC Clearance</th>
                        <th>Regulatory Status</th>
                        <th>CTRI Registration</th>
                        <th>Activation State</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studies.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong style={{ color: "#ffffff" }}>{s.title}</strong>
                            <div style={{ fontSize: "0.76rem", color: "#38bdf8", fontFamily: "monospace" }}>
                              {s.protocol_number || s.study_id}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: "#f1f5f9" }}>{s.researcher?.full_name}</span>
                            <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>{s.researcher?.email}</div>
                          </td>
                          <td>
                            <span className="reg-badge reg-badge-approved">
                              ✓ {s.iec_decision?.decision_label || "Approved"}
                            </span>
                            {s.iec_decision?.decision_date && (
                              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                                {new Date(s.iec_decision.decision_date).toLocaleDateString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="reg-badge reg-badge-progress">
                              {s.regulatory?.status || "Not Started"}
                            </span>
                            {s.regulatory?.reference_number && (
                              <div style={{ fontSize: "0.72rem", color: "#cbd5e1", fontFamily: "monospace" }}>
                                Ref: {s.regulatory.reference_number}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`reg-badge ${
                                s.ctri?.reg_number || s.ctri?.status === "Approved/Registered"
                                  ? "reg-badge-approved"
                                  : "reg-badge-warning"
                              }`}
                            >
                              {s.ctri?.status || "Not Started"}
                            </span>
                            {s.ctri?.reg_number && (
                              <div style={{ fontSize: "0.72rem", color: "#34d399", fontFamily: "monospace", fontWeight: 700 }}>
                                {s.ctri.reg_number}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              className={`reg-badge ${
                                s.is_activated ? "reg-badge-activated" : "reg-badge-neutral"
                              }`}
                            >
                              {s.is_activated ? "⚡ ACTIVATED" : "Pending Activation"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="reg-btn reg-btn-gold"
                              style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                              onClick={() => handleOpenEdit(s)}
                            >
                              ✎ Edit Tracking
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STUDY ACTIVATION BOARD */}
          {activeTab === REG_TABS.ACTIVATION && (
            <div className="reg-module-container">
              <div className="reg-page-header">
                <div>
                  <span className="reg-header-tag">FORMAL TRIAL INITIATION</span>
                  <h1 className="reg-header-title">Study Activation Readiness Board</h1>
                  <p className="reg-header-subtitle">
                    Verify all 9 institutional, quality, ethical, and regulatory prerequisites before authorizing trial recruitment.
                  </p>
                </div>
              </div>

              {/* Study Selection Dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(18, 30, 26, 0.7)", padding: "16px 20px", borderRadius: "12px" }}>
                <strong style={{ color: "#d4af37", fontSize: "0.9rem" }}>Select Clinical Study:</strong>
                <select
                  className="reg-filter-select"
                  style={{ minWidth: "320px" }}
                  value={activationStudyId || ""}
                  onChange={(e) => handleSelectActivationStudy(e.target.value)}
                >
                  <option value="">-- Choose Study --</option>
                  {studies.map((s) => (
                    <option key={s.id} value={s.study_id || s.id}>
                      {s.protocol_number || s.study_id}: {s.title} ({s.is_activated ? "ACTIVATED" : "Pending"})
                    </option>
                  ))}
                </select>
              </div>

              {activationSuccess && (
                <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "12px", padding: "16px 20px", color: "#6ee7b7" }}>
                  ✓ {activationSuccess}
                </div>
              )}

              {loadingReadiness ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <p>Evaluating 9-point prerequisite checklist...</p>
                </div>
              ) : readinessData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Readiness Banner */}
                  <div
                    style={{
                      background: readinessData.is_activated
                        ? "linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(16, 185, 129, 0.2))"
                        : readinessData.is_ready
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                      border: `1px solid ${
                        readinessData.is_activated
                          ? "#d4af37"
                          : readinessData.is_ready
                          ? "#10b981"
                          : "#ef4444"
                      }`,
                      borderRadius: "12px",
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: readinessData.is_activated
                            ? "#facc15"
                            : readinessData.is_ready
                            ? "#34d399"
                            : "#f87171",
                        }}
                      >
                        {readinessData.is_activated
                          ? "CURRENT STATUS: ACTIVATED"
                          : readinessData.is_ready
                          ? "ALL PREREQUISITES MET: READY FOR ACTIVATION"
                          : "ACTIVATION BLOCKED: PREREQUISITES INCOMPLETE"}
                      </span>
                      <h2 style={{ margin: "4px 0", color: "#ffffff", fontSize: "1.4rem" }}>
                        {readinessData.study?.title}
                      </h2>
                      <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.86rem" }}>
                        Passed Checks: <strong>{readinessData.passed_checks}</strong> of {readinessData.total_checks}
                      </p>
                    </div>

                    {!readinessData.is_activated && (
                      <button
                        type="button"
                        className="reg-btn reg-btn-gold"
                        style={{ padding: "12px 24px", fontSize: "0.95rem" }}
                        disabled={!readinessData.is_ready || activating}
                        onClick={handleExecuteActivation}
                      >
                        {activating ? "Authorizing Activation..." : "⚡ Activate Study for Trial Conduct"}
                      </button>
                    )}
                  </div>

                  {readinessData.blocking_reasons?.length > 0 && (
                    <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", padding: "16px 20px" }}>
                      <strong style={{ color: "#f87171", fontSize: "0.85rem", textTransform: "uppercase" }}>
                        Blocking Prerequisite Conditions ({readinessData.blocking_reasons.length}):
                      </strong>
                      <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px", color: "#fca5a5", fontSize: "0.86rem" }}>
                        {readinessData.blocking_reasons.map((reason, idx) => (
                          <li key={idx} style={{ marginBottom: "4px" }}>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Checklist Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3 style={{ margin: "8px 0 4px 0", color: "#ffffff", fontSize: "1.1rem" }}>
                      Prerequisite Verification Checklist
                    </h3>

                    {readinessData.checklist?.map((check, idx) => (
                      <div key={idx} className="reg-checklist-card">
                        <div className="reg-check-item">
                          <div
                            className={`reg-check-icon ${
                              check.passed ? "reg-check-icon-pass" : "reg-check-icon-fail"
                            }`}
                          >
                            {check.passed ? "✓" : "✕"}
                          </div>
                          <div>
                            <strong style={{ color: check.passed ? "#f1f5f9" : "#fca5a5" }}>
                              {check.name}
                            </strong>
                            <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "0.84rem" }}>
                              {check.message}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`reg-badge ${
                            check.passed ? "reg-badge-approved" : "reg-badge-warning"
                          }`}
                        >
                          {check.passed ? "Passed" : "Action Required"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  Please select an approved study from the dropdown above to inspect activation prerequisites.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === REG_TABS.NOTIFICATIONS && (
            <div className="reg-module-container">
              <NotificationsPage onSelectTab={() => {}} />
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === REG_TABS.PROFILE && (
            <div className="reg-module-container">
              <ProfilePage onSelectTab={() => {}} />
            </div>
          )}
        </main>
      </div>

      {/* Edit Regulatory & CTRI Modal */}
      {selectedStudy && (
        <div className="reg-modal-backdrop" onClick={() => setSelectedStudy(null)}>
          <div className="reg-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="reg-header-tag">COMPLIANCE CREDENTIALS</span>
                <h2 style={{ margin: "6px 0 2px 0", color: "#ffffff", fontSize: "1.35rem" }}>
                  Update Regulatory & CTRI Details
                </h2>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.84rem" }}>
                  {selectedStudy.protocol_number || selectedStudy.study_id}: {selectedStudy.title}
                </p>
              </div>
              <button
                type="button"
                className="reg-btn-secondary"
                onClick={() => setSelectedStudy(null)}
                style={{ padding: "4px 10px", borderRadius: "50%", minWidth: "32px" }}
              >
                ✕
              </button>
            </div>

            {saveError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "0.84rem" }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveTracking} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Regulatory Section */}
              <div style={{ background: "rgba(10, 18, 15, 0.6)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <strong style={{ color: "#60a5fa", fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  1. Statutory Regulatory Clearance
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="reg-form-group">
                    <label className="reg-form-label">Regulatory Status *</label>
                    <select
                      className="reg-form-select"
                      value={editFormData.regulatory_status}
                      onChange={(e) => setEditFormData({ ...editFormData, regulatory_status: e.target.value })}
                      required
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved/Registered">Approved/Registered</option>
                      <option value="Returned / Requires Update">Returned / Requires Update</option>
                    </select>
                  </div>

                  <div className="reg-form-group">
                    <label className="reg-form-label">Application / Clearance Reference Number</label>
                    <input
                      type="text"
                      className="reg-form-input"
                      placeholder="e.g. AYUSH-CL-2026-0042"
                      value={editFormData.regulatory_reference_number}
                      onChange={(e) => setEditFormData({ ...editFormData, regulatory_reference_number: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="reg-form-group">
                    <label className="reg-form-label">Submission Date</label>
                    <input
                      type="date"
                      className="reg-form-input"
                      value={editFormData.regulatory_submission_date}
                      onChange={(e) => setEditFormData({ ...editFormData, regulatory_submission_date: e.target.value })}
                    />
                  </div>

                  <div className="reg-form-group">
                    <label className="reg-form-label">Approval / Clearance Date</label>
                    <input
                      type="date"
                      className="reg-form-input"
                      value={editFormData.regulatory_approval_date}
                      onChange={(e) => setEditFormData({ ...editFormData, regulatory_approval_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="reg-form-group">
                  <label className="reg-form-label">Regulatory Authority Remarks</label>
                  <textarea
                    className="reg-form-textarea"
                    rows={2}
                    placeholder="Clearance conditions, statutory remarks..."
                    value={editFormData.regulatory_remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, regulatory_remarks: e.target.value })}
                  />
                </div>
              </div>

              {/* CTRI Section */}
              <div style={{ background: "rgba(10, 18, 15, 0.6)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "12px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.88rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  2. Clinical Trial Registry - India (CTRI)
                </strong>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="reg-form-group">
                    <label className="reg-form-label">CTRI Registration Status *</label>
                    <select
                      className="reg-form-select"
                      value={editFormData.ctri_status}
                      onChange={(e) => setEditFormData({ ...editFormData, ctri_status: e.target.value })}
                      required
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Approved/Registered">Approved/Registered</option>
                      <option value="Returned / Requires Update">Returned / Requires Update</option>
                    </select>
                  </div>

                  <div className="reg-form-group">
                    <label className="reg-form-label">Official CTRI Registration Number</label>
                    <input
                      type="text"
                      className="reg-form-input"
                      placeholder="e.g. CTRI/2026/09/045892"
                      value={editFormData.ctri_reg_number}
                      onChange={(e) => setEditFormData({ ...editFormData, ctri_reg_number: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="reg-form-group">
                    <label className="reg-form-label">CTRI Submission Date</label>
                    <input
                      type="date"
                      className="reg-form-input"
                      value={editFormData.ctri_submission_date}
                      onChange={(e) => setEditFormData({ ...editFormData, ctri_submission_date: e.target.value })}
                    />
                  </div>

                  <div className="reg-form-group">
                    <label className="reg-form-label">CTRI Official Registration Date</label>
                    <input
                      type="date"
                      className="reg-form-input"
                      value={editFormData.ctri_registration_date}
                      onChange={(e) => setEditFormData({ ...editFormData, ctri_registration_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="reg-form-group">
                  <label className="reg-form-label">CTRI Registry Remarks</label>
                  <textarea
                    className="reg-form-textarea"
                    rows={2}
                    placeholder="Public registry remarks, clinical trial phase..."
                    value={editFormData.ctri_remarks}
                    onChange={(e) => setEditFormData({ ...editFormData, ctri_remarks: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="reg-btn reg-btn-secondary"
                  onClick={() => setSelectedStudy(null)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="reg-btn reg-btn-gold"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Compliance Tracking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegulatoryAdminWorkspace;
