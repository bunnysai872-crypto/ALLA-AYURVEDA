import React from "react";
import IECStatusBadge from "./IECStatusBadge";

export function IECSubmissionQueue({
  submissions,
  onSelectStudy,
  onOpenVerification,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  readinessFilter,
  onReadinessFilterChange,
  docFilter,
  onDocFilterChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Search & Filter Toolbar */}
      <div className="iec-toolbar">
        <input
          type="text"
          className="iec-search-input"
          placeholder="Search by Title, Study ID, or Investigator..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <div className="iec-filter-group">
          <select
            className="iec-select"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            title="Filter by Workflow Status"
          >
            <option value="all">All Workflow States</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="verification_completed">Verification Complete</option>
            <option value="ready_for_iec_review">Ready for IEC</option>
            <option value="correction_requested">Correction Requested</option>
          </select>

          <select
            className="iec-select"
            value={readinessFilter}
            onChange={(e) => onReadinessFilterChange(e.target.value)}
            title="Filter by IEC Readiness"
          >
            <option value="all">All Readiness</option>
            <option value="ready">Ready for IEC Review</option>
            <option value="not_ready">Not Ready</option>
          </select>

          <select
            className="iec-select"
            value={docFilter}
            onChange={(e) => onDocFilterChange(e.target.value)}
            title="Filter by Document Verification"
          >
            <option value="all">All Document Statuses</option>
            <option value="verified">All Docs Verified</option>
            <option value="pending">Pending Verification</option>
            <option value="correction">Correction Needed</option>
          </select>

          <select
            className="iec-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            title="Sort Submissions"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="iec-table-wrapper">
        <table className="iec-table">
          <thead>
            <tr>
              <th>Study ID</th>
              <th>Study Title</th>
              <th>Researcher</th>
              <th>Submission Date</th>
              <th>Current Status</th>
              <th>AI Quality Gate</th>
              <th>Document Verification</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px 16px", color: "#94a3b8" }}>
                  No study submissions match your filter criteria.
                </td>
              </tr>
            ) : (
              submissions.map((item) => {
                const docStats = item.document_status || {};
                const qg = item.quality_gate || {};
                const submissionDate = item.submission_date
                  ? item.submission_date.slice(0, 10)
                  : item.created_at
                  ? item.created_at.slice(0, 10)
                  : "Recent";

                return (
                  <tr key={item.id || item.study_id}>
                    <td>
                      <strong style={{ color: "#d4af37", fontSize: "0.84rem" }}>
                        {item.study_id || item.protocol_number}
                      </strong>
                    </td>
                    <td>
                      <div className="iec-study-title-cell">
                        <span
                          className="iec-study-title-link"
                          onClick={() => onSelectStudy && onSelectStudy(item.study_id || item.id)}
                        >
                          {item.title}
                        </span>
                        <span className="iec-study-meta-sub">
                          {item.study_type || "Ayurveda"} • {item.study_design || "Clinical"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "#f1f5f9" }}>
                          {item.researcher?.full_name || "Investigator"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                          {item.researcher?.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                        {submissionDate}
                      </span>
                    </td>
                    <td>
                      <IECStatusBadge status={item.workflow_status} type="study" />
                    </td>
                    <td>
                      {qg.score !== null && qg.score !== undefined ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 700, color: qg.score >= 70 ? "#34d399" : "#f87171" }}>
                            {qg.score}/100
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            ({qg.status})
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.82rem" }}>
                        <strong style={{ color: docStats.verified === docStats.total && docStats.total > 0 ? "#34d399" : "#f1f5f9" }}>
                          {docStats.verified || 0}/{docStats.total || 0}
                        </strong>{" "}
                        verified
                        {docStats.correction_required > 0 && (
                          <div style={{ color: "#f87171", fontSize: "0.74rem" }}>
                            ⚠ {docStats.correction_required} need fix
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="iec-btn-secondary"
                          style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                          onClick={() => onSelectStudy && onSelectStudy(item.study_id || item.id)}
                          title="View Study Details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="iec-btn-primary"
                          style={{ padding: "5px 10px", fontSize: "0.78rem" }}
                          onClick={() => onOpenVerification && onOpenVerification(item.study_id || item.id)}
                          title="Verify Documents"
                        >
                          Verify Documents
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IECSubmissionQueue;
