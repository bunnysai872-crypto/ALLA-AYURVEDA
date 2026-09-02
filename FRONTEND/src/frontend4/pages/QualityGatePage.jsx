import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentApi } from "../services/documentApi";
import QualityGatePanel from "../components/QualityGatePanel";

export default function QualityGatePage({ studyIdOverride = null }) {
  const { studyId: paramStudyId } = useParams();
  const navigate = useNavigate();

  const studyId = studyIdOverride || paramStudyId || "1";

  const [qualityCheck, setQualityCheck] = useState(null);
  const [studyTitle, setStudyTitle] = useState("Study Quality Assessment");
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const loadQualityCheck = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await documentApi.getStudyQualityCheck(studyId);
      setQualityCheck(res.quality_check || null);
    } catch (err) {
      setError(err.message || "Failed to load quality gate status.");
    } finally {
      setIsLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    loadQualityCheck();
  }, [loadQualityCheck]);

  const handleRunCheck = async () => {
    setIsChecking(true);
    setError("");
    try {
      const res = await documentApi.runStudyQualityCheck(studyId);
      setQualityCheck(res.quality_check);
    } catch (err) {
      setError(err.message || "Failed to execute AI Quality Gate check.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="f4-page-wrapper">
      <div className="f4-page-content">
        {/* NAV HEADER */}
        <div className="f4-qg-header">
          <div className="f4-qg-header-text">
            <button
              type="button"
              className="f4-btn-text"
              onClick={() => navigate(`/researcher/studies/${studyId}/documents`)}
            >
              ← Back to Study Documents
            </button>
            <div className="f4-eyebrow-row">
              <span className="f4-badge-tag">AI QUALITY ASSURANCE</span>
              <span className="f4-protocol-tag">Study #{studyId}</span>
            </div>
            <h2>AI Quality Gate Dashboard</h2>
            <p>
              Pre-submission clinical audit evaluating study protocol completeness, internal consistency,
              cross-document concordance, and compliance risk flags before IEC Secretariat submission.
            </p>
          </div>

          <div className="f4-qg-header-actions">
            <button
              type="button"
              className="f4-btn f4-btn-outline"
              onClick={() => navigate(`/researcher/studies/${studyId}/documents`)}
            >
              📁 Manage Documents
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-primary"
              onClick={handleRunCheck}
              disabled={isChecking}
            >
              {isChecking ? "Running Analysis..." : "✦ Run Quality Check"}
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="f4-loading-container">
            <span className="f4-spinner" />
            <p>Loading quality assessment records...</p>
          </div>
        ) : (
          <QualityGatePanel
            qualityCheck={qualityCheck}
            onRunCheck={handleRunCheck}
            isLoading={isChecking}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
