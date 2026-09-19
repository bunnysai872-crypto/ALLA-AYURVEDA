import React, { useState, useEffect } from "react";
import researcherApi from "../services/researcherApi";
import { formatDateTime, formatFileSize } from "../utils/formatters";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * DocumentVersionList Component
 * 
 * Displays historical version timeline for a study document,
 * allows version downloads, and provides an interface to upload new versions.
 */
export function DocumentVersionList({ document, onClose, onVersionUploaded }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Version Upload State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFile, setNewFile] = useState(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Load versions
  useEffect(() => {
    if (!document?.id) return;
    let isCurrent = true;

    async function loadVersions() {
      setLoading(true);
      setError(null);
      try {
        const data = await researcherApi.listDocumentVersions(document.id);
        if (isCurrent) {
          const list = (data && (data.versions || data.data)) || (Array.isArray(data) ? data : []);
          setVersions(list);
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message || "Failed to load document versions.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadVersions();
    return () => {
      isCurrent = false;
    };
  }, [document?.id]);

  // Handle Version Download
  const handleDownloadVersion = async (versionNumber, filename) => {
    try {
      const blob = await researcherApi.downloadDocumentVersion(document.id, versionNumber);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = filename || `document-v${versionNumber}`;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  // Handle New Version Upload
  const handleSubmitNewVersion = async (e) => {
    e.preventDefault();
    if (!newFile) {
      setUploadError("Please select a revised file to upload.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", newFile);
    if (changeSummary.trim()) {
      formData.append("change_summary", changeSummary.trim());
    }

    try {
      await researcherApi.uploadDocumentVersion(document.id, formData);
      setUploadSuccess(true);
      setNewFile(null);
      setChangeSummary("");
      setShowUploadForm(false);

      // Reload versions
      const updated = await researcherApi.listDocumentVersions(document.id);
      const list = (updated && (updated.versions || updated.data)) || (Array.isArray(updated) ? updated : []);
      setVersions(list);

      if (onVersionUploaded) {
        onVersionUploaded();
      }
    } catch (err) {
      setUploadError(err.message || "Failed to upload new document version.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="f3-modal-overlay">
      <div className="f3-modal-container" style={{ maxWidth: "620px" }}>
        {/* Header */}
        <div className="f3-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>📜</span>
            <div>
              <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0 }}>
                Version History — {document?.original_filename}
              </h2>
              <span style={{ fontSize: "12px", color: "var(--f3-text-muted)" }}>
                Document ID #{document?.id} • Current Version: v{document?.current_version || 1}
              </span>
            </div>
          </div>
          <button type="button" className="f3-btn f3-btn-ghost f3-btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="f3-modal-body">
          {error && (
            <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "16px" }}>
              <span className="f3-alert-icon">⚠️</span>
              <div className="f3-alert-content">
                <strong>Error Loading Versions</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="f3-alert-box f3-alert-success" style={{ marginBottom: "16px" }}>
              <span className="f3-alert-icon">✓</span>
              <div className="f3-alert-content">
                <strong>Version Uploaded</strong>
                <p>New version was uploaded and recorded in the audit trail.</p>
              </div>
            </div>
          )}

          {/* Toggle Upload New Version Form */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "14px", margin: 0, color: "var(--f3-text-secondary)" }}>
              Revision History ({versions.length})
            </h4>
            <button
              type="button"
              className="f3-btn f3-btn-secondary f3-btn-sm"
              onClick={() => {
                setShowUploadForm((prev) => !prev);
                setUploadError(null);
              }}
            >
              {showUploadForm ? "Cancel New Version" : "+ Upload New Version"}
            </button>
          </div>

          {/* New Version Upload Form */}
          {showUploadForm && (
            <form
              onSubmit={handleSubmitNewVersion}
              style={{
                background: "rgba(159, 207, 139, 0.04)",
                border: "1px dashed var(--f3-border)",
                borderRadius: "var(--f3-radius-md)",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h5 style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--f3-brand-green-light)" }}>
                Upload Revision (will increment to v{(document?.current_version || 1) + 1})
              </h5>

              {uploadError && (
                <div className="f3-alert-box f3-alert-error" style={{ padding: "8px 12px", marginBottom: "12px" }}>
                  <p style={{ margin: 0, fontSize: "12px" }}>{uploadError}</p>
                </div>
              )}

              <div className="f3-form-group" style={{ marginBottom: "12px" }}>
                <label htmlFor="new-ver-file" style={{ fontSize: "12px" }}>Select Revised File *</label>
                <input
                  id="new-ver-file"
                  type="file"
                  className="f3-input"
                  style={{ padding: "6px" }}
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="f3-form-group" style={{ marginBottom: "12px" }}>
                <label htmlFor="new-ver-summary" style={{ fontSize: "12px" }}>Change Summary / Revision Notes</label>
                <input
                  id="new-ver-summary"
                  type="text"
                  className="f3-input"
                  placeholder="e.g. Updated Section 4 dosage guidelines per IEC feedback"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button
                  type="button"
                  className="f3-btn f3-btn-ghost f3-btn-sm"
                  onClick={() => setShowUploadForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="f3-btn f3-btn-primary f3-btn-sm"
                  disabled={uploading || !newFile}
                >
                  {uploading ? "Uploading..." : "Save Revision"}
                </button>
              </div>
            </form>
          )}

          {/* Versions Timeline */}
          {loading ? (
            <div className="f3-loading-container" style={{ padding: "30px 0" }}>
              <div className="f3-loader-spinner"></div>
              <p style={{ fontSize: "13px" }}>Loading version history...</p>
            </div>
          ) : versions.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--f3-text-muted)", textAlign: "center", padding: "20px" }}>
              No version history records found.
            </p>
          ) : (
            <div className="f3-version-timeline">
              {versions.map((ver) => {
                const isCurrent = ver.version_number === document?.current_version;
                return (
                  <div
                    key={ver.id || ver.version_number}
                    className={`f3-version-item ${isCurrent ? "f3-version-item-active" : ""}`}
                  >
                    <div className="f3-version-left">
                      <div className="f3-version-num">
                        <span>v{ver.version_number}.0</span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: "10px",
                              background: "rgba(34, 197, 94, 0.15)",
                              color: "#4ade80",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <span className="f3-version-meta">
                        {ver.original_filename} • {formatFileSize(ver.file_size)} • {formatDateTime(ver.created_at)}
                      </span>
                      {ver.change_summary && (
                        <span className="f3-version-summary">
                          "{ver.change_summary}"
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="f3-btn f3-btn-secondary f3-btn-sm"
                      onClick={() => handleDownloadVersion(ver.version_number, ver.original_filename)}
                      title={`Download v${ver.version_number}`}
                    >
                      Download ↓
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="f3-modal-footer">
          <button type="button" className="f3-btn f3-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocumentVersionList;
