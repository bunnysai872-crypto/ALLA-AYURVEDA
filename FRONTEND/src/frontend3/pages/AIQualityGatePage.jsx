import React, { useState, useEffect, useCallback } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import researcherApi from "../services/researcherApi";
import qualityGateApi from "../services/qualityGateApi";
import StudyStatusBadge from "../components/StudyStatusBadge";
import QualityGateResults from "../components/QualityGateResults";
import QualityGateIssues from "../components/QualityGateIssues";
import "../styles/QualityGateModule.css";

/**
 * ALLA AYURVEDA — FRONTEND 3 — PHASE 2
 * AIQualityGatePage Component
 * 
 * Clinical research quality assurance workspace:
 * - Deterministic cross-document NLP validation
 * - Scoring (0-100) & GCP/AYUSH compliance checks
 * - Completeness, Consistency, Cross-Document Concordance
 * - Actionable audit findings & recommendations
 */
export function AIQualityGatePage({ activeStudy, onSelectTab }) {
  const [studiesList, setStudiesList] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(activeStudy || null);
  const [qualityCheck, setQualityCheck] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState(null);

  const studyId = selectedStudy?.id ?? selectedStudy?.study_id;

  // Load studies list if no activeStudy provided
  useEffect(() => {
    if (selectedStudy) return;

    let isMounted = true;
    async function fetchStudies() {
      try {
        const list = await researcherApi.getStudies();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setStudiesList(list);
          setSelectedStudy(list[0]);
        }
      } catch (err) {
        console.error("[AIQualityGatePage] Error loading studies:", err);
      }
    }

    fetchStudies();
    return () => {
      isMounted = false;
    };
  }, [selectedStudy]);

  // Load latest quality check result & preparation data
  const fetchQualityStatus = useCallback(async () => {
    if (!studyId) return;

    setLoading(true);
    setError(null);
    try {
      // 1. Get latest evaluation
      const qcRes = await qualityGateApi.getLatestQualityCheck(studyId);
      if (qcRes && (qcRes.quality_check || qcRes.data)) {
        setQualityCheck(qcRes.quality_check || qcRes.data);
      } else {
        setQualityCheck(null);
      }

      // 2. Get preparation data
      try {
        const prepRes = await qualityGateApi.getQualityData(studyId);
        setQualityData(prepRes?.data || prepRes || null);
      } catch (prepErr) {
        // Non-fatal
        console.warn("[AIQualityGatePage] Prep data note:", prepErr.message);
      }
    } catch (err) {
      console.error("[AIQualityGatePage] Error fetching quality check:", err);
      setError(err.message || `Failed to fetch quality check for study #${studyId}.`);
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchQualityStatus();
  }, [fetchQualityStatus]);

  // Trigger new Quality Gate Evaluation
  const handleRunQualityCheck = async () => {
    if (!studyId || runningCheck) return;

    setRunningCheck(true);
    setError(null);
    try {
      const res = await qualityGateApi.runQualityCheck(studyId);
      const qc = (res && (res.quality_check || res.data)) || res;
      setQualityCheck(qc);
    } catch (err) {
      console.error("[AIQualityGatePage] Run error:", err);
      setError(err.message || "Failed to execute AI Quality Gate check.");
    } finally {
      setRunningCheck(false);
    }
  };

  // If no studies exist
  if (!selectedStudy && !loading) {
    return (
      <div className="f3-page-container">
        <div className="f3-page-header">
          <div>
            <span className="f3-eyebrow">AUTOMATED CLINICAL VALIDATION</span>
            <h1>AI Quality Gate</h1>
            <p>Algorithmic verification for protocol completeness and cross-document concordance.</p>
          </div>
        </div>

        <div className="f3-empty-state-card">
          <div className="f3-empty-state-icon">✨</div>
          <h2>No Research Studies Found</h2>
          <p>Please create a study first to enable AI Quality Gate validation.</p>
          {onSelectTab && (
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-primary"
                onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
              >
                + Create New Study
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isNotCheckedYet = !qualityCheck || qualityCheck.status === "not_checked";

  return (
    <div className="f3-page-container">
      {/* Top Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">REGULATORY AUTOMATION & AUDIT</span>
          <h1>AI Quality Gate</h1>
          <p>
            Automated pre-submission validation engine verifying trial consistency,
            sample size concordance, and GCP document completeness.
          </p>
        </div>

        <div className="f3-header-actions">
          {onSelectTab && (
            <>
              <button
                type="button"
                className="f3-btn f3-btn-secondary"
                onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
              >
                ← My Studies
              </button>
              {studyId && (
                <button
                  type="button"
                  className="f3-btn f3-btn-secondary"
                  onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, selectedStudy)}
                >
                  Study Details
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Study Banner */}
      <div className="f3-protocol-context-banner">
        <div className="f3-protocol-banner-left">
          <div className="f3-context-icon">⚖️</div>
          <div className="f3-context-info">
            <div className="f3-context-tag-row">
              <span className="f3-context-tag">EVALUATION CONTEXT</span>
              <StudyStatusBadge status={selectedStudy?.status || "draft"} />
              <span className="f3-protocol-status-badge">
                {isNotCheckedYet ? "Quality Check Pending" : `Score: ${qualityCheck?.score ?? "—"}/100`}
              </span>
            </div>
            <h2 className="f3-context-title">
              {selectedStudy?.title || "Untitled Research Study"}
            </h2>
            <div className="f3-context-sub-row">
              <span><strong>Study ID:</strong> #{studyId}</span>
              {selectedStudy?.protocol_number && (
                <span><strong>Protocol ID:</strong> {selectedStudy.protocol_number}</span>
              )}
              {selectedStudy?.study_type && (
                <span><strong>Type:</strong> {selectedStudy.study_type}</span>
              )}
            </div>
          </div>
        </div>

        {/* Study Switcher if multiple */}
        {studiesList.length > 1 && (
          <div className="f3-protocol-switcher">
            <label htmlFor="qg-study-switcher">Switch Study:</label>
            <select
              id="qg-study-switcher"
              className="f3-input f3-select f3-select-sm"
              value={studyId}
              onChange={(e) => {
                const target = studiesList.find(
                  (s) => String(s.id ?? s.study_id) === e.target.value
                );
                if (target) {
                  setSelectedStudy(target);
                }
              }}
            >
              {studiesList.map((s) => (
                <option key={s.id ?? s.study_id} value={s.id ?? s.study_id}>
                  #{s.id ?? s.study_id} — {s.title?.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "20px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Quality Gate Notice</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="f3-btn f3-btn-secondary f3-btn-sm" onClick={fetchQualityStatus}>
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="f3-loading-container" style={{ padding: "60px 0" }}>
          <div className="f3-loader-spinner"></div>
          <p>Loading quality gate status...</p>
        </div>
      ) : isNotCheckedYet ? (
        /* Empty / Initial State */
        <div className="f3-empty-state-card" style={{ padding: "40px" }}>
          <div className="f3-empty-state-icon">⚡</div>
          <h2>Ready for AI Quality Gate Evaluation</h2>
          <p style={{ maxWidth: "600px", margin: "0 auto 20px auto" }}>
            The AI Quality Gate analyzes protocol completeness, cross-document concordance,
            and regulatory adherence before submitting study #{studyId} to the IEC Secretariat.
          </p>

          {/* Pre-flight checklist info */}
          {qualityData && (
            <div
              style={{
                maxWidth: "460px",
                margin: "0 auto 24px auto",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--f3-border)",
                borderRadius: "var(--f3-radius-md)",
                padding: "16px",
                textAlign: "left",
              }}
            >
              <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "var(--f3-brand-gold)" }}>
                Pre-Flight Asset Readiness:
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                <div>
                  {qualityData.study_metadata?.has_title ? "✓" : "⚠️"} Study Title & Description Defined
                </div>
                <div>
                  {qualityData.document_readiness?.has_protocol ? "✓" : "⚠️"} Protocol Document Uploaded
                </div>
                <div>
                  {qualityData.document_readiness?.total_documents > 0 ? "✓" : "⚠️"}{" "}
                  {qualityData.document_readiness?.total_documents || 0} Total Documents Available
                </div>
              </div>
            </div>
          )}

          <div className="f3-empty-state-actions">
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              onClick={handleRunQualityCheck}
              disabled={runningCheck}
            >
              {runningCheck ? (
                <>
                  <span className="f3-refresh-icon f3-spinning">↻</span>
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <span>⚡ Execute AI Quality Gate Now</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Evaluation Results View */
        <div>
          <QualityGateResults
            qualityCheck={qualityCheck}
            onReRun={handleRunQualityCheck}
            running={runningCheck}
          />

          <QualityGateIssues qualityCheck={qualityCheck} />
        </div>
      )}
    </div>
  );
}

export default AIQualityGatePage;
