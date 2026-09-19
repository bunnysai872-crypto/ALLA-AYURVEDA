import React, { useState, useEffect, useCallback } from "react";
import iecSecretariatApi from "../services/iecSecretariatApi";
import IECDocumentChecklist from "../components/IECDocumentChecklist";
import IECDocumentVerificationItem from "../components/IECDocumentVerificationItem";
import IECVerificationSummary from "../components/IECVerificationSummary";
import IECVerificationModal from "../components/IECVerificationModal";
import IECStatusBadge from "../components/IECStatusBadge";
import "../styles/IECSecretariatModule.css";

export function IECDocumentVerificationPage({
  selectedStudyIdentifier,
  onSelectTab,
}) {
  const [studyData, setStudyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingToIEC, setSubmittingToIEC] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("verify"); // "verify" | "correction" | "missing"
  const [targetDocument, setTargetDocument] = useState(null);

  const loadData = useCallback(async () => {
    if (!selectedStudyIdentifier) return;
    try {
      setLoading(true);
      setError(null);
      const res = await iecSecretariatApi.getStudy(selectedStudyIdentifier);
      setStudyData(res.data);
    } catch (err) {
      console.error("Failed to load document verification data:", err);
      setError(err.message || "Failed to load study document verification");
    } finally {
      setLoading(false);
    }
  }, [selectedStudyIdentifier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenVerify = (doc) => {
    setTargetDocument(doc);
    setModalMode("verify");
    setModalOpen(true);
  };

  const handleOpenCorrection = (doc) => {
    setTargetDocument(doc);
    setModalMode("correction");
    setModalOpen(true);
  };

  const handleOpenMissing = (doc) => {
    setTargetDocument(doc);
    setModalMode("missing");
    setModalOpen(true);
  };

  const handleModalSubmit = async (payload) => {
    if (payload.action === "verify") {
      await iecSecretariatApi.verifyDocument(payload.documentId, payload.remarks);
    } else if (payload.action === "missing") {
      await iecSecretariatApi.markDocumentMissing(payload.documentId, payload.remarks);
    } else {
      await iecSecretariatApi.requestCorrection(payload.documentId, {
        reason: payload.reason,
        remarks: payload.remarks,
        reject: payload.reject,
      });
    }
    // Refresh verification data
    await loadData();
  };

  const handleDownload = (docId, filename) => {
    iecSecretariatApi.downloadDocument(docId, filename);
  };

  const handleSubmitToIEC = async () => {
    if (!selectedStudyIdentifier) return;
    try {
      setSubmittingToIEC(true);
      setSubmitFeedback(null);
      const res = await iecSecretariatApi.submitToIECReview(
        selectedStudyIdentifier,
        "All study documents verified and certified by IEC Secretariat auditor."
      );
      setSubmitFeedback({
        success: true,
        message: res.message || "Study successfully submitted to IEC Review stage.",
      });
      await loadData();
    } catch (err) {
      setSubmitFeedback({
        success: false,
        message: err.message || "Failed to submit study to IEC Review.",
      });
    } finally {
      setSubmittingToIEC(false);
    }
  };

  if (!selectedStudyIdentifier) {
    return (
      <div className="iec-module-container">
        <div className="iec-empty-state">
          <span className="iec-empty-icon">🛡</span>
          <h3>No Study Selected for Verification</h3>
          <p>Please select a study from the Submission Queue to verify its research documents.</p>
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

  if (loading && !studyData) {
    return (
      <div className="iec-loading-container">
        <div className="iec-spinner" />
        <p>Loading document verification workbench...</p>
      </div>
    );
  }

  if (error && !studyData) {
    return (
      <div className="iec-module-container">
        <div className="iec-card" style={{ borderColor: "#ef4444" }}>
          <h3 style={{ color: "#f87171", margin: "0 0 8px 0" }}>Verification Error</h3>
          <p style={{ color: "#cbd5e1" }}>{error}</p>
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

  const study = studyData?.study || {};
  const researcher = studyData?.researcher || {};
  const documents = studyData?.documents || [];
  const checklist = studyData?.verification_checklist || [];
  const readiness = studyData?.readiness || {};
  const qg = studyData?.quality_gate || {};

  const isReadyForIEC = readiness.is_ready;
  const isAlreadyInIEC = study.status === "ready_for_iec_review" || study.status === "under_iec_review" || study.status === "iec_recommendation_submitted";

  return (
    <div className="iec-module-container">
      {/* Header */}
      <div className="iec-page-header">
        <div className="iec-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="iec-header-tag">🛡 Document Verification Workbench</span>
            <span style={{ fontSize: "0.85rem", color: "#d4af37", fontWeight: 700 }}>
              {study.protocol_number || study.study_id}
            </span>
            <IECStatusBadge status={study.status} type="study" />
          </div>
          <h1 className="iec-header-title">{study.title}</h1>
          <p className="iec-header-subtitle">
            Perform administrative and regulatory scrutiny on uploaded research documents.
            Verified status and audit remarks are logged with Secretariat credentials.
          </p>
        </div>

        <div className="iec-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("study-review")}
          >
            📖 Full Study Dossier
          </button>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
          >
            ← Submissions
          </button>

          {isReadyForIEC && !isAlreadyInIEC && (
            <button
              type="button"
              className="iec-btn-primary"
              style={{
                background: "linear-gradient(135deg, #10b981, #047857)",
                boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)",
                padding: "8px 16px",
                fontWeight: 700,
              }}
              onClick={handleSubmitToIEC}
              disabled={submittingToIEC}
            >
              {submittingToIEC ? "Submitting..." : "🚀 Submit to IEC Review →"}
            </button>
          )}

          {isAlreadyInIEC && (
            <span
              style={{
                fontSize: "0.8rem",
                padding: "6px 12px",
                background: "rgba(16, 185, 129, 0.15)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              ✓ Submitted to IEC Review
            </span>
          )}
        </div>
      </div>

      {/* Submission Feedback Toast / Alert */}
      {submitFeedback && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: submitFeedback.success ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${submitFeedback.success ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
            color: submitFeedback.success ? "#6ee7b7" : "#fca5a5",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{submitFeedback.message}</span>
          <button
            type="button"
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "1.1rem" }}
            onClick={() => setSubmitFeedback(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* 1. STUDY INFORMATION CARD */}
      <div className="iec-card">
        <h3 className="iec-card-title">
          <span>📋 Basic Study Information</span>
        </h3>
        <div className="iec-grid-2col" style={{ marginTop: "12px" }}>
          <div className="iec-field-item">
            <span className="iec-field-label">Study ID / Protocol Number</span>
            <span className="iec-field-value" style={{ color: "#d4af37", fontWeight: 700 }}>
              {study.protocol_number || study.study_id}
            </span>
          </div>
          <div className="iec-field-item">
            <span className="iec-field-label">Study Title</span>
            <span className="iec-field-value">{study.title}</span>
          </div>
          <div className="iec-field-item">
            <span className="iec-field-label">Principal Researcher</span>
            <span className="iec-field-value">
              {researcher.full_name || "Investigator"} {researcher.email ? `(${researcher.email})` : ""}
            </span>
          </div>
          <div className="iec-field-item">
            <span className="iec-field-label">Study Type & Design</span>
            <span className="iec-field-value">
              {study.study_type || "Ayurveda"} — {study.study_design || "Clinical Trial"}
            </span>
          </div>
          <div className="iec-field-item">
            <span className="iec-field-label">Current Workflow Status</span>
            <div style={{ marginTop: "4px" }}>
              <IECStatusBadge status={study.status} type="study" />
            </div>
          </div>
          <div className="iec-field-item">
            <span className="iec-field-label">Submission Date</span>
            <span className="iec-field-value">
              {(study.updated_at || study.created_at)?.slice(0, 10) || "Recent"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. AI QUALITY GATE SUMMARY CARD */}
      <div className="iec-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
          <h3 className="iec-card-title" style={{ margin: 0 }}>
            <span>✦ AI Quality Gate Summary</span>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>Overall Quality Gate Score:</span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: (qg.score ?? 0) >= 70 ? "#34d399" : "#f87171",
              }}
            >
              {qg.score !== null && qg.score !== undefined ? `${qg.score}/100` : "Not evaluated"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "3px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
                fontWeight: 700,
                background: qg.status === "passed" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                color: qg.status === "passed" ? "#34d399" : "#f87171",
              }}
            >
              {qg.status || "not_checked"}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginTop: "14px" }}>
          {/* Completeness */}
          <div style={{ padding: "12px", background: "rgba(13, 21, 18, 0.6)", borderRadius: "8px", border: "1px solid rgba(45, 75, 60, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9" }}>📋 Completeness Check</span>
              <span style={{ fontSize: "0.75rem", color: qg.completeness?.status === "pass" ? "#34d399" : "#fbbf24" }}>
                {qg.completeness?.status || "Checked"}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>
              {qg.completeness?.message || "Mandatory study parameters and required protocol boundaries evaluated."}
            </p>
          </div>

          {/* Consistency */}
          <div style={{ padding: "12px", background: "rgba(13, 21, 18, 0.6)", borderRadius: "8px", border: "1px solid rgba(45, 75, 60, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9" }}>🎯 Internal Consistency</span>
              <span style={{ fontSize: "0.75rem", color: qg.consistency?.status === "pass" ? "#34d399" : "#fbbf24" }}>
                {qg.consistency?.status || "Checked"}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>
              {qg.consistency?.message || "Study design parameters concordant with research questions and intervention."}
            </p>
          </div>

          {/* Cross-Document */}
          <div style={{ padding: "12px", background: "rgba(13, 21, 18, 0.6)", borderRadius: "8px", border: "1px solid rgba(45, 75, 60, 0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f1f5f9" }}>📑 Cross-Document Check</span>
              <span style={{ fontSize: "0.75rem", color: qg.cross_document?.status === "pass" ? "#34d399" : "#fbbf24" }}>
                {qg.cross_document?.status || "Checked"}
              </span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0 }}>
              {qg.cross_document?.message || "Protocol and Informed Consent cross-referenced for dosage and participant safeguards."}
            </p>
          </div>
        </div>

        {/* Quality / Risk Flags */}
        {qg.risk_flags && qg.risk_flags.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
            }}
          >
            <strong style={{ fontSize: "0.82rem", color: "#fca5a5", display: "block", marginBottom: "6px" }}>
              ⚠️ Quality / Risk Flags Identified by AI Gate ({qg.risk_flags.length}):
            </strong>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#f87171", fontSize: "0.8rem", lineHeight: 1.5 }}>
              {qg.risk_flags.map((rf, idx) => (
                <li key={`rf-${idx}`}>{typeof rf === "string" ? rf : rf.message || rf.flag}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. READINESS ASSESSMENT CARD */}
      <IECVerificationSummary readiness={readiness} />

      {/* 4. MANDATORY ETHICS DOCUMENT CHECKLIST */}
      <div className="iec-card">
        <h3 className="iec-card-title">
          📋 Mandatory Ethics Document Checklist
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: "0 0 16px 0" }}>
          Verification criteria required under Good Clinical Practice (GCP) and ICMR / AYUSH ethical guidelines.
        </p>
        <IECDocumentChecklist
          checklist={checklist}
          onSelectDocument={handleOpenVerify}
          onDownloadDocument={handleDownload}
        />
      </div>

      {/* 5. UPLOADED DOCUMENTS SCRUTINY & VERIFICATION LIST */}
      <div className="iec-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="iec-card-title" style={{ margin: 0 }}>
            🔍 Uploaded Documents List & Scrutiny ({documents.length})
          </h3>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={loadData}
            style={{ fontSize: "0.78rem", padding: "4px 10px" }}
          >
            ↻ Refresh
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
              <IECDocumentVerificationItem
                key={doc.id}
                document={doc}
                onVerify={handleOpenVerify}
                onCorrection={handleOpenCorrection}
                onMarkMissing={handleOpenMissing}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>

      {/* Verification / Correction / Missing Modal */}
      <IECVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        document={targetDocument}
        mode={modalMode}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}

export default IECDocumentVerificationPage;
