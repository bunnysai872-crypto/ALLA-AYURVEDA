import React, { useState } from "react";
import {
  CANONICAL_DOCUMENT_CATEGORIES,
  DOCUMENT_TYPE_LABELS,
  formatBytes,
  formatDate,
  getFileIcon,
} from "../utils/documentHelpers";
import DocumentStatusBadge from "./DocumentStatusBadge";
import { documentApi } from "../services/documentApi";

export default function DocumentDetailsPanel({
  isOpen,
  onClose,
  document,
  studyId,
  onOpenUploadVersion,
  onOpenVersions,
  onDeleteRequest,
  onDocumentUpdated,
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(document?.description || "");
  const [editType, setEditType] = useState(document?.document_type || "other");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !document) return null;

  const handleRunDocCheck = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      const res = await documentApi.runDocumentQualityCheck(studyId, document.id);
      setCheckResult(res);
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      alert(`Quality verification failed: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      await documentApi.updateDocumentMetadata(studyId, document.id, {
        description: editDescription,
        document_type: editType,
      });
      setIsEditing(false);
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="f4-drawer-overlay" onClick={onClose}>
      <div className="f4-drawer-container" onClick={(e) => e.stopPropagation()}>
        {/* DRAWER HEADER */}
        <div className="f4-drawer-header">
          <div className="f4-drawer-title-row">
            <span className="f4-drawer-icon">{getFileIcon(document.original_filename)}</span>
            <div>
              <h3>{document.original_filename}</h3>
              <div className="f4-drawer-badges">
                <span className="f4-doc-type-pill">
                  {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                </span>
                <span className="f4-version-pill">v{document.version}</span>
                <DocumentStatusBadge status={document.status} />
              </div>
            </div>
          </div>
          <button type="button" className="f4-modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* DRAWER BODY */}
        <div className="f4-drawer-body">
          {/* QUICK ACTIONS ROW */}
          <div className="f4-drawer-actions-bar">
            <button
              type="button"
              className="f4-btn f4-btn-primary f4-btn-sm"
              onClick={() => {
                onClose();
                onOpenUploadVersion(document);
              }}
            >
              <span>+</span>
              <span>Upload Revision</span>
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-outline f4-btn-sm"
              onClick={() => {
                onClose();
                onOpenVersions(document);
              }}
            >
              <span>🕒</span>
              <span>Version Timeline</span>
            </button>
            <button
              type="button"
              className="f4-btn f4-btn-secondary f4-btn-sm"
              onClick={handleRunDocCheck}
              disabled={isChecking}
            >
              {isChecking ? "Verifying..." : "✦ Verify Quality"}
            </button>
          </div>

          {/* CHECK RESULT BANNER */}
          {checkResult && (
            <div className={`f4-alert ${checkResult.issues?.length ? "f4-alert-warning" : "f4-alert-success"}`}>
              <span>{checkResult.issues?.length ? "⚠" : "✓"}</span>
              <div>
                <strong>Document Verification Completed</strong>
                <p>Status: {checkResult.status?.replace("_", " ")}</p>
                <small>{checkResult.text_extraction?.note}</small>
              </div>
            </div>
          )}

          {/* METADATA CARDS */}
          <div className="f4-meta-section">
            <h4>Document Attributes</h4>
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
                <span className="f4-meta-label">Uploaded By</span>
                <span className="f4-meta-val">{document.uploaded_by_name || `User #${document.uploaded_by}`}</span>
              </div>
              <div className="f4-meta-item">
                <span className="f4-meta-label">Uploaded On</span>
                <span className="f4-meta-val">{formatDate(document.created_at)}</span>
              </div>
              <div className="f4-meta-item">
                <span className="f4-meta-label">Last Modified</span>
                <span className="f4-meta-val">{formatDate(document.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* EDITABLE SECTION */}
          <div className="f4-meta-section">
            <div className="f4-section-header-row">
              <h4>Description & Categorization</h4>
              {!isEditing && (
                <button
                  type="button"
                  className="f4-btn-text"
                  onClick={() => {
                    setEditDescription(document.description || "");
                    setEditType(document.document_type || "study_protocol");
                    setIsEditing(true);
                  }}
                >
                  ✎ Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="f4-inline-edit-box">
                <div className="f4-form-group">
                  <label>Document Category</label>
                  <select
                    className="f4-input"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    {CANONICAL_DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="f4-form-group">
                  <label>Description</label>
                  <textarea
                    className="f4-input f4-textarea"
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="f4-inline-edit-actions">
                  <button
                    type="button"
                    className="f4-btn f4-btn-secondary f4-btn-sm"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="f4-btn f4-btn-primary f4-btn-sm"
                    onClick={handleSaveMetadata}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="f4-desc-text">
                {document.description || "No description provided for this document."}
              </p>
            )}
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="f4-drawer-footer">
          <button
            type="button"
            className="f4-btn f4-btn-danger f4-btn-sm"
            onClick={() => {
              onClose();
              onDeleteRequest(document);
            }}
          >
            Delete Document
          </button>
          <button type="button" className="f4-btn f4-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
