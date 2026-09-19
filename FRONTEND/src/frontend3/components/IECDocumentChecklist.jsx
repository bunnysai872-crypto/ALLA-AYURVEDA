import React from "react";
import IECStatusBadge from "./IECStatusBadge";

export function IECDocumentChecklist({ checklist, onSelectDocument, onDownloadDocument }) {
  if (!checklist || checklist.length === 0) {
    return (
      <div className="iec-empty-state">
        <span className="iec-empty-icon">📁</span>
        <p>No document checklist available for this study.</p>
      </div>
    );
  }

  return (
    <div className="iec-checklist-grid">
      {checklist.map((item) => {
        const doc = item.document;
        return (
          <div key={item.document_type} className="iec-checklist-card">
            <div className="iec-checklist-top">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <h5 className="iec-checklist-title">{item.label}</h5>
                  {item.mandatory && (
                    <span
                      style={{
                        fontSize: "0.68rem",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      Mandatory
                    </span>
                  )}
                </div>
                <p className="iec-checklist-desc">{item.description}</p>
              </div>
              <IECStatusBadge status={item.verification_status} type="document" />
            </div>

            <div className="iec-checklist-meta">
              <span>
                {item.is_uploaded ? (
                  <strong style={{ color: "#6ee7b7" }}>
                    📄 {doc?.original_filename || "Uploaded"} (v{doc?.version || 1})
                  </strong>
                ) : (
                  <span style={{ color: "#94a3b8" }}>Not yet uploaded</span>
                )}
              </span>

              {item.is_uploaded && doc && (
                <div style={{ display: "flex", gap: "6px" }}>
                  {onDownloadDocument && (
                    <button
                      type="button"
                      className="iec-btn-secondary"
                      style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                      onClick={() => onDownloadDocument(doc.id, doc.original_filename)}
                      title="Download file"
                    >
                      Download
                    </button>
                  )}
                  {onSelectDocument && (
                    <button
                      type="button"
                      className="iec-btn-primary"
                      style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                      onClick={() => onSelectDocument(doc)}
                      title="Verify or flag this document"
                    >
                      Verify
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default IECDocumentChecklist;
