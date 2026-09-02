import React from "react";
import {
  DOCUMENT_TYPE_LABELS,
  formatBytes,
  formatDate,
  getFileIcon,
} from "../utils/documentHelpers";
import DocumentStatusBadge from "./DocumentStatusBadge";

export default function DocumentCard({
  document,
  onViewDetails,
  onDownload,
  onOpenVersions,
  onOpenUploadVersion,
  onDeleteRequest,
  isDownloading,
}) {
  return (
    <div className="f4-doc-card">
      <div className="f4-doc-card-top">
        <div className="f4-doc-card-title-group">
          <span className="f4-card-file-icon">{getFileIcon(document.original_filename)}</span>
          <div>
            <h4 className="f4-card-doc-name" onClick={() => onViewDetails(document)}>
              {document.original_filename}
            </h4>
            <span className="f4-card-type-label">
              {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
            </span>
          </div>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="f4-card-meta-row">
        <span>Version: <strong>v{document.version}</strong></span>
        <span>•</span>
        <span>Size: {formatBytes(document.file_size)}</span>
        <span>•</span>
        <span>{formatDate(document.created_at)}</span>
      </div>

      {document.description && (
        <p className="f4-card-description">{document.description}</p>
      )}

      <div className="f4-card-actions">
        <button
          type="button"
          className="f4-btn f4-btn-outline f4-btn-xs"
          onClick={() => onDownload(document)}
          disabled={isDownloading}
        >
          {isDownloading ? "Downloading..." : "⬇ Download"}
        </button>
        <button
          type="button"
          className="f4-btn f4-btn-secondary f4-btn-xs"
          onClick={() => onOpenVersions(document)}
        >
          🕒 Versions ({document.version})
        </button>
        <button
          type="button"
          className="f4-btn f4-btn-primary f4-btn-xs"
          onClick={() => onOpenUploadVersion(document)}
        >
          + Revise
        </button>
        <button
          type="button"
          className="f4-btn f4-btn-danger-outline f4-btn-xs"
          onClick={() => onDeleteRequest(document)}
          title="Delete Document"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
