import React, { useState, useEffect } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import { formatDateTime } from "../utils/formatters";
import researcherApi from "../services/researcherApi";
import regulatoryApi from "../services/regulatoryApi";
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
 * Protocol Builder, and Participant Management actions.
 */
export function StudyDetailsPage({ studyIdentifier, initialStudy, onSelectTab }) {
  const identifier = studyIdentifier ?? initialStudy?.id ?? initialStudy?.study_id;

  const [study, setStudy] = useState(initialStudy || null);
  const [complianceData, setComplianceData] = useState(null);
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

        // Fetch IEC Decision and Regulatory compliance data if study has progressed
        try {
          const comp = await regulatoryApi.getRegulatoryDossier(identifier);
          if (isCurrent && comp?.success) {
            setComplianceData(comp.data);
          }
        } catch {
          // Non-blocking if study is still in pre-approval stages
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

          {sStatus === "activated" && (
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              style={{
                background: "linear-gradient(135deg, #10b981, #d4af37)",
                color: "#0a1813",
                fontWeight: 700,
                border: "none",
              }}
              onClick={() => onSelectTab(WORKSPACE_TABS.PARTICIPANTS, study)}
            >
              <span>Manage Participants & Consent</span>
              <span className="f3-btn-arrow">→</span>
            </button>
          )}

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
        {/* Research Lifecycle Timeline */}
        <div style={{ padding: "20px 24px", background: "rgba(10, 18, 15, 0.7)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: "0.76rem", color: "#d4af37", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            CLINICAL RESEARCH LIFECYCLE
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginTop: "12px" }}>
            {[
              { num: "01", name: "Protocol Draft", active: true },
              { num: "02", name: "Doc Verification", active: ["submitted", "under_iec_review", "iec_recommendation_submitted", "approved", "activated"].includes(sStatus) },
              { num: "03", name: "IEC Review", active: ["under_iec_review", "iec_recommendation_submitted", "approved", "activated"].includes(sStatus) },
              { num: "04", name: "IEC Decision", active: ["approved", "activated", "modification_required", "not_approved"].includes(sStatus) },
              { num: "05", name: "Regulatory & CTRI", active: ["approved", "activated"].includes(sStatus) },
              { num: "06", name: "Activated Trial", active: sStatus === "activated" },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: st.active ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${st.active ? "rgba(16, 185, 129, 0.35)" : "rgba(255, 255, 255, 0.08)"}`,
                  borderRadius: "8px",
                  padding: "8px 10px",
                }}
              >
                <div style={{ fontSize: "0.68rem", color: st.active ? "#34d399" : "#64748b", fontWeight: 700 }}>
                  STAGE {st.num}
                </div>
                <div style={{ fontSize: "0.8rem", color: st.active ? "#ffffff" : "#94a3b8", fontWeight: 600 }}>
                  {st.name} {st.active ? "✓" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Official IEC Decision Banner (if available) */}
        {(complianceData?.iec_decision || ["approved", "modification_required", "not_approved", "activated"].includes(sStatus)) && (
          <div style={{ padding: "16px 24px", background: "rgba(212, 175, 55, 0.08)", borderBottom: "1px solid rgba(212, 175, 55, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "0.74rem", color: "#d4af37", fontWeight: 700, textTransform: "uppercase" }}>
                OFFICIAL ETHICS COMMITTEE DECISION
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <strong style={{ fontSize: "1.1rem", color: "#ffffff" }}>
                  Outcome: {complianceData?.iec_decision?.decision_label || (sStatus === "activated" ? "Approved" : sStatus.replace(/_/g, " ").toUpperCase())}
                </strong>
                {complianceData?.iec_decision?.decision_date && (
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    • Issued on {new Date(complianceData.iec_decision.decision_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {complianceData?.iec_decision?.remarks && (
                <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "0.84rem" }}>
                  Committee Remarks: <em>"{complianceData.iec_decision.remarks}"</em>
                </p>
              )}
            </div>
            {sStatus === "activated" && (
              <span className="f3-badge" style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.3), rgba(16,185,129,0.3))", color: "#facc15", border: "1px solid #d4af37", fontWeight: 700, padding: "6px 12px" }}>
                ⚡ STUDY ACTIVATED
              </span>
            )}
          </div>
        )}

        {/* Regulatory & CTRI Details (if available) */}
        {complianceData?.regulatory_tracking && (
          <div style={{ padding: "16px 24px", background: "rgba(18, 30, 26, 0.5)", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <div style={{ background: "rgba(10, 18, 15, 0.7)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase" }}>
                STATUTORY REGULATORY STATUS
              </span>
              <div style={{ marginTop: "4px", fontSize: "0.92rem", fontWeight: 600, color: "#ffffff" }}>
                {complianceData.regulatory_tracking.regulatory?.status || "In Progress"}
              </div>
              {complianceData.regulatory_tracking.regulatory?.reference_number && (
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", fontFamily: "monospace", marginTop: "2px" }}>
                  Ref: {complianceData.regulatory_tracking.regulatory.reference_number}
                </div>
              )}
            </div>

            <div style={{ background: "rgba(10, 18, 15, 0.7)", padding: "12px 16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: "0.72rem", color: "#34d399", fontWeight: 700, textTransform: "uppercase" }}>
                CTRI REGISTRATION
              </span>
              <div style={{ marginTop: "4px", fontSize: "0.92rem", fontWeight: 600, color: "#ffffff" }}>
                {complianceData.regulatory_tracking.ctri?.status || "In Progress"}
              </div>
              {complianceData.regulatory_tracking.ctri?.reg_number && (
                <div style={{ fontSize: "0.78rem", color: "#34d399", fontFamily: "monospace", fontWeight: 700, marginTop: "2px" }}>
                  {complianceData.regulatory_tracking.ctri.reg_number}
                </div>
              )}
            </div>
          </div>
        )}

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

