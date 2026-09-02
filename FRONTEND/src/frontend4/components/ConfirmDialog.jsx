import React from "react";

export default function ConfirmDialog({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="f4-modal-overlay" onClick={onCancel}>
      <div
        className="f4-modal-container f4-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="f4-modal-header">
          <div className="f4-dialog-icon-wrapper">
            <span className="f4-dialog-icon">⚠</span>
          </div>
          <h3>{title}</h3>
        </div>

        <div className="f4-modal-body">
          <p className="f4-confirm-message">{message}</p>
        </div>

        <div className="f4-modal-footer">
          <button
            type="button"
            className="f4-btn f4-btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`f4-btn ${isDanger ? "f4-btn-danger" : "f4-btn-primary"}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
