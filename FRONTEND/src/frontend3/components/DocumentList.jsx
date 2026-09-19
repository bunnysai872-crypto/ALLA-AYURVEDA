import React, { useState, useMemo } from "react";
import researcherApi from "../services/researcherApi";
import { formatDate, formatFileSize } from "../utils/formatters";
import DocumentVersionList from "./DocumentVersionList";

function getDocumentTypeBadgeClass(type) {
  switch (type) {
    case "protocol":
      return "f3-doc-type-protocol";
    case "informed_consent_form":
      return "f3-doc-type-icf";
    case "investigator_brochure":
      return "f3-doc-type-brochure";
    case "ethics_approval":
      return "f3-doc-type-ethics";
    default:
      return "f3-doc-type-other";
  }
}

function formatDocTypeLabel(type) {
  if (!type) return "Document";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * DocumentList Component
 * 
 * Interactive document repository table with filtering, search,
 * version tracking, download, metadata editing, and deletion.
 */
export function DocumentList({ documents, loading, error, onRefresh, onTriggerUpload }) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [versionModalDoc, setVersionModalDoc] = useState(null);
  const [editMetaDoc, setEditMetaDoc] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaError, setMetaError] = useState(null);

  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Filter and search
  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];

    return documents.filter((doc) => {
      // Type filter
      if (selectedTypeFilter !== "all" && doc.document_type !== selectedTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = doc.original_filename?.toLowerCase().includes(query);
        const matchesDesc = doc.description?.toLowerCase().includes(query);
        const matchesType = doc.document_type?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [documents, selectedTypeFilter, searchQuery]);

  // Handle Download
  const handleDownload = async (doc) => {
    try {
      const blob = await researcherApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.original_filename || `document-${doc.id}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  // Handle Metadata Edit
  const handleSaveMetadata = async (e) => {
    e.preventDefault();
    if (!editMetaDoc) return;

    setSavingMeta(true);
    setMetaError(null);
    try {
      await researcherApi.updateDocumentMetadata(editMetaDoc.id, {
        description: editDescription.trim(),
      });
      setEditMetaDoc(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setMetaError(err.message || "Failed to update document metadata.");
    } finally {
      setSavingMeta(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmDoc) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      await researcherApi.deleteDocument(deleteConfirmDoc.id);
      setDeleteConfirmDoc(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Search and Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Assets" },
            { id: "protocol", label: "Protocols" },
            { id: "informed_consent_form", label: "Consent (ICF)" },
            { id: "investigator_brochure", label: "Brochures" },
            { id: "ethics_approval", label: "Ethics Approvals" },
            { id: "other", label: "Other" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`f3-filter-tab ${selectedTypeFilter === tab.id ? "f3-filter-tab-active" : ""}`}
              onClick={() => setSelectedTypeFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            className="f3-input f3-search-input"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "240px", padding: "6px 12px", fontSize: "13px" }}
          />
          {onRefresh && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary f3-btn-sm"
              onClick={onRefresh}
              title="Refresh list"
            >
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="f3-loading-container" style={{ padding: "40px 0" }}>
          <div className="f3-loader-spinner"></div>
          <p>Loading document repository...</p>
        </div>
      ) : error ? (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "20px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Repository Load Error</strong>
            <p>{error}</p>
          </div>
          {onRefresh && (
            <button type="button" className="f3-btn f3-btn-secondary f3-btn-sm" onClick={onRefresh}>
              Retry
            </button>
          )}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="f3-empty-state-card">
          <div className="f3-empty-state-icon">📂</div>
          <h3>No Documents Found</h3>
          <p>
            {searchQuery
              ? `No documents matching "${searchQuery}". Try adjusting your search query.`
              : "No regulatory documents have been uploaded for this study yet."}
          </p>
          {onTriggerUpload && !searchQuery && (
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-primary"
                onClick={onTriggerUpload}
              >
                + Upload First Document
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Document Table */
        <div className="f3-table-wrapper">
          <table className="f3-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Classification</th>
                <th>Version</th>
                <th>Size</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ color: "var(--f3-text-primary)" }}>
                        {doc.original_filename}
                      </strong>
                      {doc.description && (
                        <span style={{ fontSize: "12px", color: "var(--f3-text-muted)" }}>
                          {doc.description}
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <span className={`f3-doc-type-badge ${getDocumentTypeBadgeClass(doc.document_type)}`}>
                      {formatDocTypeLabel(doc.document_type)}
                    </span>
                  </td>

                  <td>
                    <span className="f3-doc-version-pill">
                      v{doc.current_version || 1}.0
                    </span>
                  </td>

                  <td style={{ fontSize: "13px", color: "var(--f3-text-secondary)" }}>
                    {formatFileSize(doc.file_size)}
                  </td>

                  <td style={{ fontSize: "13px", color: "var(--f3-text-secondary)" }}>
                    {formatDate(doc.created_at)}
                  </td>

                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          doc.status === "issues_found"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(34, 197, 94, 0.15)",
                        color:
                          doc.status === "issues_found"
                            ? "#ef4444"
                            : "#4ade80",
                      }}
                    >
                      {doc.status === "issues_found" ? "⚠️ Issues Found" : "✓ Active"}
                    </span>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <div className="f3-doc-actions" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="f3-btn f3-btn-secondary f3-btn-sm"
                        onClick={() => handleDownload(doc)}
                        title="Download Document"
                      >
                        Download ↓
                      </button>

                      <button
                        type="button"
                        className="f3-btn f3-btn-secondary f3-btn-sm"
                        onClick={() => setVersionModalDoc(doc)}
                        title="View Version Timeline & Upload Revision"
                      >
                        Versions ({doc.current_version || 1})
                      </button>

                      <button
                        type="button"
                        className="f3-btn f3-btn-ghost f3-btn-sm"
                        onClick={() => {
                          setEditMetaDoc(doc);
                          setEditDescription(doc.description || "");
                        }}
                        title="Edit remarks"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="f3-btn f3-btn-ghost f3-btn-sm f3-btn-delete"
                        onClick={() => setDeleteConfirmDoc(doc)}
                        title="Delete document"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Version History Modal */}
      {versionModalDoc && (
        <DocumentVersionList
          document={versionModalDoc}
          onClose={() => setVersionModalDoc(null)}
          onVersionUploaded={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Edit Metadata Modal */}
      {editMetaDoc && (
        <div className="f3-modal-overlay">
          <div className="f3-modal-container" style={{ maxWidth: "480px" }}>
            <div className="f3-modal-header">
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                Edit Document Remarks
              </h3>
              <button
                type="button"
                className="f3-btn f3-btn-ghost f3-btn-sm"
                onClick={() => setEditMetaDoc(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMetadata}>
              <div className="f3-modal-body">
                {metaError && (
                  <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "12px" }}>
                    <p style={{ margin: 0 }}>{metaError}</p>
                  </div>
                )}
                <div className="f3-form-group">
                  <label htmlFor="meta-desc">Description / Audit Notes</label>
                  <textarea
                    id="meta-desc"
                    className="f3-textarea"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Enter descriptive remarks for this document..."
                  />
                </div>
              </div>

              <div className="f3-modal-footer">
                <button
                  type="button"
                  className="f3-btn f3-btn-secondary"
                  onClick={() => setEditMetaDoc(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="f3-btn f3-btn-primary"
                  disabled={savingMeta}
                >
                  {savingMeta ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDoc && (
        <div className="f3-modal-overlay">
          <div className="f3-modal-container" style={{ maxWidth: "450px" }}>
            <div className="f3-modal-header">
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--f3-status-offline)" }}>
                Confirm Document Deletion
              </h3>
              <button
                type="button"
                className="f3-btn f3-btn-ghost f3-btn-sm"
                onClick={() => setDeleteConfirmDoc(null)}
              >
                ✕
              </button>
            </div>

            <div className="f3-modal-body">
              {deleteError && (
                <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "12px" }}>
                  <p style={{ margin: 0 }}>{deleteError}</p>
                </div>
              )}
              <p style={{ fontSize: "14px", color: "var(--f3-text-secondary)" }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: "var(--f3-text-primary)" }}>
                  "{deleteConfirmDoc.original_filename}"
                </strong>
                ?
              </p>
              <p style={{ fontSize: "12px", color: "var(--f3-text-muted)" }}>
                This will soft-delete the document and all associated version records from study #{deleteConfirmDoc.study_id}.
              </p>
            </div>

            <div className="f3-modal-footer">
              <button
                type="button"
                className="f3-btn f3-btn-secondary"
                onClick={() => setDeleteConfirmDoc(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="f3-btn f3-btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
