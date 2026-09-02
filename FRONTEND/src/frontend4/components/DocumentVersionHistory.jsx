import React, { useEffect, useState } from "react";
import { formatBytes, formatDate } from "../utils/documentHelpers";
import { documentApi } from "../services/documentApi";

export default function DocumentVersionHistory({
  isOpen,
  onClose,
  document,
  studyId,
}) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingVer, setDownloadingVer] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && document?.id && studyId) {
      loadVersions();
    }
  }, [isOpen, document?.id, studyId]);

  const loadVersions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await documentApi.getDocumentVersions(studyId, document.id);
      setVersions(res.versions || []);
    } catch (err) {
      setError(err.message || "Failed to load version history.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadVersion = async (ver) => {
    setDownloadingVer(ver.version_number);
    try {
      await documentApi.downloadDocumentVersion(
        studyId,
        document.id,
        ver.version_number,
        ver.original_filename
      );
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingVer(null);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <div className="f4-modal-overlay" onClick={onClose}>
      <div
        className="f4-modal-container f4-versions-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="f4-modal-header">
          <div>
            <h3>Version History</h3>
            <p>
              Revision timeline for <strong>{document.original_filename}</strong> (Current: v{document.version})
            </p>
          </div>
          <button
            type="button"
            className="f4-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="f4-modal-body">
          {error && (
            <div className="f4-alert f4-alert-error">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="f4-loading-container">
              <span className="f4-spinner" />
              <p>Loading version records...</p>
            </div>
          ) : versions.length === 0 ? (
            <p className="f4-empty-hint">No version records found.</p>
          ) : (
            <div className="f4-version-timeline">
              {versions.map((ver) => {
                const isCurrent = ver.version_number === document.version;
                return (
                  <div
                    key={ver.id || ver.version_number}
                    className={`f4-timeline-item ${isCurrent ? "is-current" : ""}`}
                  >
                    <div className="f4-timeline-marker">
                      <span className="f4-version-tag">v{ver.version_number}</span>
                    </div>

                    <div className="f4-timeline-content">
                      <div className="f4-timeline-header">
                        <div className="f4-ver-file-name">
                          <strong>{ver.original_filename}</strong>
                          {isCurrent && (
                            <span className="f4-current-badge">Latest Active</span>
                          )}
                        </div>
                        <span className="f4-ver-date">{formatDate(ver.created_at)}</span>
                      </div>

                      <div className="f4-ver-meta">
                        <span>Size: {formatBytes(ver.file_size)}</span>
                        <span>•</span>
                        <span>MIME: {ver.mime_type}</span>
                      </div>

                      {ver.change_summary && (
                        <p className="f4-ver-summary">
                          <em>Summary:</em> {ver.change_summary}
                        </p>
                      )}

                      <div className="f4-ver-actions">
                        <button
                          type="button"
                          className="f4-btn f4-btn-outline f4-btn-sm"
                          onClick={() => handleDownloadVersion(ver)}
                          disabled={downloadingVer === ver.version_number}
                        >
                          {downloadingVer === ver.version_number ? (
                            "Downloading..."
                          ) : (
                            <>
                              <span>⬇</span>
                              <span>Download v{ver.version_number}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="f4-modal-footer">
          <button type="button" className="f4-btn f4-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
