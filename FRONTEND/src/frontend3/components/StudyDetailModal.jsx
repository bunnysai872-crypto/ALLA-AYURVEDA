import React, { useEffect } from "react";
import StudyStatusBadge from "./StudyStatusBadge";
import { formatDateTime } from "../utils/formatters";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * StudyDetailModal Component
 * 
 * Detailed modal view for inspecting clinical research study records.
 */
export function StudyDetailModal({ study, isOpen, onClose, onOpenProtocol }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !study) return null;

  const studyId = study.id ?? study.study_id ?? "—";
  const studyTitle = study.title || "Untitled Ayurveda Study";
  const protocolNum = study.protocol_number || study.protocolNumber || "—";
  const studyType = study.study_type || study.studyType || "Ayurvedic Clinical Trial";
  const studyDesign = study.study_design || study.studyDesign || "Interventional / Randomized";
  const description = study.description || "No description provided for this research protocol.";
  const status = study.status || "draft";
  const createdAt = study.created_at || study.createdAt;
  const updatedAt = study.updated_at || study.updatedAt;

  return (
    <div className="f3-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="f3-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="f3-modal-header">
          <div className="f3-modal-title-area">
            <span className="f3-eyebrow">CLINICAL STUDY RECORD • ID #{studyId}</span>
            <h2 className="f3-modal-title">{studyTitle}</h2>
          </div>
          <button
            type="button"
            className="f3-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="f3-modal-body">
          {/* Status & Protocol Summary */}
          <div className="f3-modal-meta-grid">
            <div className="f3-modal-meta-item">
              <span className="f3-modal-meta-label">CURRENT STATUS</span>
              <div className="f3-modal-meta-val">
                <StudyStatusBadge status={status} />
              </div>
            </div>

            <div className="f3-modal-meta-item">
              <span className="f3-modal-meta-label">PROTOCOL NUMBER</span>
              <strong className="f3-modal-meta-val f3-font-mono">{protocolNum}</strong>
            </div>

            <div className="f3-modal-meta-item">
              <span className="f3-modal-meta-label">STUDY TYPE</span>
              <span className="f3-modal-meta-val">{studyType}</span>
            </div>

            <div className="f3-modal-meta-item">
              <span className="f3-modal-meta-label">STUDY DESIGN</span>
              <span className="f3-modal-meta-val">{studyDesign}</span>
            </div>
          </div>

          {/* Abstract / Description */}
          <div className="f3-modal-section">
            <span className="f3-modal-section-title">Study Description / Protocol Abstract</span>
            <div className="f3-modal-desc-box">
              <p>{description}</p>
            </div>
          </div>

          {/* Audit Dates */}
          <div className="f3-modal-audit-grid">
            <div>
              <span className="f3-modal-meta-label">CREATED AT</span>
              <span className="f3-modal-meta-text">{formatDateTime(createdAt)}</span>
            </div>

            <div>
              <span className="f3-modal-meta-label">LAST UPDATED</span>
              <span className="f3-modal-meta-text">{formatDateTime(updatedAt || createdAt)}</span>
            </div>

            {study.principal_investigator_id && (
              <div>
                <span className="f3-modal-meta-label">INVESTIGATOR ID</span>
                <span className="f3-modal-meta-text">User #{study.principal_investigator_id}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="f3-modal-footer">
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          {onOpenProtocol && (
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              onClick={() => {
                onClose();
                onOpenProtocol(study);
              }}
            >
              <span>Open in Protocol Builder</span>
              <span className="f3-btn-arrow">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudyDetailModal;

