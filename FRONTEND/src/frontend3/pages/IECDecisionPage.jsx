import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { iecDecisionApi } from "../services/iecDecisionApi";
import { getStoredToken, getStoredUser } from "../utils/auth";
import AuthRequired from "../components/AuthRequired";
import IECDecisionPanel from "../components/IECDecisionPanel";
import { AIReviewSummary } from "../components/AIReviewSummary";
import { IECMemberReviewSummary } from "../components/IECMemberReviewSummary";
import { QualityGateResults } from "../components/QualityGateResults";
import { IECDocumentChecklist } from "../components/IECDocumentChecklist";
import "../styles/IECDecisionModule.css";
import "../styles/IECMemberModule.css";
import "../styles/QualityGateModule.css";

export default function IECDecisionPage() {
  const { studyId } = useParams();
  const navigate = useNavigate();

  const token = getStoredToken();
  const user = getStoredUser();
  const userRole = (user?.role || "").toLowerCase().trim();
  const isAuthorized = token && (userRole === "iec_member" || userRole === "iec_secretariat");

  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("decision"); // decision | ai_summary | member_reviews | protocol | documents
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    if (!studyId) {
      setError("No study identifier specified.");
      setLoading(false);
      return;
    }
    loadDossier();
  }, [studyId]);

  const loadDossier = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await iecDecisionApi.getDecisionDossier(studyId);
      if (res.success && res.data) {
        setDossier(res.data);
      } else {
        setError(res.message || "Failed to load study decision dossier.");
      }
    } catch (err) {
      console.error("[IEC Decision Page] Error loading dossier:", err);
      setError(err.message || "Unable to communicate with the server. Please check your network or login session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDecision = async (payload) => {
    try {
      setIsSubmitting(true);
      setError(null);
      const res = await iecDecisionApi.submitDecision(studyId, payload);
      if (res.success && res.data) {
        setSuccessNotice(res.message || "Official IEC Decision recorded successfully.");
        // Refresh dossier
        await loadDossier();
      } else {
        setError(res.message || "Failed to record IEC Decision.");
      }
    } catch (err) {
      console.error("[IEC Decision Page] Error submitting decision:", err);
      setError(err.message || "Failed to record IEC Decision.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="iec-decision-container">
        <AuthRequired
          message={
            !token
              ? "No active session found. Please sign in as an authorized IEC Member or IEC Secretariat to record ethics committee decisions."
              : `Access Denied: Your account role (${user?.role || "unknown"}) is not authorized to access the IEC Decision module.`
          }
          onNavigateToLogin={() => {
            window.location.href = "/login";
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="iec-decision-container">
        <div className="iec-loading-state">
          <div className="iec-spinner" />
          <p>Assembling Comprehensive IEC Decision Dossier...</p>
        </div>
      </div>
    );
  }

  if (error && !dossier) {
    return (
      <div className="iec-decision-container">
        <button
          type="button"
          className="iec-decision-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Return to Dashboard
        </button>
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "10px",
            padding: "24px",
            color: "#fca5a5",
            marginTop: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0" }}>⚠️ Error Loading Study Dossier</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button
            type="button"
            className="iec-decision-submit-btn"
            style={{ marginTop: "16px" }}
            onClick={loadDossier}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    study,
    researcher,
    protocol,
    documents,
    verification_checklist,
    quality_gate,
    ai_review_summary,
    iec_member_reviews,
    existing_decision,
    is_decision_finalized,
    readiness,
  } = dossier || {};

  const getStatusBadge = (st) => {
    switch (st) {
      case "approved":
        return <span className="iec-decision-badge approved">✓ Approved</span>;
      case "modification_required":
        return <span className="iec-decision-badge modify">⚠ Modification Required</span>;
      case "not_approved":
        return <span className="iec-decision-badge not_approved">✕ Not Approved</span>;
      case "iec_recommendation_submitted":
        return <span className="iec-decision-badge modify">IEC Review Submitted</span>;
      case "under_iec_review":
        return <span className="iec-decision-badge pending">Under IEC Review</span>;
      default:
        return <span className="iec-decision-badge pending">{st || "In Review"}</span>;
    }
  };

  return (
    <div className="iec-decision-container">
      {/* Header & Navigation */}
      <div className="iec-decision-header">
        <div className="iec-decision-header-left">
          <button
            type="button"
            className="iec-decision-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Return to Dashboard
          </button>
          <div className="iec-decision-title-wrap">
            <h1>Institutional Ethics Committee (IEC) Decision</h1>
            <span className="iec-decision-study-code">{study?.study_id}</span>
            {getStatusBadge(study?.status)}
          </div>
          <p className="iec-decision-subtitle">
            Study Title: <strong style={{ color: "#f8fafc" }}>{study?.title}</strong>
          </p>
        </div>

        <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#94a3b8" }}>
          <div>Principal Investigator: <strong style={{ color: "#e2e8f0" }}>{researcher?.full_name || "N/A"}</strong></div>
          <div>Institution/Email: <span style={{ color: "#38bdf8" }}>{researcher?.email}</span></div>
          {readiness && (
            <div style={{ marginTop: "4px" }}>
              Readiness Score: <strong style={{ color: "#10b981" }}>{readiness.readiness_percentage}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid #10b981",
            borderRadius: "8px",
            padding: "14px 18px",
            color: "#34d399",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✓ {successNotice}</span>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            style={{ background: "transparent", border: "none", color: "#34d399", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Finalized Banner if already decided */}
      {is_decision_finalized && existing_decision && (
        <div className={`iec-decision-finalized-banner ${existing_decision.decision}`}>
          <div className="iec-decision-banner-content">
            <h3>
              <span>🔒 Official IEC Decision Finalized:</span>
              <strong style={{ textTransform: "uppercase" }}>{existing_decision.decision_label}</strong>
            </h3>
            <div className="iec-decision-banner-meta">
              <span>Deliberated: {new Date(existing_decision.decision_date).toLocaleDateString()}</span>
              <span>Issued By: {existing_decision.decided_by?.full_name} ({existing_decision.decided_by?.role})</span>
              <span>Study Status: {existing_decision.study_status}</span>
            </div>
          </div>
          <span className={`iec-decision-badge ${existing_decision.decision}`}>
            {existing_decision.decision_label}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="iec-decision-tabs">
        <button
          type="button"
          className={`iec-decision-tab-btn ${activeTab === "decision" ? "active" : ""}`}
          onClick={() => setActiveTab("decision")}
        >
          ⚖️ IEC Decision Action {is_decision_finalized ? "(Finalized)" : "(Pending Action)"}
        </button>
        <button
          type="button"
          className={`iec-decision-tab-btn ${activeTab === "ai_summary" ? "active" : ""}`}
          onClick={() => setActiveTab("ai_summary")}
        >
          🤖 AI Review Summary & Synthesis
        </button>
        <button
          type="button"
          className={`iec-decision-tab-btn ${activeTab === "member_reviews" ? "active" : ""}`}
          onClick={() => setActiveTab("member_reviews")}
        >
          👥 Member Reviews ({iec_member_reviews?.length || 0})
        </button>
        <button
          type="button"
          className={`iec-decision-tab-btn ${activeTab === "protocol" ? "active" : ""}`}
          onClick={() => setActiveTab("protocol")}
        >
          📋 Protocol & Design
        </button>
        <button
          type="button"
          className={`iec-decision-tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          📁 Documents & Quality Gate
        </button>
      </div>

      {/* Tab 1: IEC Decision Panel */}
      {activeTab === "decision" && (
        <IECDecisionPanel
          study={study}
          existingDecision={existing_decision}
          isDecisionFinalized={is_decision_finalized}
          onSubmitDecision={handleSubmitDecision}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Tab 2: AI Review Summary */}
      {activeTab === "ai_summary" && (
        <div className="iec-decision-card">
          <div className="iec-decision-card-title">
            <span>🤖 AI Review Summary & Multi-Domain Synthesis</span>
          </div>
          {ai_review_summary ? (
            <AIReviewSummary summaryData={ai_review_summary} />
          ) : (
            <div className="iec-empty-state">
              <p>No AI Review Summary generated yet for this study.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Member Reviews */}
      {activeTab === "member_reviews" && (
        <div className="iec-decision-card">
          <div className="iec-decision-card-title">
            <span>👥 IEC Member Ethical Reviews & Recommendations</span>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Total Reviews: {iec_member_reviews?.length || 0}
            </span>
          </div>

          {!iec_member_reviews || iec_member_reviews.length === 0 ? (
            <div className="iec-empty-state">
              <p>No individual IEC member reviews have been recorded yet.</p>
            </div>
          ) : (
            <div className="iec-reviews-list">
              {iec_member_reviews.map((rev, idx) => (
                <div key={rev.review_id || idx} style={{ marginBottom: "20px" }}>
                  <IECMemberReviewSummary review={rev} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Protocol & Design */}
      {activeTab === "protocol" && (
        <div className="iec-decision-card">
          <div className="iec-decision-card-title">
            <span>📋 Clinical Trial Protocol Details</span>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Version: {protocol?.protocol_version || "1.0"}
            </span>
          </div>

          <div className="iec-dossier-grid">
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Study Type</div>
              <div className="iec-dossier-item-value">{study?.study_type || "N/A"}</div>
            </div>
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Study Design</div>
              <div className="iec-dossier-item-value">{study?.study_design || protocol?.study_design || "N/A"}</div>
            </div>
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Target Condition / Disease</div>
              <div className="iec-dossier-item-value">{study?.condition || "N/A"}</div>
            </div>
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Sample Size</div>
              <div className="iec-dossier-item-value">
                {study?.estimated_sample_size || protocol?.sample_size || "N/A"} Participants
              </div>
            </div>
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Trial Duration</div>
              <div className="iec-dossier-item-value">{study?.study_duration || protocol?.study_duration || "N/A"}</div>
            </div>
            <div className="iec-dossier-item">
              <div className="iec-dossier-item-label">Target Population</div>
              <div className="iec-dossier-item-value">{study?.target_population || protocol?.target_population || "N/A"}</div>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div className="iec-dossier-item-label">Ayurvedic Intervention & Regimen</div>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                color: "#f8fafc",
                marginTop: "4px",
              }}
            >
              {study?.ayurveda_intervention || "Not specified."}
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <div className="iec-dossier-item-label">Primary Research Objective</div>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                padding: "12px 14px",
                borderRadius: "8px",
                fontSize: "0.9rem",
                color: "#f8fafc",
                marginTop: "4px",
              }}
            >
              {study?.primary_objective || study?.research_objective || protocol?.primary_objective || "Not specified."}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Documents & Quality Gate */}
      {activeTab === "documents" && (
        <div>
          {quality_gate && (
            <div className="iec-decision-card">
              <div className="iec-decision-card-title">
                <span>🛡️ AI Quality Gate Evaluation</span>
              </div>
              <QualityGateResults qualityCheck={quality_gate} />
            </div>
          )}

          <div className="iec-decision-card">
            <div className="iec-decision-card-title">
              <span>📁 Document Verification Checklist</span>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                Total Verified: {documents?.filter((d) => d.status === "verified").length || 0} / {documents?.length || 0}
              </span>
            </div>
            <IECDocumentChecklist checklist={verification_checklist} />
          </div>
        </div>
      )}
    </div>
  );
}
