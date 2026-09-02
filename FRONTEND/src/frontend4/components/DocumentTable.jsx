import React from "react";
import {
  DOCUMENT_TYPE_LABELS,
  formatBytes,
  formatDate,
  getFileIcon,
} from "../utils/documentHelpers";
import DocumentStatusBadge from "./DocumentStatusBadge";
import DocumentCard from "./DocumentCard";

export default function DocumentTable({
  documents = [],
  isLoading = false,
  onViewDetails,
  onDownload,
  onOpenVersions,
  onOpenUploadVersion,
  onDeleteRequest,
  downloadingDocId,
}) {
  if (isLoading) {
    return (
      <div className="f4-loading-container">
        <span className="f4-spinner" />
        <p>Loading study documents from repository...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="f4-empty-state">
        <div className="f4-empty-icon-wrap">
          <span>📁</span>
        </div>
        <h3>No documents uploaded yet</h3>
        <p>
          Upload your study protocol, participant consent forms, and ethics documents to initiate research workflow.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="f4-table-responsive-wrapper">
        <table className="f4-document-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Version</th>
              <th>Status</th>
              <th>Size</th>
              <th>Uploaded Date</th>
              <th className="f4-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const isDownloading = downloadingDocId === doc.id;
              return (
                <tr key={doc.id} className="f4-table-row">
                  <td className="f4-td-name">
                    <div className="f4-file-cell" onClick={() => onViewDetails(doc)}>
                      <span className="f4-row-file-icon">{getFileIcon(doc.original_filename)}</span>
                      <div className="f4-row-name-text">
                        <strong>{doc.original_filename}</strong>
                        {doc.description && (
                          <small className="f4-row-desc-preview">{doc.description}</small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="f4-type-pill">
                      {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="f4-ver-badge-btn"
                      onClick={() => onOpenVersions(doc)}
                      title="Click to view all version records"
                    >
                      v{doc.version}
                    </button>
                  </td>
                  <td>
                    <DocumentStatusBadge status={doc.status} />
                  </td>
                  <td>
                    <span className="f4-size-text">{formatBytes(doc.file_size)}</span>
                  </td>
                  <td>
                    <span className="f4-date-text">{formatDate(doc.created_at)}</span>
                  </td>
                  <td className="f4-td-actions">
                    <div className="f4-row-actions">
                      <button
                        type="button"
                        className="f4-btn f4-btn-outline f4-btn-xs"
                        onClick={() => onDownload(doc)}
                        disabled={isDownloading}
                        title="Download latest version"
                      >
                        {isDownloading ? "..." : "⬇ Download"}
                      </button>
                      <button
                        type="button"
                        className="f4-btn f4-btn-secondary f4-btn-xs"
                        onClick={() => onOpenUploadVersion(doc)}
                        title="Upload a new version"
                      >
                        + Revise
                      </button>
                      <button
                        type="button"
                        className="f4-btn f4-btn-text f4-btn-xs"
                        onClick={() => onViewDetails(doc)}
                        title="View details"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className="f4-btn f4-btn-danger-outline f4-btn-xs"
                        onClick={() => onDeleteRequest(doc)}
                        title="Delete document"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET CARDS VIEW */}
      <div className="f4-mobile-cards-grid">
        {documents.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onViewDetails={onViewDetails}
            onDownload={onDownload}
            onOpenVersions={onOpenVersions}
            onOpenUploadVersion={onOpenUploadVersion}
            onDeleteRequest={onDeleteRequest}
            isDownloading={downloadingDocId === doc.id}
          />
        ))}
      </div>
    </>
  );
}
