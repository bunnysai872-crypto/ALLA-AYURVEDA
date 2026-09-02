import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentApi } from "../services/documentApi";
import {
  DOCUMENT_TYPE_LABELS,
  formatBytes,
  formatDate,
  getFileIcon,
} from "../utils/documentHelpers";
import DocumentStatusBadge from "../components/DocumentStatusBadge";
import DocumentUpload from "../components/DocumentUpload";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DocumentDetailsPage() {
  const { studyId = "1", documentId } = useParams();
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadVersionOpen, setIsUploadVersionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchDocument = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await documentApi.getDocumentDetails(studyId, documentId);
      setDocument(res.document);
    } catch (err) {
      setError(err.message || "Failed to load document details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchDocument();
    }
  }, [studyId, documentId]);

  const handleDownloadLatest = async () => {
    try {
      await documentApi.downloadDocument(studyId, document.id, document.original_filename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDownloadVersion = async (ver) => {
    try {
      await documentApi.downloadDocumentVersion(
        studyId,
        document.id,
        ver.version_number,
        ver.original_filename
      );
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await documentApi.deleteDocument(studyId, document.id);
      navigate(`/researcher/studies/${studyId}/documents`);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
      setIsDeleting(false);
    }
  };

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await documentApi.runDocumentQualityCheck(studyId, document.id);
      setVerifyResult(res);
      fetchDocument();
    } catch (err) {
      alert(`Verification check failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="f4-page-wrapper">
        <div className="f4-loading-container">
          <span className="f4-spinner" />
          <p>Loading document record...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="f4-page-wrapper">
        <div className="f4-alert f4-alert-error">
          <span>⚠</span>
          <div className="f4-alert-text">
            <strong>Error:</strong> {error || "Document not found."}
          </div>
          <button
            type="button"
            className="f4-btn f4-btn-secondary f4-btn-xs"
            onClick={() => navigate(`/researcher/studies/${studyId}/documents`)}
          >
            ← Back to Study Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="f4-page-wrapper">
      <div className="f4-page-content">
        {/* TOP NAV BAR */}
        <div className="f4-details-nav">
          <button
            type="button"
            className="f4-btn-text"
            onClick={() => navigate(`/researcher/studies/${studyId}/documents`)}
          >
            ← Back to Documents
          </button>
          <div className="f4-details-nav-actions">
            <button
              type="button"
              className="f4-btn f4-btn-outline f4-btn-sm"
              onClick={handleDownloadLatest}
            >
              ⬇ Download Latest (v{document.version})
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-primary f4-btn-sm"
              onClick={() => setIsUploadVersionOpen(true)}
            >
              + Upload New Version
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-secondary f4-btn-sm"
              onClick={handleRunVerification}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "✦ Verify Quality"}
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-danger-outline f4-btn-sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              🗑 Delete
            </button>
          </div>
        </div>

        {/* MAIN DOCUMENT CARD */}
        <div className="f4-details-hero-card">
          <div className="f4-hero-file-icon">
            {getFileIcon(document.original_filename)}
          </div>
          <div className="f4-hero-text">
            <div className="f4-hero-badges-row">
              <span className="f4-type-pill">
                {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
              </span>
              <span className="f4-version-pill">Current Version: v{document.version}</span>
              <DocumentStatusBadge status={document.status} />
            </div>
            <h2>{document.original_filename}</h2>
            {document.description && (
              <p className="f4-hero-desc">{document.description}</p>
            )}
          </div>
        </div>

        {/* VERIFICATION RESULT BANNER */}
        {verifyResult && (
          <div className={`f4-alert ${verifyResult.issues?.length ? "f4-alert-warning" : "f4-alert-success"}`}>
            <span>{verifyResult.issues?.length ? "⚠" : "✓"}</span>
            <div>
              <strong>Quality Verification Result:</strong> {verifyResult.status?.replace("_", " ")}
              <p>{verifyResult.text_extraction?.note}</p>
            </div>
          </div>
        )}

        {/* METADATA SUMMARY GRID */}
        <div className="f4-details-section">
          <h3>Document Specifications</h3>
          <div className="f4-meta-grid">
            <div className="f4-meta-item">
              <span className="f4-meta-label">File Size</span>
              <span className="f4-meta-val">{formatBytes(document.file_size)}</span>
            </div>
            <div className="f4-meta-item">
              <span className="f4-meta-label">MIME Type</span>
              <span className="f4-meta-val">{document.mime_type}</span>
            </div>
            <div className="f4-meta-item">
              <span className="f4-meta-label">Initial Upload</span>
              <span className="f4-meta-val">{formatDate(document.created_at)}</span>
            </div>
            <div className="f4-meta-item">
              <span className="f4-meta-label">Last Revision</span>
              <span className="f4-meta-val">{formatDate(document.updated_at)}</span>
            </div>
          </div>
        </div>

        {/* VERSION TIMELINE */}
        <div className="f4-details-section">
          <h3>Complete Version History</h3>
          <div className="f4-version-timeline">
            {(document.versions || []).map((ver) => {
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
                      <strong>{ver.original_filename}</strong>
                      <span className="f4-ver-date">{formatDate(ver.created_at)}</span>
                    </div>
                    <div className="f4-ver-meta">
                      <span>Size: {formatBytes(ver.file_size)}</span>
                      <span>•</span>
                      <span>MIME: {ver.mime_type}</span>
                    </div>
                    {ver.change_summary && (
                      <p className="f4-ver-summary">{ver.change_summary}</p>
                    )}
                    <button
                      type="button"
                      className="f4-btn f4-btn-outline f4-btn-xs"
                      onClick={() => handleDownloadVersion(ver)}
                    >
                      ⬇ Download v{ver.version_number}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* UPLOAD REVISION MODAL */}
        <DocumentUpload
          isOpen={isUploadVersionOpen}
          onClose={() => setIsUploadVersionOpen(false)}
          isVersionUpload={true}
          targetDocument={document}
          studyId={studyId}
          uploadFunction={(formData) =>
            documentApi.uploadDocumentVersion(studyId, document.id, formData)
          }
          onUploadSuccess={() => {
            fetchDocument();
          }}
        />

        {/* DELETE CONFIRM DIALOG */}
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Delete Document"
          message={`Are you sure you want to delete '${document.original_filename}'?`}
          confirmText="Yes, Delete"
          isDanger={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteOpen(false)}
        />
      </div>
    </div>
  );
}
