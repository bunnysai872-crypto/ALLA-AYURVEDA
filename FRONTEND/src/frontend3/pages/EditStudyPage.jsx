import React, { useState, useEffect } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import researcherApi from "../services/researcherApi";

/**
 * Maps raw study data into form values
 */
function mapStudyToFormData(data) {
  if (!data) {
    return {
      title: "",
      short_title: "",
      protocol_number: "",
      study_type: "Ayurvedic Clinical Trial",
      study_design: "Interventional (Randomized Controlled Trial)",
      condition: "",
      ayurveda_intervention: "",
      research_objective: "",
      primary_objective: "",
      secondary_objectives: "",
      study_duration: "",
      target_population: "",
      estimated_sample_size: "",
      description: "",
      status: "draft",
    };
  }

  return {
    title: data.title || "",
    short_title: data.short_title || data.shortTitle || "",
    protocol_number: data.protocol_number || data.protocolNumber || "",
    study_type: data.study_type || data.studyType || "Ayurvedic Clinical Trial",
    study_design: data.study_design || data.studyDesign || "Interventional (Randomized Controlled Trial)",
    condition: data.condition || "",
    ayurveda_intervention: data.ayurveda_intervention || data.intervention || "",
    research_objective: data.research_objective || data.researchObjective || "",
    primary_objective: data.primary_objective || data.primaryObjective || "",
    secondary_objectives: data.secondary_objectives || data.secondaryObjectives || "",
    study_duration: data.study_duration || data.studyDuration || "",
    target_population: data.target_population || data.targetPopulation || "",
    estimated_sample_size:
      data.estimated_sample_size ?? data.sample_size ?? data.sampleSize ?? "",
    description: data.description || "",
    status: data.status || "draft",
  };
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * EditStudyPage Component
 * 
 * Fetches existing study from GET /api/studies/<identifier>.
 * Pre-fills the form and allows updating metadata via PUT /api/studies/<identifier>.
 * Preserves unedited fields and provides clear success and error feedback.
 */
export function EditStudyPage({ studyIdentifier, initialStudy, onSelectTab }) {
  const identifier = studyIdentifier ?? initialStudy?.id ?? initialStudy?.study_id;

  const [study, setStudy] = useState(initialStudy || null);
  const [loading, setLoading] = useState(!initialStudy && Boolean(identifier));
  const [loadError, setLoadError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const [formData, setFormData] = useState(() => mapStudyToFormData(initialStudy));
  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load study from API if not already provided
  useEffect(() => {
    if (initialStudy || !identifier) return;

    let isCurrent = true;

    async function loadData() {
      try {
        const data = await researcherApi.getStudy(identifier);
        if (isCurrent) {
          if (data) {
            setStudy(data);
            setFormData(mapStudyToFormData(data));
            setLoadError(null);
          } else {
            setLoadError(`Study #${identifier} was not found on the server.`);
          }
        }
      } catch (err) {
        if (isCurrent) {
          console.error("[EditStudyPage] Error loading study:", err);
          setLoadError(
            err.message || `Failed to load study #${identifier} for editing.`
          );
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [identifier, initialStudy, fetchTrigger]);

  const handleRetryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setFetchTrigger((prev) => prev + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title || formData.title.trim() === "") {
      errors.title = "Study Title is required.";
    }
    if (!formData.study_type || formData.study_type.trim() === "") {
      errors.study_type = "Study Type is required.";
    }
    if (!formData.study_design || formData.study_design.trim() === "") {
      errors.study_design = "Study Design is required.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !identifier) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Prepare update payload (merges cleanly with existing study record)
    const payload = {
      ...(study || {}),
      title: formData.title.trim(),
      short_title: formData.short_title.trim() || undefined,
      protocol_number: formData.protocol_number.trim() || undefined,
      study_type: formData.study_type.trim(),
      study_design: formData.study_design.trim(),
      condition: formData.condition.trim() || undefined,
      ayurveda_intervention: formData.ayurveda_intervention.trim() || undefined,
      research_objective: formData.research_objective.trim() || undefined,
      primary_objective: formData.primary_objective.trim() || undefined,
      secondary_objectives: formData.secondary_objectives.trim() || undefined,
      study_duration: formData.study_duration.trim() || undefined,
      target_population: formData.target_population.trim() || undefined,
      estimated_sample_size: formData.estimated_sample_size ? Number(formData.estimated_sample_size) : undefined,
      description: formData.description.trim() || undefined,
      status: formData.status,
    };

    try {
      const response = await researcherApi.updateStudy(identifier, payload);
      const updated = (response && (response.study || response.data)) || response || payload;
      setStudy(updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error("[EditStudyPage] Save error:", err);
      setSaveError(
        err.message || "Failed to update study metadata. Please check the backend connection."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="f3-page-container">
        <div className="f3-loading-container">
          <div className="f3-loader-spinner"></div>
          <p>Loading study protocol for editing...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="f3-page-container">
        <div className="f3-page-header">
          <div>
            <span className="f3-eyebrow">EDIT STUDY</span>
            <h1>Study Editor</h1>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            ← Back to My Studies
          </button>
        </div>

        <div className="f3-alert-box f3-alert-error">
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Unable to Open Editor</strong>
            <p>{loadError}</p>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary f3-btn-sm"
            onClick={handleRetryLoad}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="f3-page-container">
      {/* Page Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">EDIT STUDY PROTOCOL • ID #{identifier}</span>
          <h1>Edit Study</h1>
          <p>Update study parameters, trial design, Ayurvedic interventions, and research objectives.</p>
        </div>

        <div className="f3-header-actions">
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, study || { id: identifier })}
          >
            ← View Details
          </button>
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            My Studies
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="f3-alert-box f3-alert-success">
          <span className="f3-alert-icon">✓</span>
          <div className="f3-alert-content">
            <strong>Study Updated Successfully</strong>
            <p>Your changes to Study #{identifier} have been saved to the registry.</p>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-primary f3-btn-sm"
            onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, study || { id: identifier })}
          >
            View Updated Details →
          </button>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="f3-alert-box f3-alert-error">
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Update Failed</strong>
            <p>{saveError}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="f3-form-card">
        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Core Parameters */}
          <div className="f3-form-section">
            <div className="f3-form-section-header">
              <h3>1. Core Classification</h3>
              <span>Protocol identification and status</span>
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-title">
                Study Title <span className="f3-required-star">*</span>
              </label>
              <input
                id="edit-field-title"
                name="title"
                type="text"
                className={`f3-input ${validationErrors.title ? "f3-input-error" : ""}`}
                value={formData.title}
                onChange={handleChange}
                disabled={submitting}
                required
              />
              {validationErrors.title && (
                <span className="f3-error-message">{validationErrors.title}</span>
              )}
            </div>

            <div className="f3-grid-2col">
              <div className="f3-form-group">
                <label htmlFor="edit-field-protocol">Protocol Number</label>
                <input
                  id="edit-field-protocol"
                  name="protocol_number"
                  type="text"
                  className="f3-input f3-font-mono"
                  value={formData.protocol_number}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="f3-form-group">
                <label htmlFor="edit-field-status">Study Status</label>
                <select
                  id="edit-field-status"
                  name="status"
                  className="f3-input f3-select"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={submitting}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="ready_for_ai_check">Ready for AI Check</option>
                  <option value="under_review">Under IEC Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="f3-grid-2col">
              <div className="f3-form-group">
                <label htmlFor="edit-field-type">
                  Study Type <span className="f3-required-star">*</span>
                </label>
                <input
                  id="edit-field-type"
                  name="study_type"
                  type="text"
                  className={`f3-input ${validationErrors.study_type ? "f3-input-error" : ""}`}
                  value={formData.study_type}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
                {validationErrors.study_type && (
                  <span className="f3-error-message">{validationErrors.study_type}</span>
                )}
              </div>

              <div className="f3-form-group">
                <label htmlFor="edit-field-design">
                  Study Design <span className="f3-required-star">*</span>
                </label>
                <input
                  id="edit-field-design"
                  name="study_design"
                  type="text"
                  className={`f3-input ${validationErrors.study_design ? "f3-input-error" : ""}`}
                  value={formData.study_design}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
                {validationErrors.study_design && (
                  <span className="f3-error-message">{validationErrors.study_design}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <div className="f3-form-section">
            <div className="f3-form-section-header">
              <h3>2. Clinical Intervention</h3>
              <span>Target condition and Ayurvedic therapeutic formulation</span>
            </div>

            <div className="f3-grid-2col">
              <div className="f3-form-group">
                <label htmlFor="edit-field-condition">Target Condition / Vyadhi</label>
                <input
                  id="edit-field-condition"
                  name="condition"
                  type="text"
                  className="f3-input"
                  value={formData.condition}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="f3-form-group">
                <label htmlFor="edit-field-intervention">Ayurveda Intervention / Aushadhi</label>
                <input
                  id="edit-field-intervention"
                  name="ayurveda_intervention"
                  type="text"
                  className="f3-input"
                  value={formData.ayurveda_intervention}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="f3-grid-2col">
              <div className="f3-form-group">
                <label htmlFor="edit-field-duration">Study Duration</label>
                <input
                  id="edit-field-duration"
                  name="study_duration"
                  type="text"
                  className="f3-input"
                  value={formData.study_duration}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="f3-form-group">
                <label htmlFor="edit-field-sample">Estimated Sample Size</label>
                <input
                  id="edit-field-sample"
                  name="estimated_sample_size"
                  type="number"
                  min="1"
                  className="f3-input"
                  value={formData.estimated_sample_size}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-population">Target Population & Inclusion Criteria</label>
              <input
                id="edit-field-population"
                name="target_population"
                type="text"
                className="f3-input"
                value={formData.target_population}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Section 3: Objectives & Description */}
          <div className="f3-form-section">
            <div className="f3-form-section-header">
              <h3>3. Objectives & Narrative</h3>
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-research-obj">Research Objective</label>
              <textarea
                id="edit-field-research-obj"
                name="research_objective"
                className="f3-textarea"
                rows={2}
                value={formData.research_objective}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-primary-obj">Primary Objective</label>
              <textarea
                id="edit-field-primary-obj"
                name="primary_objective"
                className="f3-textarea"
                rows={2}
                value={formData.primary_objective}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-sec-obj">Secondary Objectives</label>
              <textarea
                id="edit-field-sec-obj"
                name="secondary_objectives"
                className="f3-textarea"
                rows={2}
                value={formData.secondary_objectives}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>

            <div className="f3-form-group">
              <label htmlFor="edit-field-desc">Description / Background Abstract</label>
              <textarea
                id="edit-field-desc"
                name="description"
                className="f3-textarea"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Actions Bar */}
          <div className="f3-form-actions-bar">
            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, study || { id: identifier })}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="f3-btn f3-btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="f3-refresh-icon f3-spinning">↻</span>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Study Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStudyPage;

