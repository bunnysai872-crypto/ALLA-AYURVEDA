import React, { useState, useEffect, useMemo } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import { formatDate } from "../utils/formatters";
import researcherApi from "../services/researcherApi";
import StudyStatusBadge from "../components/StudyStatusBadge";
import EditStudyModal from "../components/EditStudyModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * MyStudiesPage Component
 * 
 * Complete studies explorer with search filtering, status tabs,
 * responsive clinical study table, and direct actions (View, Edit, Protocol, Delete).
 */
export function MyStudiesPage({ onSelectTab }) {
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal States for Edit & Delete
  const [studyToEdit, setStudyToEdit] = useState(null);
  const [studyToDelete, setStudyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

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
      const sProtNum = String(study.protocol_number || study.protocolNumber || "").toLowerCase();
      const sTitle = (study.title || "").toLowerCase();
      const sCondition = (study.condition || "").toLowerCase();
      const sType = (study.study_type || study.studyType || "clinical trial").toLowerCase();
      const sDesign = (study.study_design || study.studyDesign || "interventional").toLowerCase();
      const sStatus = (study.status || "draft").toLowerCase().trim();

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "draft") {
          if (sStatus !== "draft") return false;
        } else if (statusFilter === "submitted") {
          if (!["submitted", "submitted_to_iec", "ready_for_ai_check"].includes(sStatus)) return false;
        } else if (statusFilter === "under_review") {
          if (!["under_review", "iec_review", "under iec review"].includes(sStatus)) return false;
        } else if (statusFilter === "approved") {
          if (sStatus !== "approved") return false;
        } else if (statusFilter === "rejected") {
          if (!["rejected", "not_approved", "not approved"].includes(sStatus)) return false;
        } else if (sStatus !== statusFilter) {
          return false;
        }
      }

      // Search query filter (matches ID, Protocol Number, Title, Condition, Type, Design)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.trim().toLowerCase();
        const matchesId = sId.includes(query);
        const matchesProtNum = sProtNum.includes(query);
        const matchesTitle = sTitle.includes(query);
        const matchesCondition = sCondition.includes(query);
        const matchesType = sType.includes(query);
        const matchesDesign = sDesign.includes(query);

        if (!matchesId && !matchesProtNum && !matchesTitle && !matchesCondition && !matchesType && !matchesDesign) {
          return false;
        }
      }

      return true;
    });
  }, [studies, statusFilter, searchQuery]);

  // Counts for filter pills
  const statusCounts = useMemo(() => {
    const normalize = (st) => (st || "draft").toLowerCase().trim();
    return {
      all: studies.length,
      draft: studies.filter((s) => normalize(s.status) === "draft").length,
      submitted: studies.filter((s) =>
        ["submitted", "submitted_to_iec", "ready_for_ai_check"].includes(normalize(s.status))
      ).length,
      under_review: studies.filter((s) =>
        ["under_review", "iec_review", "under iec review"].includes(normalize(s.status))
      ).length,
      approved: studies.filter((s) => normalize(s.status) === "approved").length,
      rejected: studies.filter((s) =>
        ["rejected", "not_approved", "not approved"].includes(normalize(s.status))
      ).length,
    };
  }, [studies]);

  const handleViewStudy = (study) => {
    onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, study);
  };

  const handleEditStudy = (study) => {
    setStudyToEdit(study);
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const identifier = updatedData.id ?? updatedData.study_id;
      await researcherApi.updateStudy(identifier, updatedData);
      setActionSuccess(`Study #${identifier} was updated successfully.`);
      setTimeout(() => setActionSuccess(null), 5000);
      setStudyToEdit(null);
      setFetchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("[MyStudiesPage] Update error:", err);
      setError(err.message || "Failed to update study metadata.");
    }
  };

  const handleOpenProtocol = (study) => {
    onSelectTab(WORKSPACE_TABS.PROTOCOL_BUILDER, study);
  };

  const handleOpenDelete = (study) => {
    setStudyToDelete(study);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!studyToDelete || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    const identifier = studyToDelete.id ?? studyToDelete.study_id;
    try {
      await researcherApi.deleteStudy(identifier);
      setStudyToDelete(null);
      setActionSuccess(`Study #${identifier} was deleted successfully.`);
      setTimeout(() => setActionSuccess(null), 5000);
      setFetchTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("[MyStudiesPage] Deletion error:", err);
      setDeleteError(
        err.message || "Failed to delete study. The backend only permits deleting studies in 'draft' status."
      );
    } finally {
      setIsDeleting(false);
    }
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

      {/* Action Success Notification */}
      {actionSuccess && (
        <div className="f3-alert-box f3-alert-success" style={{ marginBottom: "16px" }}>
          <div className="f3-alert-icon">✓</div>
          <div className="f3-alert-content">
            <strong>Success</strong>
            <p>{actionSuccess}</p>
          </div>
          <button
            type="button"
            className="f3-search-clear"
            onClick={() => setActionSuccess(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="f3-toolbar">
        {/* Search input */}
        <div className="f3-search-box">
          <span className="f3-search-icon">🔍</span>
          <input
            type="text"
            className="f3-search-input"
            placeholder="Search by Study ID, Protocol Number, Title, or Condition..."
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
            className={`f3-filter-tab ${statusFilter === "submitted" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("submitted")}
          >
            Submitted <span className="f3-filter-count">{statusCounts.submitted}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "under_review" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("under_review")}
          >
            Under Review <span className="f3-filter-count">{statusCounts.under_review}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "approved" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("approved")}
          >
            Approved <span className="f3-filter-count">{statusCounts.approved}</span>
          </button>

          <button
            type="button"
            className={`f3-filter-tab ${statusFilter === "rejected" ? "f3-filter-tab-active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected <span className="f3-filter-count">{statusCounts.rejected}</span>
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
            <h2>No studies found</h2>
            <p>You have not registered any clinical research studies yet. Create your first study to get started.</p>
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-primary"
                onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
              >
                <span>+ Create Study</span>
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

        {/* Studies Table */}
        {!loading && !error && filteredStudies.length > 0 && (
          <div className="f3-table-responsive">
            <table className="f3-table">
              <thead>
                <tr>
                  <th style={{ width: "85px" }}>Study ID</th>
                  <th>Title</th>
                  <th>Condition</th>
                  <th>Study Type</th>
                  <th>Study Design</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Updated Date</th>
                  <th className="f3-text-right" style={{ width: "240px" }}>
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
                      <td>{study.condition || "—"}</td>
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

                          {sStatus === "draft" && (
                            <button
                              type="button"
                              className="f3-btn-action f3-btn-delete"
                              onClick={() => handleOpenDelete(study)}
                              title="Delete draft study"
                            >
                              Delete
                            </button>
                          )}
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

      {/* Edit Study Modal */}
      {studyToEdit && (
        <EditStudyModal
          study={studyToEdit}
          isOpen={Boolean(studyToEdit)}
          onClose={() => setStudyToEdit(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {studyToDelete && (
        <DeleteConfirmModal
          study={studyToDelete}
          isOpen={Boolean(studyToDelete)}
          isDeleting={isDeleting}
          errorMessage={deleteError}
          onClose={() => {
            if (!isDeleting) {
              setStudyToDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default MyStudiesPage;
