import React, { useState, useEffect, useCallback } from "react";
import iecMemberApi from "../services/iecMemberApi";

export function IECMemberReviewQueuePage({ onSelectTab, onSelectStudy }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await iecMemberApi.getReviews({
        search: searchTerm,
        status: statusFilter,
        sort: sortBy,
      });
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.error("Error fetching IEC Member review queue:", err);
      setError(err.message || "Failed to load study review queue.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
            <span>📋</span> IEC Review Queue & Submissions
          </h2>
          <p className="iec-member-subtitle">
            Complete registry of studies eligible for Institutional Ethics Committee scrutiny
          </p>
        </div>

        <button
          type="button"
          className="iec-btn-secondary"
          onClick={fetchReviews}
          disabled={loading}
        >
          ↻ Refresh Queue
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", color: "#f87171", marginBottom: "20px" }}>
          ⚠ {error}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="iec-member-filter-bar">
        <div className="iec-member-search-box">
          <span className="iec-member-search-icon">🔍</span>
          <input
            type="text"
            className="iec-member-search-input"
            placeholder="Search by study title, protocol ID, researcher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="iec-member-tabs-row">
          <button
            type="button"
            className={`iec-member-tab-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Submissions
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${statusFilter === "ready_for_iec_review" ? "active" : ""}`}
            onClick={() => setStatusFilter("ready_for_iec_review")}
          >
            Ready for IEC
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${statusFilter === "under_iec_review" ? "active" : ""}`}
            onClick={() => setStatusFilter("under_iec_review")}
          >
            In Review
          </button>
          <button
            type="button"
            className={`iec-member-tab-btn ${statusFilter === "iec_recommendation_submitted" ? "active" : ""}`}
            onClick={() => setStatusFilter("iec_recommendation_submitted")}
          >
            Recommendation Submitted
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Sort:</span>
          <select
            className="iec-domain-rating-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Study Title A-Z</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="iec-member-table-card">
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Loading review queue...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            No studies matching the selected filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="iec-member-table">
              <thead>
                <tr>
                  <th>Study / Protocol ID</th>
                  <th>Clinical Study Details</th>
                  <th>Researcher</th>
                  <th>Status</th>
                  <th>Docs Verified</th>
                  <th>AI Quality</th>
                  <th>Recommendation</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((s) => (
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
                      <div style={{ color: "#e2e8f0" }}>{s.researcher?.full_name || "Unknown"}</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{s.researcher?.email}</div>
                    </td>
                    <td>{getStatusBadge(s.status)}</td>
                    <td>
                      <span style={{ color: "#cbd5e1", fontSize: "0.82rem" }}>
                        {s.verified_documents_count}/{s.documents_count}
                      </span>
                    </td>
                    <td>
                      {s.quality_score != null ? (
                        <span style={{ color: s.quality_score >= 70 ? "#34d399" : "#f87171", fontWeight: 600 }}>
                          {s.quality_score}/100
                        </span>
                      ) : (
                        <span style={{ color: "#64748b" }}>N/A</span>
                      )}
                    </td>
                    <td>{getRecBadge(s.latest_recommendation)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="iec-btn-primary"
                        style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        onClick={() => {
                          if (onSelectStudy) onSelectStudy(s.study_id);
                          if (onSelectTab) onSelectTab("study-review", s.study_id);
                        }}
                      >
                        Review Study →
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

export default IECMemberReviewQueuePage;
