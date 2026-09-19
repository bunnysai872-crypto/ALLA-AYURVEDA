import React, { useState, useEffect, useCallback } from "react";
import iecMemberApi from "../services/iecMemberApi";
import IECMemberReviewForm from "../components/IECMemberReviewForm";
import IECMemberReviewSummary from "../components/IECMemberReviewSummary";

export function IECMemberStudyReviewPage({ selectedStudyIdentifier, onSelectTab }) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [activeSection, setActiveSection] = useState("all"); // 'all', 'protocol', 'docs', 'quality', 'ethics'
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchDossier = useCallback(async () => {
    if (!selectedStudyIdentifier) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await iecMemberApi.getStudy(selectedStudyIdentifier);
      if (res.success && res.data) {
        setDossier(res.data);
        // If no recommendation has been submitted yet, show the form by default
        setShowReviewForm(!res.data.my_review);
      }
    } catch (err) {
      console.error("Error fetching study dossier for IEC review:", err);
      setError(err.message || "Failed to load complete study dossier.");
    } finally {
      setLoading(false);
    }
  }, [selectedStudyIdentifier]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const handleStartReview = async () => {
    if (!selectedStudyIdentifier) return;
    setError(null);
    setActionSuccess("");
    try {
      const res = await iecMemberApi.startReview(selectedStudyIdentifier);
      if (res.success) {
        setActionSuccess("Study marked as 'under_iec_review'. You may now record your recommendation.");
        fetchDossier();
      }
    } catch (err) {
      setError(err.message || "Failed to start review.");
    }
  };

  const handleRecommendationSubmit = async (payload) => {
    if (!selectedStudyIdentifier) return;
    setIsSubmitting(true);
    setError(null);
    setActionSuccess("");
    try {
      const res = await iecMemberApi.submitRecommendation(selectedStudyIdentifier, payload);
      if (res.success) {
        setActionSuccess("Recommendation successfully recorded in the IEC audit trail.");
        setShowReviewForm(false);
        fetchDossier();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err.message || "Failed to submit IEC review recommendation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      await iecMemberApi.downloadDocument(docId, filename);
    } catch (err) {
      alert(`Could not download document: ${err.message}`);
    }
  };

  if (!selectedStudyIdentifier) {
    return (
      <div className="iec-member-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <h3>No Study Selected for Review</h3>
        <p style={{ color: "#94a3b8" }}>
          Please select a clinical study from the Review Queue or Dashboard to begin ethical review.
        </p>
        <button
          type="button"
          className="iec-btn-primary"
          onClick={() => onSelectTab && onSelectTab("reviews")}
        >
          Go to Review Queue →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="iec-member-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>Loading full study dossier for IEC scrutiny...</p>
      </div>
    );
  }

  if (error && !dossier) {
    return (
      <div className="iec-member-container">
        <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171" }}>
          ⚠ {error}
        </div>
        <button
          type="button"
          className="iec-btn-secondary"
          style={{ marginTop: "16px" }}
          onClick={() => onSelectTab && onSelectTab("reviews")}
        >
          ← Back to Review Queue
        </button>
      </div>
    );
  }

  const { study, researcher, protocol, documents, quality_gate, verification_checklist, readiness, review_domains, my_review } = dossier || {};

  const getStatusBadge = (status) => {
    switch (status) {
      case "ready_for_iec_review":
        return <span className="iec-badge iec-badge-ready">✓ Ready for IEC</span>;
      case "under_iec_review":
        return <span className="iec-badge iec-badge-under-review">⏳ Under Review</span>;
      case "iec_recommendation_submitted":
        return <span className="iec-badge iec-badge-rec-submitted">✓ Recommendation Sent</span>;
      default:
        return <span className="iec-badge iec-badge-ready">{status}</span>;
    }
  };

  return (
    <div className="iec-member-container">
      {/* NAVIGATION & ACTIONS HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <button
          type="button"
          className="iec-btn-secondary"
          onClick={() => onSelectTab && onSelectTab("reviews")}
        >
          ← Back to Review Queue
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {study?.status === "ready_for_iec_review" && (
            <button
              type="button"
              className="iec-btn-gold"
              onClick={handleStartReview}
            >
              Start IEC Review Mode →
            </button>
          )}
          <button
            type="button"
            style={{
              background: "linear-gradient(135deg, #d4af37, #b8860b)",
              color: "#0a1813",
              fontWeight: 700,
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
            }}
            onClick={() => {
              window.location.href = `/iec-decision/${study?.study_id || study?.id || selectedStudyIdentifier}`;
            }}
          >
            ⚖ IEC Decision →
          </button>
          {getStatusBadge(study?.status)}
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", borderRadius: "8px", color: "#6ee7b7", marginBottom: "20px" }}>
          ✓ {actionSuccess}
        </div>
      )}

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", marginBottom: "20px" }}>
          ⚠ {error}
        </div>
      )}

      {/* STUDY TITLE BANNER */}
      <div className="iec-panel-card" style={{ marginBottom: "20px", borderLeft: "4px solid #d4af37" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#d4af37", fontWeight: 700, letterSpacing: "0.05em" }}>
              {study?.protocol_number || study?.study_id} • {study?.study_type}
            </span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f8fafc", margin: "6px 0" }}>
              {study?.title}
            </h1>
            {study?.short_title && (
              <p style={{ fontSize: "0.86rem", color: "#94a3b8", margin: "0 0 8px 0" }}>
                Short Title: {study.short_title}
              </p>
            )}
            <div style={{ fontSize: "0.84rem", color: "#cbd5e1" }}>
              Principal Investigator: <strong style={{ color: "#f1f5f9" }}>{researcher?.full_name}</strong> ({researcher?.email}) • {researcher?.institution}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", textTransform: "uppercase" }}>Readiness Assessment</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: readiness?.is_ready ? "#34d399" : "#f59e0b", marginTop: "3px" }}>
              {readiness?.status || "READY FOR IEC REVIEW"}
            </div>
            {quality_gate?.score != null && (
              <div style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
                AI Quality Gate Score: <strong style={{ color: "#34d399" }}>{quality_gate.score}/100</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION TABS FOR NAVIGATING LARGE DOSSIERS */}
      <div className="iec-member-filter-bar">
        <div className="iec-member-tabs-row">
          <button
            type="button"
            className={`iec-member-tab-btn ${activeSection === "all" ? "active" : ""}`}
            onClick={() => setActiveSection("all")}
          >
            Full Review Dossier
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${activeSection === "protocol" ? "active" : ""}`}
            onClick={() => setActiveSection("protocol")}
          >
            Protocol Details
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${activeSection === "docs" ? "active" : ""}`}
            onClick={() => setActiveSection("docs")}
          >
            Documents ({documents?.length || 0})
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${activeSection === "quality" ? "active" : ""}`}
            onClick={() => setActiveSection("quality")}
          >
            AI Quality Gate
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${activeSection === "ethics" ? "active" : ""}`}
            onClick={() => setActiveSection("ethics")}
          >
            Ethical Review Workbench
          </button>
        </div>
      </div>

      <div className="iec-dossier-grid">
        {/* SECTION 1: STUDY CORE INFORMATION */}
        {(activeSection === "all" || activeSection === "protocol") && (
          <div className="iec-panel-card">
            <div className="iec-panel-header">
              <h3 className="iec-panel-title">
                <span>📖</span> Study Core Information & Objectives
              </h3>
            </div>

            <div className="iec-meta-grid" style={{ marginBottom: "16px" }}>
              <div className="iec-meta-item">
                <strong>Study Design</strong>
                <span>{study?.study_design?.replace(/_/g, " ") || "Not specified"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Clinical Condition</strong>
                <span>{study?.condition || "General clinical evaluation"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Estimated Sample Size</strong>
                <span>{study?.estimated_sample_size ? `${study.estimated_sample_size} participants` : "Not specified"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Study Duration</strong>
                <span>{study?.study_duration || "Not specified"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Target Population</strong>
                <span>{study?.target_population || "Adult patients"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Ayurvedic Intervention</strong>
                <span>{study?.ayurveda_intervention || "Classical botanical regimen"}</span>
              </div>
            </div>

            <div>
              <strong style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
                Research Objective
              </strong>
              <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "12px 14px", borderRadius: "6px", fontSize: "0.88rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                {study?.research_objective || "No description provided"}
              </div>
            </div>

            {study?.primary_objective && (
              <div style={{ marginTop: "12px" }}>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
                  Primary Objective
                </strong>
                <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#e2e8f0" }}>
                  {study.primary_objective}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: STRUCTURED PROTOCOL DETAILS */}
        {(activeSection === "all" || activeSection === "protocol") && protocol && (
          <div className="iec-panel-card">
            <div className="iec-panel-header">
              <h3 className="iec-panel-title">
                <span>🔬</span> Clinical Study Protocol (v{protocol.protocol_version})
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#d4af37" }}>
                {protocol.protocol_date ? `Date: ${protocol.protocol_date}` : "Version 1.0"}
              </span>
            </div>

            <div className="iec-meta-grid" style={{ marginBottom: "16px" }}>
              <div className="iec-meta-item">
                <strong>Intervention Name</strong>
                <span>{protocol.intervention_name || study?.ayurveda_intervention || "Ayurvedic formulation"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Dosage & Route</strong>
                <span>{protocol.dosage || "Standardized dose"} via {protocol.route || "Oral"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Frequency & Duration</strong>
                <span>{protocol.frequency || "BID"} for {protocol.intervention_duration || protocol.study_duration || "Trial period"}</span>
              </div>
              <div className="iec-meta-item">
                <strong>Blinding & Randomization</strong>
                <span>{protocol.blinding || "Open label"} • {protocol.randomization || "Non-randomized"}</span>
              </div>
            </div>

            {protocol.rationale && (
              <div style={{ marginBottom: "12px" }}>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
                  Ayurvedic & Scientific Rationale
                </strong>
                <p style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#e2e8f0", margin: 0, lineHeight: 1.5 }}>
                  {protocol.rationale}
                </p>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#34d399", textTransform: "uppercase", marginBottom: "4px" }}>
                  Inclusion Criteria
                </strong>
                <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.84rem", color: "#e2e8f0", minHeight: "60px" }}>
                  {protocol.inclusion_criteria || "Specified in protocol document"}
                </div>
              </div>

              <div>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#f87171", textTransform: "uppercase", marginBottom: "4px" }}>
                  Exclusion Criteria
                </strong>
                <div style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.84rem", color: "#e2e8f0", minHeight: "60px" }}>
                  {protocol.exclusion_criteria || "Specified in protocol document"}
                </div>
              </div>
            </div>

            {protocol.safety_monitoring && (
              <div>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#fbbf24", textTransform: "uppercase", marginBottom: "4px" }}>
                  Safety Monitoring & Adverse Event Reporting
                </strong>
                <p style={{ background: "rgba(10, 22, 19, 0.6)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.86rem", color: "#e2e8f0", margin: 0 }}>
                  {protocol.safety_monitoring}
                </p>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: DOCUMENTS & VERIFICATION CHECKLIST */}
        {(activeSection === "all" || activeSection === "docs") && (
          <div className="iec-panel-card">
            <div className="iec-panel-header">
              <h3 className="iec-panel-title">
                <span>🛡</span> Submitted Documents & Secretariat Verification
              </h3>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Verified by IEC Secretariat Unit
              </span>
            </div>

            {/* Checklist items */}
            {verification_checklist && verification_checklist.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <strong style={{ display: "block", fontSize: "0.8rem", color: "#d4af37", textTransform: "uppercase", marginBottom: "8px" }}>
                  Secretariat Verification Checklist
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                  {verification_checklist.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(10, 22, 19, 0.7)",
                        border: "1px solid rgba(45, 75, 65, 0.4)",
                        borderRadius: "6px",
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.86rem", fontWeight: 600, color: "#f8fafc" }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: item.mandatory ? "#d4af37" : "#64748b" }}>
                          {item.mandatory ? "Mandatory Document" : "Supplementary Document"}
                        </div>
                      </div>
                      <span className={`iec-badge ${item.verification_status === "verified" ? "iec-badge-ready" : "iec-badge-under-review"}`}>
                        {item.verification_status === "verified" ? "✓ Verified" : item.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uploaded Documents List */}
            <strong style={{ display: "block", fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px" }}>
              Uploaded Document Assets
            </strong>
            {documents && documents.length > 0 ? (
              <table className="iec-member-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Document Type</th>
                    <th>Status</th>
                    <th>Size</th>
                    <th style={{ textAlign: "right" }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <strong style={{ color: "#f1f5f9" }}>{doc.document_name || doc.original_filename}</strong>
                        {doc.description && (
                          <div style={{ fontSize: "0.74rem", color: "#64748b", whiteSpace: "pre-line", maxHeight: "40px", overflow: "hidden" }}>
                            {doc.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ textTransform: "capitalize", color: "#cbd5e1" }}>
                          {doc.document_type?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`iec-badge ${doc.status === "verified" ? "iec-badge-ready" : "iec-badge-under-review"}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td>{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="iec-btn-secondary"
                          style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                        >
                          ⬇ Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.86rem" }}>
                No document assets available.
              </div>
            )}
          </div>
        )}

        {/* SECTION 4: AI QUALITY GATE RESULTS */}
        {(activeSection === "all" || activeSection === "quality") && (
          <div className="iec-panel-card">
            <div className="iec-panel-header">
              <h3 className="iec-panel-title">
                <span>✦</span> AI Quality Gate Analysis & Compliance
              </h3>
              {quality_gate?.score != null && (
                <span style={{ fontSize: "1rem", fontWeight: 700, color: quality_gate.score >= 70 ? "#34d399" : "#f87171" }}>
                  Score: {quality_gate.score}/100 ({quality_gate.status})
                </span>
              )}
            </div>

            <p style={{ fontSize: "0.86rem", color: "#cbd5e1", marginTop: 0 }}>
              {quality_gate?.summary || "Automated pre-review validation evaluation."}
            </p>

            {quality_gate?.risk_flags && quality_gate.risk_flags.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#f87171", textTransform: "uppercase", marginBottom: "6px" }}>
                  Risk Flags Identified
                </strong>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#f87171", fontSize: "0.84rem" }}>
                  {quality_gate.risk_flags.map((flag, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      {typeof flag === "string" ? flag : flag.message || JSON.stringify(flag)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quality_gate?.recommendations && quality_gate.recommendations.length > 0 && (
              <div style={{ marginTop: "14px" }}>
                <strong style={{ display: "block", fontSize: "0.78rem", color: "#34d399", textTransform: "uppercase", marginBottom: "6px" }}>
                  AI Quality Recommendations
                </strong>
                <ul style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1", fontSize: "0.84rem" }}>
                  {quality_gate.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      {typeof rec === "string" ? rec : rec.text || JSON.stringify(rec)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* SECTION 5: ETHICAL REVIEW WORKBENCH */}
        {(activeSection === "all" || activeSection === "ethics") && (
          <div>
            {!showReviewForm && my_review ? (
              <IECMemberReviewSummary
                review={my_review}
                domains={review_domains || []}
                onRevise={() => setShowReviewForm(true)}
              />
            ) : (
              <div>
                {my_review && (
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.82rem", color: "#d4af37" }}>
                      Updating existing review recommendation
                    </span>
                    <button
                      type="button"
                      className="iec-btn-secondary"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel Revision & View Submitted
                    </button>
                  </div>
                )}
                <IECMemberReviewForm
                  domains={review_domains || []}
                  onSubmit={handleRecommendationSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default IECMemberStudyReviewPage;
