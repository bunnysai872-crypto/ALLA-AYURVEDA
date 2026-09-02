import React, { useState, useEffect } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import { formatDate } from "../utils/formatters";
import researcherApi from "../services/researcherApi";
import KpiCard from "../components/KpiCard";
import StudyStatusBadge from "../components/StudyStatusBadge";
import StudyDetailModal from "../components/StudyDetailModal";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ResearcherDashboard Component
 * 
 * Fetches real studies from GET /api/studies.
 * Computes dynamic KPI metrics (Total, Draft, Active, AI Review Ready).
 * Displays Recent Studies with full metadata, loading, empty, and error states.
 */
export function ResearcherDashboard({ user, apiStatus, onSelectTab }) {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const researcherName = user?.full_name || user?.email?.split("@")[0] || "Researcher";

  // Effect to load studies
  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const data = await researcherApi.getStudies();
        if (isCurrent) {
          setStudies(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err) {
        if (isCurrent) {
          console.error("[ResearcherDashboard] Error fetching studies:", err);
          setError(
            err.message || "Failed to load clinical research studies from backend API."
          );
          setStudies([]);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [fetchTrigger]);

  const handleRefresh = () => {
    setRefreshing(true);
    setFetchTrigger((prev) => prev + 1);
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setFetchTrigger((prev) => prev + 1);
  };

  // Calculate real KPI values from loaded backend data
  const totalStudies = studies.length;
  const draftStudies = studies.filter(
    (s) => (s.status || "").toLowerCase().trim() === "draft"
  ).length;
  const activeStudies = studies.filter(
    (s) => (s.status || "").toLowerCase().trim() === "active"
  ).length;
  const aiReviewReadyStudies = studies.filter(
    (s) => (s.status || "").toLowerCase().trim() === "ready_for_ai_check"
  ).length;

  // Recent studies (sorted latest first, limit 5)
  const recentStudies = [...studies]
    .sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
      const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const handleOpenStudyDetail = (study) => {
    setSelectedStudy(study);
    setModalOpen(true);
  };

  const handleOpenProtocol = (study) => {
    onSelectTab(WORKSPACE_TABS.PROTOCOL_BUILDER, study);
  };

  return (
    <div className="f3-page-container">
      {/* Top Banner & Refresh Action */}
      <div className="f3-dashboard-hero">
        <div className="f3-dashboard-hero-content">
          <div className="f3-badge-gold">
            <span>✦</span> ALLA AYURVEDA RESEARCH DASHBOARD
          </div>
          <h1>
            Welcome back, <span>{researcherName}</span>
          </h1>
          <p>
            Real-time overview of your registered Ayurveda clinical research protocols,
            active trials, and AI quality gate readiness.
          </p>
        </div>

        <div className="f3-dashboard-hero-meta">
          <div className="f3-meta-item">
            <span className="f3-meta-label">INVESTIGATOR ACCOUNT</span>
            <strong className="f3-meta-val">{user?.email || "researcher@alla.ayurveda"}</strong>
          </div>
          <div className="f3-meta-item">
            <span className="f3-meta-label">BACKEND API BASE</span>
            <strong className="f3-meta-val">http://127.0.0.1:5000/api</strong>
          </div>
          <div className="f3-meta-item">
            <span className="f3-meta-label">API STATUS</span>
            <strong
              className={`f3-meta-val ${
                apiStatus === "online" ? "f3-text-success" : "f3-text-warning"
              }`}
            >
              {apiStatus === "online" ? "● Online & Synced" : "○ Offline / Standby"}
            </strong>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Real Calculated Values) */}
      <div className="f3-kpi-grid">
        <KpiCard
          title="Total Studies"
          value={totalStudies}
          icon="📚"
          subtitle="All registered protocols"
          colorVariant="default"
          loading={loading}
        />
        <KpiCard
          title="Draft Studies"
          value={draftStudies}
          icon="✎"
          subtitle="Protocols in drafting"
          colorVariant="draft"
          loading={loading}
        />
        <KpiCard
          title="Active Studies"
          value={activeStudies}
          icon="●"
          subtitle="Currently running trials"
          colorVariant="active"
          loading={loading}
        />
        <KpiCard
          title="AI Review Ready"
          value={aiReviewReadyStudies}
          icon="✦"
          subtitle="Pending Quality Gate validation"
          colorVariant="ai-ready"
          loading={loading}
        />
      </div>

      {/* Quick Actions Row */}
      <div className="f3-quick-actions-bar">
        <div className="f3-quick-actions-left">
          <button
            type="button"
            className="f3-btn f3-btn-primary"
            onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
          >
            <span>+ Create Study</span>
          </button>

          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            <span>View All Studies ({totalStudies})</span>
            <span className="f3-btn-arrow">→</span>
          </button>
        </div>

        <button
          type="button"
          className="f3-btn f3-btn-ghost f3-refresh-btn"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title="Reload studies from backend API"
        >
          <span className={`f3-refresh-icon ${refreshing ? "f3-spinning" : ""}`}>↻</span>
          <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
        </button>
      </div>

      {/* API Error State */}
      {error && (
        <div className="f3-alert-box f3-alert-error">
          <div className="f3-alert-icon">⚠️</div>
          <div className="f3-alert-content">
            <strong>Backend API Error</strong>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary f3-btn-sm"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Recent Studies Section */}
      <div className="f3-section-block">
        <div className="f3-section-header">
          <div>
            <h2>Recent Studies</h2>
            <span>Latest research protocols and trial progress</span>
          </div>

          {studies.length > 0 && (
            <button
              type="button"
              className="f3-link-btn"
              onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
            >
              See all {studies.length} studies →
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="f3-loading-container">
            <div className="f3-loader-spinner"></div>
            <p>Loading clinical research studies from backend...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && studies.length === 0 && (
          <div className="f3-empty-state-card">
            <div className="f3-empty-state-icon">📂</div>
            <h2>No studies yet</h2>
            <p>Create your first clinical research study to get started.</p>
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-primary"
                onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
              >
                <span>+ Create Your First Study</span>
              </button>
            </div>
          </div>
        )}

        {/* Studies Table / Cards */}
        {!loading && !error && studies.length > 0 && (
          <div className="f3-table-responsive">
            <table className="f3-table">
              <thead>
                <tr>
                  <th>Study ID</th>
                  <th>Title</th>
                  <th>Study Type</th>
                  <th>Study Design</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Updated Date</th>
                  <th className="f3-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentStudies.map((study) => {
                  const sId = study.id ?? study.study_id ?? "—";
                  const sTitle = study.title || "Untitled Study";
                  const sType =
                    study.study_type || study.studyType || "Clinical Trial";
                  const sDesign =
                    study.study_design || study.studyDesign || "Interventional";
                  const sStatus = study.status || "draft";
                  const sCreated = study.created_at || study.createdAt;
                  const sUpdated = study.updated_at || study.updatedAt;

                  return (
                    <tr key={sId} className="f3-table-row">
                      <td className="f3-font-mono f3-text-accent">#{sId}</td>
                      <td>
                        <strong className="f3-study-title-link" onClick={() => handleOpenStudyDetail(study)}>
                          {sTitle}
                        </strong>
                        {study.protocol_number && (
                          <span className="f3-table-subtext">
                            Protocol: {study.protocol_number}
                          </span>
                        )}
                      </td>
                      <td>{sType}</td>
                      <td>{sDesign}</td>
                      <td>
                        <StudyStatusBadge status={sStatus} />
                      </td>
                      <td>{formatDate(sCreated)}</td>
                      <td>{formatDate(sUpdated || sCreated)}</td>
                      <td className="f3-text-right">
                        <button
                          type="button"
                          className="f3-action-link"
                          onClick={() => handleOpenStudyDetail(study)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Study Detail Modal */}
      <StudyDetailModal
        study={selectedStudy}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudy(null);
        }}
        onOpenProtocol={handleOpenProtocol}
      />
    </div>
  );
}

export default ResearcherDashboard;
