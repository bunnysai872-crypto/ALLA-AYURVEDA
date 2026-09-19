import React, { useState, useEffect, useCallback } from "react";
import aiReviewSummaryApi from "../services/aiReviewSummaryApi";
import AIReviewSummary from "../components/AIReviewSummary";
import "../styles/AIReviewSummaryModule.css";

export function AIReviewSummaryPage({ selectedStudyIdentifier, onBack }) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null); // { status, message }

  const fetchSummary = useCallback(async () => {
    if (!selectedStudyIdentifier) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorState(null);
    try {
      const res = await aiReviewSummaryApi.getReviewSummary(selectedStudyIdentifier);
      if (res.success && res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error("[AIReviewSummaryPage] Fetch error:", err);
      setErrorState({
        status: err.status || 0,
        message: err.message || "Failed to load AI Review Summary.",
        isNetwork: Boolean(err.isNetworkError),
      });
    } finally {
      setLoading(false);
    }
  }, [selectedStudyIdentifier]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Handle empty selection
  if (!selectedStudyIdentifier) {
    return (
      <div className="ai-summary-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <h3>No Study Selected</h3>
        <p style={{ color: "#94a3b8" }}>
          Please select a study to view its AI-Assisted Review Summary.
        </p>
        {onBack && (
          <button type="button" className="iec-btn-secondary" onClick={onBack}>
            ← Return to Studies
          </button>
        )}
      </div>
    );
  }

  // Handle Loading
  if (loading) {
    return (
      <div className="ai-summary-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <p style={{ fontSize: "1.1rem", color: "#94a3b8" }}>
          Synthesizing AI-Assisted Clinical & Ethical Review Dossier...
        </p>
      </div>
    );
  }

  // Handle Specific Error Conditions
  if (errorState) {
    let errorTitle = "Error Loading Summary";
    let errorDesc = errorState.message;

    if (errorState.status === 401) {
      errorTitle = "Authentication Required";
      errorDesc = "Your session has expired or authentication token is missing. Please log in.";
    } else if (errorState.status === 403) {
      errorTitle = "Access Forbidden";
      errorDesc = "Confidential IEC review dossiers are accessible only to IEC Members and IEC Secretariat.";
    } else if (errorState.status === 404) {
      errorTitle = "Study Not Found";
      errorDesc = `Study '${selectedStudyIdentifier}' was not found in the registry.`;
    } else if (errorState.status === 409) {
      errorTitle = "IEC Review Pending";
      errorDesc = "An IEC Member recommendation has not yet been submitted for this study. The review summary can only be synthesized once a member files their official recommendation.";
    } else if (errorState.isNetwork) {
      errorTitle = "Backend Offline";
      errorDesc = "Cannot connect to the ALLA Ayurveda backend server. Please verify the Flask server is running on http://127.0.0.1:5000.";
    }

    return (
      <div className="ai-summary-container">
        <div style={{ marginBottom: "16px" }}>
          {onBack && (
            <button type="button" className="iec-btn-secondary" onClick={onBack}>
              ← Back
            </button>
          )}
        </div>

        <div
          style={{
            background: errorState.status === 409 ? "rgba(245, 158, 11, 0.12)" : "rgba(239, 68, 68, 0.12)",
            border: `1px solid ${errorState.status === 409 ? "#f59e0b" : "#ef4444"}`,
            borderRadius: "10px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
            {errorState.status === 409 ? "⏳" : "⚠"}
          </div>
          <h3 style={{ margin: "0 0 8px 0", color: errorState.status === 409 ? "#fbbf24" : "#f87171" }}>
            {errorTitle}
          </h3>
          <p style={{ margin: "0 0 16px 0", color: "#cbd5e1", fontSize: "0.9rem", maxWidth: "600px", marginInline: "auto" }}>
            {errorDesc}
          </p>
          <button type="button" className="iec-btn-secondary" onClick={fetchSummary}>
            ↻ Retry
          </button>
        </div>
      </div>
    );
  }

  // Successful View
  return (
    <div className="ai-summary-container">
      <div className="ai-summary-header">
        <div>
          <h2>
            <span>✦</span> AI-Assisted IEC Review Summary
          </h2>
          <p className="ai-summary-subtitle">
            Comprehensive pre-decision synthesis of protocol, documentation, Quality Gate compliance, and member recommendation
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {onBack && (
            <button type="button" className="iec-btn-secondary" onClick={onBack}>
              ← Back
            </button>
          )}
          <button type="button" className="iec-btn-primary" onClick={fetchSummary}>
            ↻ Re-Synthesize
          </button>
        </div>
      </div>

      <AIReviewSummary summaryData={summaryData} onRefresh={fetchSummary} />
    </div>
  );
}

export default AIReviewSummaryPage;
