import React from "react";
import { CANONICAL_DOCUMENT_CATEGORIES, DOCUMENT_TYPE_LABELS } from "../utils/documentHelpers";

export default function DocumentHeader({
  studyId = "",
  studyTitle = "Study Documents",
  studyStatus = "draft",
  principalInvestigator = "",
  protocolNumber = "",
  totalCount = 0,
  searchTerm = "",
  onSearchChange,
  selectedType = "",
  onTypeChange,
  selectedStatus = "",
  onStatusChange,
  sortBy = "newest",
  onSortChange,
  onOpenUpload,
  onNavigateQualityGate,
  studiesList = [],
  onSwitchStudy,
}) {
  return (
    <div className="f4-header-container">
      {/* TOP ROW: CLINICAL STUDY BANNER & TITLE */}
      <div className="f4-header-top">
        <div className="f4-title-group">
          <div className="f4-eyebrow-row">
            <span className="f4-badge-tag">CLINICAL STUDY</span>
            {studyId && (
              <span className="f4-study-id-badge" style={{ backgroundColor: "#065f46", color: "#ecfdf5", padding: "2px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                Study ID: #{studyId}
              </span>
            )}
            {studyStatus && (
              <span className="f4-study-status-badge" style={{ textTransform: "uppercase", backgroundColor: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600", border: "1px solid #d1d5db" }}>
                Status: {studyStatus}
              </span>
            )}
            {protocolNumber && (
              <span className="f4-protocol-tag">Protocol: {protocolNumber}</span>
            )}
            {principalInvestigator && (
              <span className="f4-pi-tag" style={{ color: "#4b5563", fontSize: "12px" }}>
                PI: <strong>{principalInvestigator}</strong>
              </span>
            )}
          </div>
          <h1 className="f4-page-title">{studyTitle}</h1>
          <p className="f4-page-subtitle">
            Clinical document repository with version tracking, metadata verification, and audit trail for IEC Secretariat & AI Quality Gate.
          </p>
        </div>

        <div className="f4-header-actions">
          {studiesList && studiesList.length > 1 && onSwitchStudy && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="f4-switch-study" style={{ fontSize: "12px", color: "#4b5563" }}>Study:</label>
              <select
                id="f4-switch-study"
                className="f4-select"
                style={{ maxWidth: "160px", fontSize: "12px", padding: "6px 8px" }}
                value={studyId}
                onChange={(e) => onSwitchStudy(e.target.value)}
              >
                {studiesList.map((s) => (
                  <option key={s.id ?? s.study_id} value={s.id ?? s.study_id}>
                    #{s.id ?? s.study_id}: {s.title?.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {onNavigateQualityGate && (
            <button
              type="button"
              className="f4-btn f4-btn-secondary f4-quality-nav-btn"
              onClick={onNavigateQualityGate}
              title="Proceed to AI Quality Gate"
            >
              <span>✦</span>
              <span>AI Quality Gate</span>
            </button>
          )}

          <button
            type="button"
            className="f4-btn f4-btn-primary"
            onClick={onOpenUpload}
          >
            <span>+</span>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="f4-controls-bar">
        <div className="f4-search-box">
          <span className="f4-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search documents by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="f4-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="f4-clear-search-btn"
              onClick={() => onSearchChange("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="f4-filters-group">
          {/* TYPE FILTER */}
          <select
            className="f4-select"
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            aria-label="Filter by Document Category"
          >
            <option value="">All Document Categories</option>
            {CANONICAL_DOCUMENT_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}
          <select
            className="f4-select"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="">All Statuses</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="REPLACEMENT_REQUIRED">Replacement Required</option>
          </select>

          {/* SORT FILTER */}
          <select
            className="f4-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort Order"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
    </div>
  );
}
