import React, { useState, useRef } from "react";
import researcherApi from "../services/researcherApi";
import { formatFileSize } from "../utils/formatters";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const DOCUMENT_TYPES = [
  { value: "protocol", label: "Clinical Study Protocol", required: true, icon: "📋" },
  { value: "informed_consent_form", label: "Informed Consent Form (ICF)", required: true, icon: "📝" },
  { value: "investigator_brochure", label: "Investigator's Brochure (IB)", required: false, icon: "📖" },
  { value: "crf", label: "Case Report Form (CRF)", required: false, icon: "📊" },
  { value: "ethics_approval", label: "Ethics Committee Approval", required: false, icon: "🏛" },
  { value: "other", label: "Other Supporting Document", required: false, icon: "📁" },
];

/**
 * ALLA AYURVEDA — FRONTEND 3
 * DocumentUpload Component
 * 
 * Upload interface supporting drag & drop, document classification,
 * size checks, and live progress indicators.
 */
export function DocumentUpload({ studyId, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("protocol");
  const [description, setDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // States
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileValidation = (file) => {
    if (!file) return false;

    // Check size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(`File exceeds maximum allowed size of 25MB (Selected: ${formatFileSize(file.size)}).`);
      return false;
    }

    // Check extension
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMsg(`Unsupported format '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return false;
    }

    setErrorMsg(null);
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && handleFileValidation(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && handleFileValidation(file)) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a document file to upload.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("document_type", documentType);
    if (description.trim()) {
      formData.append("description", description.trim());
    }

    try {
      await researcherApi.uploadStudyDocument(studyId, formData);
      setSuccessMsg(`Document "${selectedFile.name}" uploaded successfully as v1.`);
      setSelectedFile(null);
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Auto dismiss success notice after 5 seconds
      setTimeout(() => {
        setSuccessMsg(null);
      }, 5000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to upload document. Please check backend connection.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="f3-doc-upload-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px 0", color: "var(--f3-text-primary)" }}>
            Upload Regulatory Document
          </h3>
          <p style={{ fontSize: "13px", color: "var(--f3-text-muted)", margin: 0 }}>
            Attach study protocols, consent forms, and ethics clearances for study #{studyId}.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "16px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Upload Validation Notice</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="f3-alert-box f3-alert-success" style={{ marginBottom: "16px" }}>
          <span className="f3-alert-icon">✓</span>
          <div className="f3-alert-content">
            <strong>Upload Completed</strong>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dropzone */}
        <div
          className={`f3-doc-dropzone ${isDragOver ? "f3-dropzone-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div className="f3-dropzone-icon">📄</div>
          <div className="f3-dropzone-prompt">
            {selectedFile ? selectedFile.name : "Drag and drop study document here, or browse"}
          </div>
          <div className="f3-dropzone-sub">
            Supported files: PDF, DOCX, DOC, TXT (Maximum: 25MB)
          </div>

          {selectedFile && (
            <div className="f3-doc-selected-file-pill" onClick={(e) => e.stopPropagation()}>
              <span>📎 {selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
              <button
                type="button"
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "6px" }}
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Metadata Controls */}
        <div className="f3-grid-2col" style={{ marginTop: "16px" }}>
          <div className="f3-form-group">
            <label htmlFor="doc-type-select">Document Classification *</label>
            <select
              id="doc-type-select"
              className="f3-input f3-select"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label} {t.required ? "(Mandatory)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="f3-form-group">
            <label htmlFor="doc-description">Document Description / Remarks</label>
            <input
              id="doc-description"
              type="text"
              className="f3-input"
              placeholder="e.g. Final IRB-approved version signed by PI"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            type="submit"
            className="f3-btn f3-btn-primary"
            disabled={uploading || !selectedFile}
          >
            {uploading ? (
              <>
                <span className="f3-refresh-icon f3-spinning">↻</span>
                <span>Uploading Document...</span>
              </>
            ) : (
              <span>Upload Document</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DocumentUpload;
