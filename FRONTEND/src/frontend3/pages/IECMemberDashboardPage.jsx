import React, { useState, useEffect } from "react";
import iecMemberApi from "../services/iecMemberApi";

export function IECMemberDashboardPage({ onSelectTab, onSelectStudy }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await iecMemberApi.getDashboard();
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error("Error loading IEC Member dashboard:", err);
      setError(err.message || "Failed to load IEC Member dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const getRecBadge = (rec) => {
    if (!rec) return <span style={{ color: "#64748b", fontSize: "0.78rem" }}>Pending</span>;
    switch (rec) {
      case "recommend_approval":
        return <span className="iec-badge iec-badge-rec-approval">✓ Approval</span>;
      case "recommend_modification":
        return <span className="iec-badge iec-badge-rec-modification">⚠ Modification</span>;
      case "recommend_rejection":
        return <span className="iec-badge iec-badge-rec-rejection">✕ Rejection</span>;
      default:
        return <span className="iec-badge iec-badge-ready">{rec}</span>;
    }
  };

  return (
    <div className="iec-member-container">
      {/* HEADER */}
      <div className="iec-member-header">
        <div>
          <h2>
            <span>🏛</span> IEC Member Ethical Scrutiny Dashboard
          </h2>
          <p className="iec-member-subtitle">
            Institutional Ethics Committee review workbench for evaluating Ayurveda clinical trials and protocols
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="iec-btn-secondary"
            onClick={fetchDashboard}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            className="iec-btn-primary"
            onClick={() => onSelectTab && onSelectTab("reviews")}
          >
            View Review Queue →
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", marginBottom: "20px" }}>
          ⚠ {error}
        </div>
      )}

      {/* KPI GRID */}
      <div className="iec-member-kpi-grid">
        <div className="iec-member-kpi-card highlight">
          <div className="iec-member-kpi-header">
            <span className="iec-member-kpi-label">Ready for IEC Review</span>
            <span className="iec-member-kpi-icon">📋</span>
          </div>
          <div className="iec-member-kpi-value">
            {loading ? "..." : metrics?.ready_for_review ?? 0}
          </div>
          <div className="iec-member-kpi-subtext">Verified submissions awaiting review</div>
        </div>

        <div className="iec-member-kpi-card">
          <div className="iec-member-kpi-header">
            <span className="iec-member-kpi-label">Reviews In Progress</span>
            <span className="iec-member-kpi-icon">⏳</span>
          </div>
          <div className="iec-member-kpi-value">
            {loading ? "..." : metrics?.under_review ?? 0}
          </div>
          <div className="iec-member-kpi-subtext">Currently under ethical evaluation</div>
        </div>

        <div className="iec-member-kpi-card">
          <div className="iec-member-kpi-header">
            <span className="iec-member-kpi-label">Recommendations Submitted</span>
            <span className="iec-member-kpi-icon">✓</span>
          </div>
          <div className="iec-member-kpi-value">
            {loading ? "..." : metrics?.recommendations_submitted ?? 0}
          </div>
          <div className="iec-member-kpi-subtext">Official member recommendations filed</div>
        </div>

        <div className="iec-member-kpi-card">
          <div className="iec-member-kpi-header">
            <span className="iec-member-kpi-label">Total Assigned / Available</span>
            <span className="iec-member-kpi-icon">⚖</span>
          </div>
          <div className="iec-member-kpi-value">
            {loading ? "..." : metrics?.total_available ?? 0}
          </div>
          <div className="iec-member-kpi-subtext">Cumulative studies in IEC pipeline</div>
        </div>
      </div>

      {/* RECENT PIPELINE STUDIES */}
      <div className="iec-member-table-card">
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(45, 75, 65, 0.5)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#f8fafc" }}>
              Active Clinical Studies in IEC Pipeline
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Studies verified by Secretariat and open for committee deliberation
            </span>
          </div>
          <button
            type="button"
            className="iec-btn-secondary"
            style={{ fontSize: "0.8rem", padding: "6px 12px" }}
            onClick={() => onSelectTab && onSelectTab("reviews")}
          >
            All Submissions →
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading studies in review pipeline...
          </div>
        ) : !metrics?.recent_studies || metrics.recent_studies.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            No studies currently in the IEC review queue. Studies will appear here once Secretariat document verification passes.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="iec-member-table">
              <thead>
                <tr>
                  <th>Study / Protocol ID</th>
                  <th>Clinical Study Title</th>
                  <th>Principal Researcher</th>
                  <th>Status</th>
                  <th>AI Quality Gate</th>
                  <th>Recommendation</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recent_studies.map((s) => (
                  <tr key={s.id || s.study_id}>
                    <td>
                      <strong style={{ color: "#d4af37" }}>{s.protocol_number || s.study_id}</strong>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{s.study_type}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", maxWidth: "340px" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                        Design: {s.study_design?.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: "#e2e8f0" }}>{s.researcher_name}</div>
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>
                      {s.quality_score != null ? (
                        <span style={{ color: s.quality_score >= 70 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          {s.quality_score}/100
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>Not evaluated</span>
                      )}
                    </td>
                    <td>{getRecBadge(s.latest_recommendation)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="iec-btn-gold"
                        style={{ padding: "5px 12px", fontSize: "0.78rem" }}
                        onClick={() => {
                          if (onSelectStudy) onSelectStudy(s.study_id);
                          if (onSelectTab) onSelectTab("study-review", s.study_id);
                        }}
                      >
                        {s.status === "ready_for_iec_review" ? "Start Review →" : "Examine Dossier →"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default IECMemberDashboardPage;
