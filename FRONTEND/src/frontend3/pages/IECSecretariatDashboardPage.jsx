import React, { useState, useEffect } from "react";
import iecSecretariatApi from "../services/iecSecretariatApi";
import IECKpiCard from "../components/IECKpiCard";
import IECStudyCard from "../components/IECStudyCard";
import "../styles/IECSecretariatModule.css";

export function IECSecretariatDashboardPage({ onSelectTab, onSelectStudy }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const data = await iecSecretariatApi.getDashboard();
        if (isMounted) {
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Failed to load IEC Secretariat dashboard:", err);
        if (isMounted) {
          setError(err.message || "Failed to load dashboard metrics");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="iec-loading-container">
        <div className="iec-spinner" />
        <p>Loading IEC Secretariat dashboard & metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="iec-module-container">
        <div className="iec-card" style={{ borderColor: "#ef4444" }}>
          <h3 style={{ color: "#f87171", margin: "0 0 8px 0" }}>Dashboard Error</h3>
          <p style={{ color: "#cbd5e1" }}>{error}</p>
          <button
            type="button"
            className="iec-btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const recentList = metrics?.recent_submissions || [];

  return (
    <div className="iec-module-container">
      {/* Header */}
      <div className="iec-page-header">
        <div className="iec-header-left">
          <span className="iec-header-tag">🏛 Institutional Ethics Committee</span>
          <h1 className="iec-header-title">IEC Secretariat Dashboard</h1>
          <p className="iec-header-subtitle">
            Manage incoming Ayurveda clinical trial submissions, verify research documentation,
            and ensure compliance readiness before convening the ethics committee meeting.
          </p>
        </div>
        <div className="iec-header-actions">
          <button
            type="button"
            className="iec-btn-primary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
          >
            📋 Open Submission Queue
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="iec-kpi-grid">
        <IECKpiCard
          label="Studies Awaiting Verification"
          value={metrics?.studies_awaiting_verification ?? 0}
          subtext="Submitted studies requiring review"
          icon="📋"
        />
        <IECKpiCard
          label="Documents Pending Verification"
          value={metrics?.documents_pending_verification ?? metrics?.pending_document_verification ?? 0}
          subtext="Individual documents awaiting audit"
          icon="⏳"
          highlight={(metrics?.documents_pending_verification || metrics?.pending_document_verification) > 0}
        />
        <IECKpiCard
          label="Verification Completed"
          value={metrics?.verification_completed ?? 0}
          subtext="All research documents verified"
          icon="✓"
        />
        <IECKpiCard
          label="Studies Requiring Correction"
          value={metrics?.studies_requiring_correction ?? metrics?.correction_requested ?? 0}
          subtext="Flagged with corrections or missing"
          icon="⚠"
          highlight={(metrics?.studies_requiring_correction || metrics?.correction_requested) > 0}
        />
        <IECKpiCard
          label="Ready for IEC Review"
          value={metrics?.ready_for_iec_review ?? 0}
          subtext="Dossier valid for committee meeting"
          icon="🛡"
        />
      </div>

      {/* Quick Access to Recent Submissions */}
      <div className="iec-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 className="iec-card-title" style={{ margin: 0 }}>
            <span>📥 Recently Submitted Ayurveda Studies</span>
          </h3>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("submissions")}
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
          >
            View All ({metrics?.total_studies ?? 0}) →
          </button>
        </div>

        {recentList.length === 0 ? (
          <div className="iec-empty-state">
            <span className="iec-empty-icon">📭</span>
            <p>No study submissions received yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {recentList.map((st) => (
              <IECStudyCard
                key={st.id || st.study_id}
                study={st}
                onSelectStudy={(id) => {
                  if (onSelectStudy) onSelectStudy(id);
                  if (onSelectTab) onSelectTab("study-review");
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IECSecretariatDashboardPage;
