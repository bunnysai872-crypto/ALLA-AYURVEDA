import React, { useState, useEffect } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import { formatDateTime } from "../utils/formatters";
import researcherApi from "../services/researcherApi";
import StudyStatusBadge from "../components/StudyStatusBadge";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

/**
 * Helper to display a value or standard "Not provided" fallback.
 */
function DisplayValue({ value, isMono = false }) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return <span className="f3-not-provided">Not provided</span>;
  }
  return <span className={isMono ? "f3-font-mono" : ""}>{String(value)}</span>;
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * StudyDetailsPage Component
 * 
 * Comprehensive study view loading data via GET /api/studies/<identifier>.
 * Displays all metadata with "Not provided" fallbacks and supports Edit, Delete,
 * and Protocol Builder actions.
 */
export function StudyDetailsPage({ studyIdentifier, initialStudy, onSelectTab }) {
  const identifier = studyIdentifier ?? initialStudy?.id ?? initialStudy?.study_id;

  const [study, setStudy] = useState(initialStudy || null);
  const [loading, setLoading] = useState(!initialStudy && Boolean(identifier));
  const [error, setError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Load study from backend API
  useEffect(() => {
    if (!identifier) return;

    let isCurrent = true;

    async function loadData() {
      try {
        const data = await researcherApi.getStudy(identifier);
        if (isCurrent) {
          if (data) {
            setStudy(data);
            setError(null);
          } else {
            setError(`Study #${identifier} was not found on the server.`);
          }
        }
      } catch (err) {
        if (isCurrent) {
          console.error("[StudyDetailsPage] Error loading study:", err);
          setError(
            err.message || `Failed to load details for study #${identifier}.`
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [identifier, fetchTrigger]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setFetchTrigger((prev) => prev + 1);
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!identifier || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await researcherApi.deleteStudy(identifier);
      // On success, close modal and navigate to My Studies
      setDeleteModalOpen(false);
      onSelectTab(WORKSPACE_TABS.MY_STUDIES);
    } catch (err) {
      console.error("[StudyDetailsPage] Deletion error:", err);
      // Keep study visible and show real backend error message
      setDeleteError(
        err.message || "Failed to delete study. The backend only permits deleting studies in 'draft' status."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="f3-page-container">
        <div className="f3-loading-container">
          <div className="f3-loader-spinner"></div>
          <p>Loading clinical study record from server...</p>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="f3-page-container">
        <div className="f3-page-header">
          <div>
            <span className="f3-eyebrow">CLINICAL STUDY RECORD</span>
            <h1>Study Details</h1>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            ← Back to My Studies
          </button>
        </div>

        <div className="f3-alert-box f3-alert-error">
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Unable to Load Study</strong>
            <p>{error || "Study record is not available."}</p>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary f3-btn-sm"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sId = study.id ?? study.study_id ?? identifier;
  const sTitle = study.title || "Untitled Ayurveda Study";
  const sShortTitle = study.short_title || study.shortTitle;
  const sProtocolNumber = study.protocol_number || study.protocolNumber;
  const sStudyType = study.study_type || study.studyType;
  const sStudyDesign = study.study_design || study.studyDesign;
  const sCondition = study.condition;
  const sIntervention = study.ayurveda_intervention || study.intervention;
  const sResearchObj = study.research_objective || study.researchObjective;
  const sPrimaryObj = study.primary_objective || study.primaryObjective;
  const sSecObjectives = study.secondary_objectives || study.secondaryObjectives;
  const sDuration = study.study_duration || study.studyDuration;
  const sPopulation = study.target_population || study.targetPopulation;
  const sSampleSize = study.estimated_sample_size ?? study.sample_size ?? study.sampleSize;
  const sDescription = study.description;
  const sStatus = study.status || "draft";
  const sCreatedAt = study.created_at || study.createdAt;
  const sUpdatedAt = study.updated_at || study.updatedAt;

  return (
    <div className="f3-page-container">
      {/* Top Page Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">STUDY RECORD #{sId}</span>
          <h1 className="f3-detail-page-title">{sTitle}</h1>
          {sShortTitle && (
            <p className="f3-short-title-tag">
              Short Title: <strong>{sShortTitle}</strong>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="f3-header-actions">
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            ← Back to My Studies
          </button>

          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.EDIT_STUDY, study)}
          >
            ✎ Edit Study
          </button>

          <button
            type="button"
            className="f3-btn f3-btn-primary"
            onClick={() => onSelectTab(WORKSPACE_TABS.PROTOCOL_BUILDER, study)}
          >
            <span>Protocol Builder</span>
            <span className="f3-btn-arrow">→</span>
          </button>

          <button
            type="button"
            className="f3-btn f3-btn-ghost f3-btn-danger-ghost"
            onClick={() => {
              setDeleteError(null);
              setDeleteModalOpen(true);
            }}
            title="Delete this study"
          >
            🗑 Delete Study
          </button>
        </div>
      </div>

      {/* Main Details Card */}
      <div className="f3-detail-card">
        {/* Core Metadata Grid */}
        <div className="f3-detail-section">
          <div className="f3-detail-section-heading">
            <h3>Protocol Classification</h3>
            <div className="f3-detail-status-wrap">
              <StudyStatusBadge status={sStatus} />
            </div>
          </div>

          <div className="f3-detail-grid">
            <div className="f3-detail-item">
              <span className="f3-detail-label">Study ID</span>
              <strong className="f3-detail-value f3-font-mono f3-text-accent">#{sId}</strong>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Protocol Number</span>
              <div className="f3-detail-value">
                <DisplayValue value={sProtocolNumber} isMono={true} />
              </div>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Study Type</span>
              <div className="f3-detail-value">
                <DisplayValue value={sStudyType} />
              </div>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Study Design</span>
              <div className="f3-detail-value">
                <DisplayValue value={sStudyDesign} />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Parameters Grid */}
        <div className="f3-detail-section">
          <div className="f3-detail-section-heading">
            <h3>Clinical Parameters & Intervention</h3>
          </div>

          <div className="f3-detail-grid">
            <div className="f3-detail-item">
              <span className="f3-detail-label">Target Condition (Vyadhi)</span>
              <div className="f3-detail-value">
                <DisplayValue value={sCondition} />
              </div>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Ayurvedic Intervention (Aushadhi)</span>
              <div className="f3-detail-value">
                <DisplayValue value={sIntervention} />
              </div>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Study Duration</span>
              <div className="f3-detail-value">
                <DisplayValue value={sDuration} />
              </div>
            </div>

            <div className="f3-detail-item">
              <span className="f3-detail-label">Estimated Sample Size</span>
              <div className="f3-detail-value">
                <DisplayValue value={sSampleSize ? `${sSampleSize} participants` : null} />
              </div>
            </div>
          </div>

          <div className="f3-detail-single-row">
            <span className="f3-detail-label">Target Population & Criteria</span>
            <div className="f3-detail-value-block">
              <DisplayValue value={sPopulation} />
            </div>
          </div>
        </div>

        {/* Objectives Section */}
        <div className="f3-detail-section">
          <div className="f3-detail-section-heading">
            <h3>Research Objectives & Endpoints</h3>
          </div>

          <div className="f3-detail-narrative-group">
            <div className="f3-narrative-item">
              <span className="f3-detail-label">Research Objective</span>
              <div className="f3-narrative-box">
                <DisplayValue value={sResearchObj} />
              </div>
            </div>

            <div className="f3-narrative-item">
              <span className="f3-detail-label">Primary Objective</span>
              <div className="f3-narrative-box">
                <DisplayValue value={sPrimaryObj} />
              </div>
            </div>

            <div className="f3-narrative-item">
              <span className="f3-detail-label">Secondary Objectives</span>
              <div className="f3-narrative-box">
                <DisplayValue value={sSecObjectives} />
              </div>
            </div>

            <div className="f3-narrative-item">
              <span className="f3-detail-label">Description / Background Abstract</span>
              <div className="f3-narrative-box">
                <DisplayValue value={sDescription} />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Timestamps */}
        <div className="f3-detail-audit-footer">
          <div className="f3-audit-item">
            <span className="f3-audit-label">REGISTRATION DATE</span>
            <span className="f3-audit-value">{formatDateTime(sCreatedAt)}</span>
          </div>

          <div className="f3-audit-item">
            <span className="f3-audit-label">LAST MODIFIED</span>
            <span className="f3-audit-value">{formatDateTime(sUpdatedAt || sCreatedAt)}</span>
          </div>

          {study.principal_investigator_id && (
            <div className="f3-audit-item">
              <span className="f3-audit-label">INVESTIGATOR ID</span>
              <span className="f3-audit-value f3-font-mono">User #{study.principal_investigator_id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        study={study}
        isOpen={deleteModalOpen}
        isDeleting={isDeleting}
        errorMessage={deleteError}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteError(null);
        }}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}

export default StudyDetailsPage;

