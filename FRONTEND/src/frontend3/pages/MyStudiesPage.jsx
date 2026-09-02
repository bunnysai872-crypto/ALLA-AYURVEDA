import React, { useState, useEffect, useMemo } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import { formatDate } from "../utils/formatters";
import researcherApi from "../services/researcherApi";
import StudyStatusBadge from "../components/StudyStatusBadge";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * MyStudiesPage Component
 * 
 * Complete studies explorer with search filtering, status tabs,
 * responsive clinical study table, and direct actions (View, Edit, Protocol).
 */
export function MyStudiesPage({ onSelectTab }) {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "draft" | "active" | "ready_for_ai_check"

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
          console.error("[MyStudiesPage] Error fetching studies:", err);
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

  // Filter and Search Pipeline
  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const sId = String(study.id ?? study.study_id ?? "").toLowerCase();
      const sTitle = (study.title || "").toLowerCase();
      const sType = (study.study_type || study.studyType || "clinical trial").toLowerCase();
      const sDesign = (study.study_design || study.studyDesign || "interventional").toLowerCase();
      const sStatus = (study.status || "draft").toLowerCase().trim();

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "ready_for_ai_check") {
          if (sStatus !== "ready_for_ai_check") return false;
        } else if (sStatus !== statusFilter) {
          return false;
        }
      }

      // Search query filter (matches ID, title, type, design)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        const matchesId = sId.includes(query);
        const matchesTitle = sTitle.includes(query);
        const matchesType = sType.includes(query);
        const matchesDesign = sDesign.includes(query);

        if (!matchesId && !matchesTitle && !matchesType && !matchesDesign) {
          return false;
        }
      }

      return true;
    });
  }, [studies, statusFilter, searchQuery]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: studies.length,
      draft: studies.filter((s) => (s.status || "").toLowerCase().trim() === "draft").length,
      active: studies.filter((s) => (s.status || "").toLowerCase().trim() === "active").length,
      ready_for_ai_check: studies.filter(
        (s) => (s.status || "").toLowerCase().trim() === "ready_for_ai_check"
      ).length,
    };
  }, [studies]);

  const handleViewStudy = (study) => {
    onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, study);
  };

  const handleEditStudy = (study) => {
    onSelectTab(WORKSPACE_TABS.EDIT_STUDY, study);
  };

  const handleOpenProtocol = (study) => {
    onSelectTab(WORKSPACE_TABS.PROTOCOL_BUILDER, study);
  };

  return (
    <div className="f3-page-container">
      {/* Page Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">RESEARCH DIRECTORY</span>
          <h1>My Studies</h1>
          <p>
            Explore, filter, and manage registered Ayurveda clinical trials, protocol
            milestones, and document packages.
          </p>
        </div>

        <div className="f3-header-actions">
          <button
            type="button"
            className="f3-btn f3-btn-ghost f3-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            title="Reload studies from backend API"
          >
            <span className={`f3-refresh-icon ${refreshing ? "f3-spinning" : ""}`}>↻</span>
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="f3-btn f3-btn-primary"
            onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
          >
            <span>+ Create Study</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="f3-toolbar">
        {/* Search input */}
        <div className="f3-search-box">
          <span className="f3-search-icon">🔍</span>
          <input
            type="text"
            className="f3-search-input"
            placeholder="Search by Study ID, Title, Type, or Design..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="f3-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="f3-filter-tabs">
          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "all" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All <span className="f3-filter-count">{statusCounts.all}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "draft" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("draft")}
          >
            Draft <span className="f3-filter-count">{statusCounts.draft}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "active" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active <span className="f3-filter-count">{statusCounts.active}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "ready_for_ai_check" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("ready_for_ai_check")}
          >
            Ready for AI Check <span className="f3-filter-count">{statusCounts.ready_for_ai_check}</span>
          </button>
        </div>
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

      {/* Main Content Area */}
      <div className="f3-studies-content">
        {/* Loading State */}
        {loading && (
          <div className="f3-loading-container">
            <div className="f3-loader-spinner"></div>
            <p>Loading studies from backend API...</p>
          </div>
        )}

        {/* Global Empty State (No Studies in Backend) */}
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

        {/* Filter / Search Empty State (Studies exist, but 0 matches) */}
        {!loading && !error && studies.length > 0 && filteredStudies.length === 0 && (
          <div className="f3-empty-state-card f3-empty-search">
            <div className="f3-empty-state-icon">🔍</div>
            <h2>No matching studies found</h2>
            <p>
              No studies matched your current search <em>"{searchQuery}"</em> or status filter.
            </p>
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Studies Table & Mobile Responsive Cards */}
        {!loading && !error && filteredStudies.length > 0 && (
          <div className="f3-table-responsive">
            <table className="f3-table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Study ID</th>
                  <th>Title</th>
                  <th>Study Type</th>
                  <th>Study Design</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Updated Date</th>
                  <th className="f3-text-right" style={{ width: "210px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudies.map((study) => {
                  const sId = study.id ?? study.study_id ?? "—";
                  const sTitle = study.title || "Untitled Study";
                  const sType = study.study_type || study.studyType || "Ayurvedic Clinical Trial";
                  const sDesign = study.study_design || study.studyDesign || "Interventional";
                  const sStatus = study.status || "draft";
                  const sCreated = study.created_at || study.createdAt;
                  const sUpdated = study.updated_at || study.updatedAt;

                  return (
                    <tr key={sId} className="f3-table-row">
                      <td className="f3-font-mono f3-text-accent">#{sId}</td>
                      <td>
                        <div className="f3-cell-title-group">
                          <strong
                            className="f3-study-title-link"
                            onClick={() => handleViewStudy(study)}
                          >
                            {sTitle}
                          </strong>
                          {study.protocol_number && (
                            <span className="f3-table-subtext">
                              Protocol: {study.protocol_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{sType}</td>
                      <td>{sDesign}</td>
                      <td>
                        <StudyStatusBadge status={sStatus} />
                      </td>
                      <td>{formatDate(sCreated)}</td>
                      <td>{formatDate(sUpdated || sCreated)}</td>
                      <td className="f3-text-right">
                        <div className="f3-action-btn-group">
                          <button
                            type="button"
                            className="f3-btn-action f3-btn-view"
                            onClick={() => handleViewStudy(study)}
                            title="View study details"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="f3-btn-action f3-btn-edit"
                            onClick={() => handleEditStudy(study)}
                            title="Edit study metadata"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="f3-btn-action f3-btn-protocol"
                            onClick={() => handleOpenProtocol(study)}
                            title="Open Protocol Builder for this study"
                          >
                            Protocol
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyStudiesPage;
