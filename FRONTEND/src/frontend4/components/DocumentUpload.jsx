import React, { useState, useRef } from "react";
import { DOCUMENT_TYPE_LABELS, formatBytes } from "../utils/documentHelpers";

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt", "xls", "xlsx", "csv"];
const MAX_FILE_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

export default function DocumentUpload({
  isOpen,
  onClose,
  onUploadSuccess,
  isVersionUpload = false,
  targetDocument = null,
  studyId,
  uploadFunction,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState(
    targetDocument?.document_type || "protocol"
  );
  const [description, setDescription] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file) => {
    setValidationError("");
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setValidationError(
        `Invalid file type '.${ext}'. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError("File size exceeds the allowed limit (16MB).");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError("Please select a file to upload.");
      return;
    }

    setIsSubmitting(true);
    setValidationError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      if (isVersionUpload) {
        formData.append("change_summary", changeSummary || description);
      } else {
        formData.append("document_type", documentType);
        formData.append("description", description);
      }

      await uploadFunction(formData);
      onUploadSuccess();
      onClose();
    } catch (err) {
      setValidationError(err.message || "Failed to upload file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="f4-modal-overlay" onClick={onClose}>
      <div
        className="f4-modal-container f4-upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="f4-modal-header">
          <div className="f4-modal-header-text">
            <h3>{isVersionUpload ? `Upload Revision (v${(targetDocument?.version || 1) + 1})` : "Upload Study Document"}</h3>
            <p>
              {isVersionUpload
                ? `Upload a revised version for '${targetDocument?.original_filename}'. The previous version will be preserved.`
                : "Add a protocol, consent form, or clinical document to this study."}
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

        <form onSubmit={handleSubmit} className="f4-modal-body">
          {validationError && (
            <div className="f4-alert f4-alert-error">
              <span>⚠</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* DRAG & DROP ZONE */}
          <div
            className={`f4-dropzone ${isDragOver ? "dragover" : ""} ${selectedFile ? "has-file" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
            />
            {selectedFile ? (
              <div className="f4-selected-file-info">
                <span className="f4-file-badge-icon">📄</span>
                <div className="f4-file-text">
                  <strong>{selectedFile.name}</strong>
                  <span>{formatBytes(selectedFile.size)} • Ready for upload</span>
                </div>
                <button
                  type="button"
                  className="f4-btn-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  Change File
                </button>
              </div>
            ) : (
              <div className="f4-dropzone-prompt">
                <span className="f4-upload-icon">☁️</span>
                <p>
                  <strong>Click to browse</strong> or drag & drop file here
                </p>
                <small>Supported: PDF, DOCX, DOC, TXT, XLSX (Max: 16 MB)</small>
              </div>
            )}
          </div>

          {/* DOCUMENT TYPE (for new uploads) */}
          {!isVersionUpload && (
            <div className="f4-form-group">
              <label htmlFor="f4_doc_type">Document Type *</label>
              <select
                id="f4_doc_type"
                className="f4-input"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DESCRIPTION / CHANGE SUMMARY */}
          <div className="f4-form-group">
            <label htmlFor="f4_description">
              {isVersionUpload ? "Version Change Summary" : "Description / Notes"}
            </label>
            <textarea
              id="f4_description"
              className="f4-input f4-textarea"
              rows={3}
              placeholder={
                isVersionUpload
                  ? "Describe modifications in this version (e.g. Amended sample size from 80 to 100)..."
                  : "Optional document notes or section specifications..."
              }
              value={isVersionUpload ? changeSummary : description}
              onChange={(e) =>
                isVersionUpload
                  ? setChangeSummary(e.target.value)
                  : setDescription(e.target.value)
              }
            />
          </div>

          <div className="f4-modal-footer">
            <button
              type="button"
              className="f4-btn f4-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="f4-btn f4-btn-primary"
              disabled={isSubmitting || !selectedFile}
            >
              {isSubmitting ? (
                <>
                  <span className="f4-spinner-inline" />
                  <span>Uploading...</span>
                </>
              ) : isVersionUpload ? (
                "Upload New Version"
              ) : (
                "Upload Document"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
