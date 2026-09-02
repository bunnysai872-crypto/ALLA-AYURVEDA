import React, { useEffect } from "react";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * DeleteConfirmModal Component
 * 
 * Confirmation dialog for deleting a research study.
 * Confirms that deletion is irreversible and explains backend draft-only constraint.
 */
export function DeleteConfirmModal({
  study,
  isOpen,
  isDeleting,
  errorMessage,
  onClose,
  onConfirmDelete,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !study) return null;

  const studyId = study.id ?? study.study_id ?? "—";
  const studyTitle = study.title || "Untitled Study";
  const isDraft = (study.status || "draft").toLowerCase().trim() === "draft";

  return (
    <div className="f3-modal-backdrop" onClick={isDeleting ? undefined : onClose} role="dialog" aria-modal="true">
      <div className="f3-modal-container f3-modal-danger" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="f3-modal-header f3-modal-header-danger">
          <div className="f3-danger-icon-badge">⚠️</div>
          <div className="f3-modal-title-area">
            <span className="f3-eyebrow f3-text-danger">IRREVERSIBLE ACTION</span>
            <h2 className="f3-modal-title">Delete Study Protocol</h2>
          </div>
          {!isDeleting && (
            <button
              type="button"
              className="f3-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="f3-modal-body">
          <p className="f3-confirm-question">
            Are you sure you want to delete this study?
          </p>

          <div className="f3-delete-target-card">
            <div className="f3-target-id">Study ID #{studyId}</div>
            <strong className="f3-target-title">{studyTitle}</strong>
            <span className="f3-target-status">
              Current Status: <strong>{study.status || "draft"}</strong>
            </span>
          </div>

          <div className="f3-danger-callout">
            <p>
              <strong>Caution:</strong> Deletion cannot be undone. All associated study
              metadata and draft versions will be permanently removed from the platform.
            </p>
            {!isDraft && (
              <p className="f3-warning-text">
                ⚠️ Backend Security Notice: Only studies in <strong>draft</strong> status can
                be deleted. Active or submitted studies cannot be removed.
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="f3-alert-box f3-alert-error">
              <span className="f3-alert-icon">⚠️</span>
              <div className="f3-alert-content">
                <strong>Deletion Failed</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="f3-modal-footer">
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="f3-btn f3-btn-danger"
            onClick={onConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="f3-refresh-icon f3-spinning">↻</span>
                <span>Deleting...</span>
              </>
            ) : (
              <span>Confirm & Delete Study</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;

