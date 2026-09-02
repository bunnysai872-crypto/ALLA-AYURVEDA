import React, { useState } from "react";

/**
 * Inner form component with its own local state keyed by study.
 */
function EditStudyForm({ study, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: study?.title || "",
    protocolNumber: study?.protocol_number || study?.protocolNumber || "",
    studyType: study?.study_type || study?.studyType || "Ayurvedic Clinical Trial",
    studyDesign: study?.study_design || study?.studyDesign || "Interventional",
    description: study?.description || "",
    status: study?.status || "draft",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...study,
        ...formData,
        protocol_number: formData.protocolNumber,
        study_type: formData.studyType,
        study_design: formData.studyDesign,
        updated_at: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="f3-modal-body">
        <div className="f3-form-group">
          <label htmlFor="edit-title">Study Title *</label>
          <input
            id="edit-title"
            name="title"
            type="text"
            className="f3-input"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="f3-grid-2col">
          <div className="f3-form-group">
            <label htmlFor="edit-protocol">Protocol Number</label>
            <input
              id="edit-protocol"
              name="protocolNumber"
              type="text"
              className="f3-input"
              value={formData.protocolNumber}
              onChange={handleChange}
            />
          </div>

          <div className="f3-form-group">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              name="status"
              className="f3-input f3-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="ready_for_ai_check">Ready for AI Check</option>
              <option value="under_review">Under IEC Review</option>
            </select>
          </div>
        </div>

        <div className="f3-grid-2col">
          <div className="f3-form-group">
            <label htmlFor="edit-type">Study Type</label>
            <input
              id="edit-type"
              name="studyType"
              type="text"
              className="f3-input"
              value={formData.studyType}
              onChange={handleChange}
            />
          </div>

          <div className="f3-form-group">
            <label htmlFor="edit-design">Study Design</label>
            <input
              id="edit-design"
              name="studyDesign"
              type="text"
              className="f3-input"
              value={formData.studyDesign}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="f3-form-group">
          <label htmlFor="edit-desc">Description / Abstract</label>
          <textarea
            id="edit-desc"
            name="description"
            className="f3-textarea"
            rows={3}
            value={formData.description}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="f3-modal-footer">
        <button
          type="button"
          className="f3-btn f3-btn-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button type="submit" className="f3-btn f3-btn-primary">
          Save Changes
        </button>
      </div>
    </form>
  );
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * EditStudyModal Component
 */
export function EditStudyModal({ study, isOpen, onClose, onSave }) {
  if (!isOpen || !study) return null;

  return (
    <div className="f3-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="f3-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="f3-modal-header">
          <div className="f3-modal-title-area">
            <span className="f3-eyebrow">EDIT STUDY • ID #{study.id ?? study.study_id}</span>
            <h2 className="f3-modal-title">Edit Study Protocol</h2>
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

        <EditStudyForm
          key={study.id ?? study.study_id}
          study={study}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

export default EditStudyModal;

