import React from "react";
import IECStatusBadge from "./IECStatusBadge";

export function IECDocumentVerificationItem({
  document,
  onVerify,
  onCorrection,
  onMarkMissing,
  onDownload,
}) {
  if (!document) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "16px 18px",
        background: "rgba(22, 34, 28, 0.8)",
        border: "1px solid rgba(45, 75, 60, 0.5)",
        borderRadius: "10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>📄</span>
            <strong style={{ fontSize: "0.95rem", color: "#f8fafc" }}>
              {document.original_filename || document.document_name}
            </strong>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 6px",
                background: "rgba(212, 175, 55, 0.15)",
                color: "#d4af37",
                borderRadius: "4px",
                fontWeight: 600,
              }}
            >
              v{document.version || 1}
            </span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
            Type: <strong style={{ color: "#cbd5e1" }}>{document.document_type}</strong> • Size:{" "}
            {formatFileSize(document.file_size)} • Uploaded: {document.created_at?.slice(0, 10) || "Recent"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <IECStatusBadge status={document.status} type="document" />

          {onDownload && (
            <button
              type="button"
              className="iec-btn-secondary"
              style={{ padding: "6px 10px", fontSize: "0.78rem" }}
              onClick={() => onDownload(document.id, document.original_filename)}
              title="Download Document"
            >
              Download
            </button>
          )}

          {onVerify && (
            <button
              type="button"
              className="iec-btn-primary"
              style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              onClick={() => onVerify(document)}
              title="Mark Verified"
            >
              ✓ Verify
            </button>
          )}

          {onCorrection && (
            <button
              type="button"
              className="iec-btn-warning"
              style={{
                padding: "6px 10px",
                fontSize: "0.78rem",
                background: "rgba(245, 158, 11, 0.15)",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "#fbbf24",
              }}
              onClick={() => onCorrection(document)}
              title="Request Correction"
            >
              ⚠ Correction
            </button>
          )}

          {onMarkMissing && (
            <button
              type="button"
              className="iec-btn-danger"
              style={{ padding: "6px 10px", fontSize: "0.78rem" }}
              onClick={() => onMarkMissing(document)}
              title="Mark Missing"
            >
              ✕ Missing
            </button>
          )}
        </div>
      </div>

      {document.description && (
        <div
          style={{
            background: "rgba(13, 21, 18, 0.7)",
            borderLeft: "3px solid rgba(212, 175, 55, 0.5)",
            padding: "8px 12px",
            borderRadius: "0 6px 6px 0",
            fontSize: "0.8rem",
            color: "#cbd5e1",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong style={{ color: "#d4af37", display: "block", marginBottom: "3px" }}>
            Audit & Verification History:
          </strong>
          {document.description}
        </div>
      )}
    </div>
  );
}

export default IECDocumentVerificationItem;
