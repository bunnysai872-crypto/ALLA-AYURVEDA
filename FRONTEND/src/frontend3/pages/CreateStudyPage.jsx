import React, { useState } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import researcherApi from "../services/researcherApi";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * CreateStudyPage Component
 * 
 * Complete study creation workflow with validation of required fields:
 * - Title
 * - Study Type
 * - Study Design
 * - Research Objective
 * 
 * And comprehensive optional clinical research fields.
 * Sends POST /api/studies.
 */
export function CreateStudyPage({ onSelectTab }) {
  const [formData, setFormData] = useState({
    title: "",
    study_type: "Ayurvedic Clinical Trial",
    study_design: "Interventional (Randomized Controlled Trial)",
    research_objective: "",
    short_title: "",
    protocol_number: "",
    condition: "",
    ayurveda_intervention: "",
    primary_objective: "",
    secondary_objectives: "",
    study_duration: "",
    target_population: "",
    estimated_sample_size: "",
    description: "",
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [createdStudy, setCreatedStudy] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error when user types
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
    if (!formData.research_objective || formData.research_objective.trim() === "") {
      errors.research_objective = "Research Objective is required.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setApiError(null);

    // Prepare JSON payload for POST /api/studies
    const payload = {
      title: formData.title.trim(),
      study_type: formData.study_type.trim(),
      study_design: formData.study_design.trim(),
      research_objective: formData.research_objective.trim(),
      short_title: formData.short_title.trim() || undefined,
      protocol_number: formData.protocol_number.trim() || undefined,
      condition: formData.condition.trim() || undefined,
      ayurveda_intervention: formData.ayurveda_intervention.trim() || undefined,
      primary_objective: formData.primary_objective.trim() || undefined,
      secondary_objectives: formData.secondary_objectives.trim() || undefined,
      study_duration: formData.study_duration.trim() || undefined,
      target_population: formData.target_population.trim() || undefined,
      estimated_sample_size: formData.estimated_sample_size ? Number(formData.estimated_sample_size) : undefined,
      description: formData.description.trim() || undefined,
      status: "draft",
    };

    try {
      const response = await researcherApi.createStudy(payload);
      // Backend generates ID and returns study
      const savedStudy = (response && (response.study || response.data)) || response || payload;
      setCreatedStudy(savedStudy);
    } catch (err) {
      console.error("[CreateStudyPage] Creation error:", err);
      setApiError(
        err.message || "Failed to create study. Please verify input data and backend server connection."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      title: "",
      study_type: "Ayurvedic Clinical Trial",
      study_design: "Interventional (Randomized Controlled Trial)",
      research_objective: "",
      short_title: "",
      protocol_number: "",
      condition: "",
      ayurveda_intervention: "",
      primary_objective: "",
      secondary_objectives: "",
      study_duration: "",
      target_population: "",
      estimated_sample_size: "",
      description: "",
    });
    setCreatedStudy(null);
    setValidationErrors({});
    setApiError(null);
  };

  return (
    <div className="f3-page-container">
      {/* Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">NEW PROTOCOL REGISTRATION</span>
          <h1>Create Clinical Study</h1>
          <p>
            Register a standardized Ayurveda clinical research trial. All submissions
            are verified and tracked through the institutional research workflow.
          </p>
        </div>

        <button
          type="button"
          className="f3-btn f3-btn-secondary"
          onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
        >
          ← Back to My Studies
        </button>
      </div>

      {/* Success State Screen */}
      {createdStudy ? (
        <div className="f3-success-card">
          <div className="f3-success-icon-badge">✓</div>
          <span className="f3-eyebrow f3-text-success">REGISTRATION SUCCESSFUL</span>
          <h2>Clinical Study Initialized</h2>
          <p className="f3-success-subtext">
            Your study has been successfully created in the ALLA Ayurveda registry with status <strong>Draft</strong>.
          </p>

          <div className="f3-success-meta-box">
            <div className="f3-meta-item">
              <span className="f3-meta-label">GENERATED STUDY ID</span>
              <strong className="f3-meta-val f3-font-mono f3-text-accent">
                #{createdStudy.id ?? createdStudy.study_id ?? "Generated by Server"}
              </strong>
            </div>
            <div className="f3-meta-item">
              <span className="f3-meta-label">STUDY TITLE</span>
              <span className="f3-meta-val">{createdStudy.title || formData.title}</span>
            </div>
            {formData.protocol_number && (
              <div className="f3-meta-item">
                <span className="f3-meta-label">PROTOCOL NUMBER</span>
                <span className="f3-meta-val f3-font-mono">{formData.protocol_number}</span>
              </div>
            )}
          </div>

          <div className="f3-success-actions">
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              onClick={() =>
                onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, {
                  id: createdStudy.id ?? createdStudy.study_id,
                  ...createdStudy,
                })
              }
            >
              <span>View Study Details</span>
              <span className="f3-btn-arrow">→</span>
            </button>

            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
            >
              View in My Studies
            </button>

            <button
              type="button"
              className="f3-btn f3-btn-ghost"
              onClick={handleResetForm}
            >
              + Create Another Study
            </button>
          </div>
        </div>
      ) : (
        /* Form Section */
        <div className="f3-form-card">
          {apiError && (
            <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "24px" }}>
              <span className="f3-alert-icon">⚠️</span>
              <div className="f3-alert-content">
                <strong>Study Creation Failed</strong>
                <p>{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Section 1: Required Essential Metadata */}
            <div className="f3-form-section">
              <div className="f3-form-section-header">
                <h3>1. Core Study Information</h3>
                <span>Essential parameters required for trial registration</span>
              </div>

              {/* Title */}
              <div className="f3-form-group">
                <label htmlFor="field-title">
                  Study Title <span className="f3-required-star">*</span>
                </label>
                <input
                  id="field-title"
                  name="title"
                  type="text"
                  className={`f3-input ${validationErrors.title ? "f3-input-error" : ""}`}
                  placeholder="e.g. Clinical Evaluation of Ashwagandha (Withania somnifera) in Managing Generalized Anxiety Disorder"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
                {validationErrors.title && (
                  <span className="f3-error-message">{validationErrors.title}</span>
                )}
              </div>

              {/* Study Type & Study Design */}
              <div className="f3-grid-2col">
                <div className="f3-form-group">
                  <label htmlFor="field-study-type">
                    Study Type <span className="f3-required-star">*</span>
                  </label>
                  <select
                    id="field-study-type"
                    name="study_type"
                    className={`f3-input f3-select ${validationErrors.study_type ? "f3-input-error" : ""}`}
                    value={formData.study_type}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="Ayurvedic Clinical Trial">Ayurvedic Clinical Trial</option>
                    <option value="Observational Study">Observational Study</option>
                    <option value="Comparative Efficacy Trial">Comparative Efficacy Trial</option>
                    <option value="Pharmacovigilance & Safety Study">Pharmacovigilance & Safety Study</option>
                    <option value="Classical Formulation Validation">Classical Formulation Validation</option>
                  </select>
                  {validationErrors.study_type && (
                    <span className="f3-error-message">{validationErrors.study_type}</span>
                  )}
                </div>

                <div className="f3-form-group">
                  <label htmlFor="field-study-design">
                    Study Design <span className="f3-required-star">*</span>
                  </label>
                  <select
                    id="field-study-design"
                    name="study_design"
                    className={`f3-input f3-select ${validationErrors.study_design ? "f3-input-error" : ""}`}
                    value={formData.study_design}
                    onChange={handleChange}
                    disabled={submitting}
                    required
                  >
                    <option value="Interventional (Randomized Controlled Trial)">
                      Interventional (Randomized Controlled Trial)
                    </option>
                    <option value="Double-Blind Placebo-Controlled Trial">
                      Double-Blind Placebo-Controlled Trial
                    </option>
                    <option value="Open-Label Single-Arm Trial">Open-Label Single-Arm Trial</option>
                    <option value="Cross-Sectional Cohort Study">Cross-Sectional Cohort Study</option>
                    <option value="Pre-Post Interventional Pilot">Pre-Post Interventional Pilot</option>
                  </select>
                  {validationErrors.study_design && (
                    <span className="f3-error-message">{validationErrors.study_design}</span>
                  )}
                </div>
              </div>

              {/* Research Objective */}
              <div className="f3-form-group">
                <label htmlFor="field-research-obj">
                  Research Objective <span className="f3-required-star">*</span>
                </label>
                <textarea
                  id="field-research-obj"
                  name="research_objective"
                  className={`f3-textarea ${validationErrors.research_objective ? "f3-input-error" : ""}`}
                  rows={3}
                  placeholder="State the core research hypothesis, therapeutic intent, and primary scientific inquiry..."
                  value={formData.research_objective}
                  onChange={handleChange}
                  disabled={submitting}
                  required
                />
                {validationErrors.research_objective && (
                  <span className="f3-error-message">{validationErrors.research_objective}</span>
                )}
              </div>
            </div>

            {/* Section 2: Clinical Details & Ayurvedic Formulation */}
            <div className="f3-form-section">
              <div className="f3-form-section-header">
                <h3>2. Clinical Protocol & Intervention</h3>
                <span>Target condition, Ayurvedic drug regimen, and sample specifications</span>
              </div>

              <div className="f3-grid-2col">
                <div className="f3-form-group">
                  <label htmlFor="field-short-title">Short Title / Acronym</label>
                  <input
                    id="field-short-title"
                    name="short_title"
                    type="text"
                    className="f3-input"
                    placeholder="e.g. ASHWA-ANX-2026"
                    value={formData.short_title}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="f3-form-group">
                  <label htmlFor="field-protocol-num">Protocol Number</label>
                  <input
                    id="field-protocol-num"
                    name="protocol_number"
                    type="text"
                    className="f3-input"
                    placeholder="e.g. ALLA-AYUR-PROT-001"
                    value={formData.protocol_number}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="f3-grid-2col">
                <div className="f3-form-group">
                  <label htmlFor="field-condition">Target Condition / Vyadhi</label>
                  <input
                    id="field-condition"
                    name="condition"
                    type="text"
                    className="f3-input"
                    placeholder="e.g. Chittodvega (Generalized Anxiety Disorder)"
                    value={formData.condition}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="f3-form-group">
                  <label htmlFor="field-intervention">Ayurveda Intervention / Aushadhi</label>
                  <input
                    id="field-intervention"
                    name="ayurveda_intervention"
                    type="text"
                    className="f3-input"
                    placeholder="e.g. Ashwagandha Ghana Vati 500mg BD with Ksheera"
                    value={formData.ayurveda_intervention}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="f3-grid-2col">
                <div className="f3-form-group">
                  <label htmlFor="field-duration">Study Duration</label>
                  <input
                    id="field-duration"
                    name="study_duration"
                    type="text"
                    className="f3-input"
                    placeholder="e.g. 12 Weeks (84 Days)"
                    value={formData.study_duration}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>

                <div className="f3-form-group">
                  <label htmlFor="field-sample-size">Estimated Sample Size (Participants)</label>
                  <input
                    id="field-sample-size"
                    name="estimated_sample_size"
                    type="number"
                    min="1"
                    className="f3-input"
                    placeholder="e.g. 60"
                    value={formData.estimated_sample_size}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="f3-form-group">
                <label htmlFor="field-population">Target Population / Inclusion Summary</label>
                <input
                  id="field-population"
                  name="target_population"
                  type="text"
                  className="f3-input"
                  placeholder="e.g. Adults aged 18-60 with moderate anxiety symptoms and Vata-Pitta Prakriti"
                  value={formData.target_population}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Section 3: Objectives & Description */}
            <div className="f3-form-section">
              <div className="f3-form-section-header">
                <h3>3. Endpoints & Abstract</h3>
                <span>Detailed scientific objectives and background narrative</span>
              </div>

              <div className="f3-form-group">
                <label htmlFor="field-primary-obj">Primary Objective</label>
                <textarea
                  id="field-primary-obj"
                  name="primary_objective"
                  className="f3-textarea"
                  rows={2}
                  placeholder="e.g. To assess the reduction in Hamilton Anxiety Rating Scale (HAM-A) scores at Week 12..."
                  value={formData.primary_objective}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="f3-form-group">
                <label htmlFor="field-sec-obj">Secondary Objectives</label>
                <textarea
                  id="field-sec-obj"
                  name="secondary_objectives"
                  className="f3-textarea"
                  rows={2}
                  placeholder="e.g. To evaluate sleep quality improvements (PSQI) and serum cortisol modulation..."
                  value={formData.secondary_objectives}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              <div className="f3-form-group">
                <label htmlFor="field-description">Full Description / Background Abstract</label>
                <textarea
                  id="field-description"
                  name="description"
                  className="f3-textarea"
                  rows={4}
                  placeholder="Provide an overview of the study rationale, classical Ayurvedic references, and expected trial significance..."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="f3-form-actions-bar">
              <button
                type="button"
                className="f3-btn f3-btn-secondary"
                onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
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
                    <span>Submitting Protocol to Server...</span>
                  </>
                ) : (
                  <>
                    <span>Create & Register Study</span>
                    <span className="f3-btn-arrow">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default CreateStudyPage;
