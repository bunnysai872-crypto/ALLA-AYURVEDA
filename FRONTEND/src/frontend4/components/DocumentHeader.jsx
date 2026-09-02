import React from "react";
import { DOCUMENT_TYPE_LABELS } from "../utils/documentHelpers";

export default function DocumentHeader({
  studyTitle = "Study Documents",
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
}) {
  return (
    <div className="f4-header-container">
      {/* TOP ROW: BREADCRUMB & TITLE */}
      <div className="f4-header-top">
        <div className="f4-title-group">
          <div className="f4-eyebrow-row">
            <span className="f4-badge-tag">CLINICAL STUDY</span>
            {protocolNumber && (
              <span className="f4-protocol-tag">Protocol: {protocolNumber}</span>
            )}
          </div>
          <h1 className="f4-page-title">{studyTitle}</h1>
          <p className="f4-page-subtitle">
            Manage research documentation, upload protocol revisions, and audit readiness for IEC review.
          </p>
        </div>

        <div className="f4-header-actions">
          {onNavigateQualityGate && (
            <button
              type="button"
              className="f4-btn f4-btn-secondary f4-quality-nav-btn"
              onClick={onNavigateQualityGate}
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
            aria-label="Filter by Document Type"
          >
            <option value="">All Document Types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
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
            <option value="uploaded">Uploaded</option>
            <option value="quality_check_completed">Quality Passed</option>
            <option value="issues_found">Issues Found</option>
            <option value="draft">Draft</option>
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
