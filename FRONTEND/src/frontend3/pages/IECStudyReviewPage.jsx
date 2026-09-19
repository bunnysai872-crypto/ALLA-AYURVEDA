import React, { useState, useEffect } from "react";
import iecSecretariatApi from "../services/iecSecretariatApi";
import IECStatusBadge from "../components/IECStatusBadge";
import IECVerificationSummary from "../components/IECVerificationSummary";
import "../styles/IECSecretariatModule.css";

export function IECStudyReviewPage({
  selectedStudyIdentifier,
  onSelectTab,
  onOpenVerification,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "protocol" | "documents" | "quality" | "readiness"
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedStudyIdentifier) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadStudyDossier() {
      try {
        setLoading(true);
        setError(null);
        const res = await iecSecretariatApi.getStudy(selectedStudyIdentifier);
        if (isMounted) {
          setStudyData(res.data);
        }
      } catch (err) {
        console.error("Failed to load study dossier:", err);
        if (isMounted) {
          setError(err.message || "Failed to load study review dossier");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudyDossier();
    return () => {
      isMounted = false;
    };
  }, [selectedStudyIdentifier]);

  if (!selectedStudyIdentifier) {
    return (
      <div className="iec-module-container">
        <div className="iec-empty-state">
          <span className="iec-empty-icon">🔍</span>
          <h3>No Study Selected</h3>
          <p>Please select a study from the Submission Queue to review its complete ethics dossier.</p>
          <button
            type="button"
            className="iec-btn-primary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
          >
            Go to Submission Queue →
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="iec-loading-container">
        <div className="iec-spinner" />
        <p>Loading study dossier #{selectedStudyIdentifier}...</p>
      </div>
    );
  }

  if (error || !studyData) {
    return (
      <div className="iec-module-container">
        <div className="iec-card" style={{ borderColor: "#ef4444" }}>
          <h3 style={{ color: "#f87171", margin: "0 0 8px 0" }}>Unable to load Study Dossier</h3>
          <p style={{ color: "#cbd5e1" }}>{error || "Study record not found."}</p>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
          >
            ← Return to Submission Queue
          </button>
        </div>
      </div>
    );
  }

  const study = studyData.study || {};
  const researcher = studyData.researcher || {};
  const protocol = studyData.protocol;
  const documents = studyData.documents || [];
  const qg = studyData.quality_gate || {};
  const readiness = studyData.readiness || {};

  return (
    <div className="iec-module-container">
      {/* Header */}
      <div className="iec-page-header">
        <div className="iec-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="iec-header-tag">{study.protocol_number || study.study_id}</span>
            <IECStatusBadge status={study.status} type="study" />
            <span className={`iec-badge ${readiness.is_ready ? "iec-badge-ready" : "iec-badge-not-ready"}`}>
              {readiness.is_ready ? "✓ READY FOR IEC" : "✕ NOT READY"}
            </span>
          </div>
          <h1 className="iec-header-title" style={{ marginTop: "6px" }}>
            {study.title}
          </h1>
          <p className="iec-header-subtitle">
            Ayurveda Clinical Research Dossier • Principal Investigator:{" "}
            <strong style={{ color: "#e2e8f0" }}>{researcher.full_name}</strong> ({researcher.email})
          </p>
        </div>

        <div className="iec-header-actions">
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
          >
            ← Submissions
          </button>
          <button
            type="button"
            className="iec-btn-primary"
            onClick={() => {
              if (onOpenVerification) onOpenVerification(study.study_id || study.id);
              if (onSelectTab) onSelectTab("document-verification");
            }}
          >
            🛡 Verify Documents ({documents.filter((d) => d.status === "verified").length}/{documents.length})
          </button>
          <button
            type="button"
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8860b)",
              color: "#0a1813",
              fontWeight: 700,
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => {
              window.location.href = `/iec-decision/${study.study_id || study.id || selectedStudyIdentifier}`;
            }}
          >
            ⚖ IEC Decision →
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="iec-tab-nav">
        <button
          type="button"
          className={`iec-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview & Study Info
        </button>
        <button
          type="button"
          className={`iec-tab-btn ${activeTab === "protocol" ? "active" : ""}`}
          onClick={() => setActiveTab("protocol")}
        >
          Structured Protocol {protocol ? `(v${protocol.protocol_version})` : "(Missing)"}
        </button>
        <button
          type="button"
          className={`iec-tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          Document Repository ({documents.length})
        </button>
        <button
          type="button"
          className={`iec-tab-btn ${activeTab === "quality" ? "active" : ""}`}
          onClick={() => setActiveTab("quality")}
        >
          AI Quality Gate {qg.score !== null ? `(${qg.score}/100)` : ""}
        </button>
        <button
          type="button"
          className={`iec-tab-btn ${activeTab === "readiness" ? "active" : ""}`}
          onClick={() => setActiveTab("readiness")}
        >
          IEC Readiness ({readiness.score ?? 0}%)
        </button>
      </div>

      {/* Tab: Overview & Metadata */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Section A: Study Information */}
          <div className="iec-card">
            <h3 className="iec-card-title">📖 Study Parameters & Design</h3>
            <div className="iec-grid-2col">
              <div className="iec-field-item">
                <span className="iec-field-label">Study ID / Protocol Number</span>
                <span className="iec-field-value">{study.study_id || study.protocol_number}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Short Title</span>
                <span className="iec-field-value">{study.short_title || "—"}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Study Type</span>
                <span className="iec-field-value">{study.study_type}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Study Design</span>
                <span className="iec-field-value">{study.study_design}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Clinical Condition / Disease</span>
                <span className="iec-field-value">{study.condition || "Not specified"}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Ayurvedic Intervention / Formulation</span>
                <span className="iec-field-value">{study.ayurveda_intervention || "Not specified"}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Target Population</span>
                <span className="iec-field-value">{study.target_population || "General"}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Estimated Sample Size</span>
                <span className="iec-field-value">{study.estimated_sample_size || "Not specified"} participants</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Study Duration</span>
                <span className="iec-field-value">{study.study_duration || "Not specified"}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Current Workflow State</span>
                <span className="iec-field-value">{study.status}</span>
              </div>
            </div>

            <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="iec-field-item">
                <span className="iec-field-label">Primary Research Objective</span>
                <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.9rem", lineHeight: 1.5 }}>
                  {study.research_objective || study.primary_objective || "None"}
                </p>
              </div>

              {study.secondary_objectives && (
                <div className="iec-field-item">
                  <span className="iec-field-label">Secondary Objectives</span>
                  <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.5 }}>
                    {study.secondary_objectives}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Researcher Information */}
          <div className="iec-card">
            <h3 className="iec-card-title">🔬 Principal Investigator / Research Team</h3>
            <div className="iec-grid-2col">
              <div className="iec-field-item">
                <span className="iec-field-label">Principal Investigator</span>
                <span className="iec-field-value">{researcher.full_name}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Official Email</span>
                <span className="iec-field-value">{researcher.email}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">User ID</span>
                <span className="iec-field-value">USR-#{researcher.id}</span>
              </div>
              <div className="iec-field-item">
                <span className="iec-field-label">Affiliated Institution</span>
                <span className="iec-field-value">{researcher.institution || "AYUSH Research Institute"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Protocol */}
      {activeTab === "protocol" && (
        <div className="iec-card">
          <h3 className="iec-card-title">
            📜 Structured Clinical Research Protocol
          </h3>

          {!protocol ? (
            <div className="iec-empty-state">
              <span className="iec-empty-icon">📝</span>
              <h4>No Protocol Linked</h4>
              <p>The researcher has not finalized a structured Protocol Builder record for this study yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="iec-grid-2col">
                <div className="iec-field-item">
                  <span className="iec-field-label">Protocol Title</span>
                  <span className="iec-field-value">{protocol.protocol_title || study.title}</span>
                </div>
                <div className="iec-field-item">
                  <span className="iec-field-label">Protocol Version & Date</span>
                  <span className="iec-field-value">v{protocol.protocol_version} ({protocol.protocol_date || "Current"})</span>
                </div>
                <div className="iec-field-item">
                  <span className="iec-field-label">Investigator & Sponsor</span>
                  <span className="iec-field-value">{protocol.principal_investigator || researcher.full_name} / {protocol.sponsor || "Self-Sponsored"}</span>
                </div>
                <div className="iec-field-item">
                  <span className="iec-field-label">Intervention & Dosage</span>
                  <span className="iec-field-value">{protocol.intervention_name || "Ayurvedic drug"} ({protocol.dosage || "As per protocol"})</span>
                </div>
              </div>

              <div className="iec-field-item">
                <span className="iec-field-label">Background & Rationale</span>
                <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", lineHeight: 1.5, background: "rgba(13, 21, 18, 0.6)", padding: "12px", borderRadius: "8px" }}>
                  {protocol.rationale || protocol.background || "No rationale provided."}
                </p>
              </div>

              <div className="iec-field-item">
                <span className="iec-field-label">Primary Objective & Research Question</span>
                <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", lineHeight: 1.5, background: "rgba(13, 21, 18, 0.6)", padding: "12px", borderRadius: "8px" }}>
                  {protocol.primary_objective || protocol.research_question || "No primary objective defined."}
                </p>
              </div>

              <div className="iec-grid-2col">
                <div className="iec-field-item">
                  <span className="iec-field-label">Inclusion Criteria</span>
                  <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "0.85rem", background: "rgba(13, 21, 18, 0.6)", padding: "10px", borderRadius: "8px" }}>
                    {protocol.inclusion_criteria || "None specified."}
                  </p>
                </div>
                <div className="iec-field-item">
                  <span className="iec-field-label">Exclusion Criteria</span>
                  <p style={{ margin: "4px 0 0 0", color: "#cbd5e1", fontSize: "0.85rem", background: "rgba(13, 21, 18, 0.6)", padding: "10px", borderRadius: "8px" }}>
                    {protocol.exclusion_criteria || "None specified."}
                  </p>
                </div>
              </div>

              <div className="iec-field-item">
                <span className="iec-field-label">Safety Monitoring & Adverse Event Reporting</span>
                <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", lineHeight: 1.5, background: "rgba(13, 21, 18, 0.6)", padding: "12px", borderRadius: "8px" }}>
                  {protocol.safety_monitoring || protocol.adverse_event_reporting || "Safety monitoring guidelines not specified in structured protocol."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <div className="iec-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 className="iec-card-title" style={{ margin: 0 }}>
              📁 Study Document Repository
            </h3>
            <button
              type="button"
              className="iec-btn-primary"
              onClick={() => {
                if (onOpenVerification) onOpenVerification(study.study_id || study.id);
                if (onSelectTab) onSelectTab("document-verification");
              }}
            >
              Open Verification Workbench →
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="iec-empty-state">
              <span className="iec-empty-icon">📄</span>
              <p>No documents uploaded for this study yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "rgba(13, 21, 18, 0.7)",
                    borderRadius: "8px",
                    border: "1px solid rgba(45, 75, 60, 0.4)",
                  }}
                >
                  <div>
                    <strong style={{ color: "#f8fafc", fontSize: "0.9rem" }}>{doc.original_filename}</strong>
                    <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                      Type: {doc.document_type} • Version: {doc.version || 1} • Uploaded: {doc.created_at?.slice(0, 10)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <IECStatusBadge status={doc.status} type="document" />
                    <button
                      type="button"
                      className="iec-btn-secondary"
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                      onClick={() => iecSecretariatApi.downloadDocument(doc.id, doc.original_filename)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Quality Gate */}
      {activeTab === "quality" && (
        <div className="iec-card">
          <h3 className="iec-card-title">✦ AI Quality Gate Evaluation</h3>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              background: "rgba(13, 21, 18, 0.7)",
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>Overall Score</span>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: (qg.score ?? 0) >= 70 ? "#34d399" : "#f87171" }}>
                {qg.score !== null && qg.score !== undefined ? `${qg.score}/100` : "Not evaluated"}
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>Gate Status</span>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ffffff" }}>{qg.status || "not_checked"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="iec-field-item">
              <span className="iec-field-label">Quality Summary</span>
              <p style={{ margin: "4px 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", lineHeight: 1.5 }}>
                {qg.summary || "No quality check summary available."}
              </p>
            </div>

            {qg.risk_flags && qg.risk_flags.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <span className="iec-field-label" style={{ color: "#f87171" }}>
                  Risk Flags Identified by AI Gate ({qg.risk_flags.length}):
                </span>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "#fca5a5", fontSize: "0.82rem" }}>
                  {qg.risk_flags.map((rf, idx) => (
                    <li key={`rf-${idx}`}>{typeof rf === "string" ? rf : rf.message || rf.flag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Readiness Assessment */}
      {activeTab === "readiness" && (
        <IECVerificationSummary readiness={readiness} />
      )}
    </div>
  );
}

export default IECStudyReviewPage;
