import React, { useState, useEffect, useMemo } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import researcherApi from "../services/researcherApi";
import StudyStatusBadge from "../components/StudyStatusBadge";

const PROTOCOL_SECTIONS = [
  { id: 1, key: "info", title: "Protocol Information", shortTitle: "Info", icon: "📋" },
  { id: 2, key: "background", title: "Background & Rationale", shortTitle: "Background", icon: "📖" },
  { id: 3, key: "objectives", title: "Objectives", shortTitle: "Objectives", icon: "🎯" },
  { id: 4, key: "design", title: "Study Design", shortTitle: "Design", icon: "📐" },
  { id: 5, key: "participants", title: "Participants & Criteria", shortTitle: "Participants", icon: "👥" },
  { id: 6, key: "intervention", title: "Intervention Regimen", shortTitle: "Intervention", icon: "🌿" },
  { id: 7, key: "outcomes", title: "Outcomes & Safety", shortTitle: "Outcomes & Safety", icon: "🛡️" },
];

/**
 * Initial empty protocol form state
 */
function getInitialProtocolForm(study) {
  return {
    // Section 1: Protocol Information
    protocol_title: study?.title || "",
    protocol_version: "1.0",
    protocol_date: new Date().toISOString().split("T")[0],
    principal_investigator: "",
    sponsor: "ALLA Ayurveda Research Initiative",

    // Section 2: Background
    background: study?.description || "",
    rationale: "",
    research_question: study?.research_objective || "",

    // Section 3: Objectives
    primary_objective: study?.primary_objective || study?.research_objective || "",
    secondary_objectives: study?.secondary_objectives || "",

    // Section 4: Study Design
    study_type: study?.study_type || "Ayurvedic Clinical Trial",
    study_design: study?.study_design || "Interventional (Randomized Controlled Trial)",
    study_phase: "Phase II (Therapeutic Exploratory)",
    randomization: "1:1 Computer-Generated Block Randomization",
    blinding: "Double-Blind (Participant & Investigator Masked)",
    control_type: "Standard Ayurvedic Active Comparator / Placebo",
    study_duration: study?.study_duration || "12 Weeks (84 Days)",

    // Section 5: Participants
    target_population: study?.target_population || "",
    sample_size: study?.estimated_sample_size || "",
    minimum_age: "18",
    maximum_age: "65",
    gender_criteria: "All (Male, Female, Non-Binary)",
    inclusion_criteria: "",
    exclusion_criteria: "",

    // Section 6: Intervention
    intervention_name: study?.ayurveda_intervention || "",
    intervention_description: "",
    dosage: "500 mg twice daily (BD)",
    route: "Oral (Oral Administration)",
    frequency: "Twice daily after meals with warm water/milk",
    intervention_duration: study?.study_duration || "12 Weeks",

    // Section 7: Outcomes & Safety
    primary_outcomes: "",
    secondary_outcomes: "",
    safety_monitoring: "Hepatic & Renal function panels at baseline, Week 6, and Week 12",
    adverse_event_reporting: "Standard GCP/AYUSH adverse event logging within 24 hours",
  };
}

/**
 * Maps existing protocol response safely into form
 */
function mapProtocolToForm(rawProtocol, study) {
  const defaults = getInitialProtocolForm(study);
  if (!rawProtocol) return defaults;

  const result = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    if (rawProtocol[key] !== undefined && rawProtocol[key] !== null) {
      result[key] = String(rawProtocol[key]);
    }
  });
  return result;
}

/**
 * ALLA AYURVEDA — FRONTEND 3 — PHASE 4
 * ProtocolBuilderPage Component
 * 
 * Complete 7-section clinical protocol builder with progressive draft saving,
 * dynamic progress calculation, section step navigation, and full API integration.
 */
export function ProtocolBuilderPage({ activeStudy, onSelectTab }) {
  // Study Selection & Context
  const [studiesList, setStudiesList] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(activeStudy || null);
  const [loadingStudies, setLoadingStudies] = useState(false);

  // Active Section (0-indexed: 0 to 6)
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Protocol State
  const [protocolData, setProtocolData] = useState(() => getInitialProtocolForm(activeStudy));
  const [rawProtocol, setRawProtocol] = useState(null);
  const [hasExistingProtocol, setHasExistingProtocol] = useState(false);

  // Loading & Save States
  const [loadingProtocol, setLoadingProtocol] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "success" | "error"
  const [saveMessage, setSaveMessage] = useState("");
  const [apiError, setApiError] = useState(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const identifier = selectedStudy?.id ?? selectedStudy?.study_id;

  // Load studies list if no active study was provided
  useEffect(() => {
    if (selectedStudy) return;

    let isCurrent = true;
    async function loadAllStudies() {
      setLoadingStudies(true);
      try {
        const studies = await researcherApi.getStudies();
        if (isCurrent && Array.isArray(studies) && studies.length > 0) {
          setStudiesList(studies);
          setSelectedStudy(studies[0]);
        }
      } catch (err) {
        if (isCurrent) {
          console.error("[ProtocolBuilder] Error loading studies list:", err);
        }
      } finally {
        if (isCurrent) {
          setLoadingStudies(false);
        }
      }
    }

    loadAllStudies();

    return () => {
      isCurrent = false;
    };
  }, [selectedStudy]);

  // Load Protocol via GET /api/studies/<identifier>/protocol
  useEffect(() => {
    if (!identifier) return;

    let isCurrent = true;

    async function loadProtocolData() {
      setLoadingProtocol(true);
      setApiError(null);
      setSaveStatus(null);

      try {
        const existing = await researcherApi.getProtocol(identifier);
        if (isCurrent) {
          if (existing) {
            setRawProtocol(existing);
            setProtocolData(mapProtocolToForm(existing, selectedStudy));
            setHasExistingProtocol(true);
          } else {
            // No protocol found (404) -> blank form for creation
            setRawProtocol(null);
            setProtocolData(getInitialProtocolForm(selectedStudy));
            setHasExistingProtocol(false);
          }
        }
      } catch (err) {
        if (isCurrent) {
          console.error("[ProtocolBuilder] Error fetching protocol:", err);
          if (err.status === 404) {
            setRawProtocol(null);
            setProtocolData(getInitialProtocolForm(selectedStudy));
            setHasExistingProtocol(false);
          } else {
            setApiError(
              err.message || `Failed to load protocol for study #${identifier}.`
            );
          }
        }
      } finally {
        if (isCurrent) {
          setLoadingProtocol(false);
        }
      }
    }

    loadProtocolData();

    return () => {
      isCurrent = false;
    };
  }, [identifier, selectedStudy, fetchTrigger]);

  const handleRetry = () => {
    setFetchTrigger((prev) => prev + 1);
  };

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProtocolData((prev) => ({ ...prev, [name]: value }));
    setSaveStatus(null);
  };

  // Section completion status logic
  const sectionCompletions = useMemo(() => {
    return {
      info: Boolean(protocolData.protocol_title?.trim()),
      background: Boolean(
        protocolData.background?.trim() ||
        protocolData.rationale?.trim() ||
        protocolData.research_question?.trim()
      ),
      objectives: Boolean(protocolData.primary_objective?.trim()),
      design: Boolean(protocolData.study_type?.trim() && protocolData.study_design?.trim()),
      participants: Boolean(
        protocolData.target_population?.trim() || protocolData.inclusion_criteria?.trim()
      ),
      intervention: Boolean(
        protocolData.intervention_name?.trim() || protocolData.dosage?.trim()
      ),
      outcomes: Boolean(
        protocolData.primary_outcomes?.trim() || protocolData.safety_monitoring?.trim()
      ),
    };
  }, [protocolData]);

  // Dynamic progress percentage calculation
  const progressPercentage = useMemo(() => {
    const total = PROTOCOL_SECTIONS.length;
    const completedCount = Object.values(sectionCompletions).filter(Boolean).length;
    return Math.round((completedCount / total) * 100);
  }, [sectionCompletions]);

  // Progressive Draft Saving (POST if new, PUT if existing)
  const handleSaveProtocol = async () => {
    if (!identifier || saving) return;

    setSaving(true);
    setSaveStatus("saving");
    setSaveMessage("Saving protocol draft to backend...");
    setApiError(null);

    // Merge with existing raw protocol to preserve unknown server fields
    const payload = {
      ...(rawProtocol || {}),
      ...protocolData,
      study_id: identifier,
      updated_at: new Date().toISOString(),
    };

    try {
      let result;
      if (hasExistingProtocol) {
        result = await researcherApi.updateProtocol(identifier, payload);
      } else {
        result = await researcherApi.createProtocol(identifier, payload);
      }

      const savedData = (result && (result.protocol || result.data)) || result || payload;
      setRawProtocol(savedData);
      setHasExistingProtocol(true);
      setSaveStatus("success");
      setSaveMessage(
        hasExistingProtocol
          ? "Protocol draft updated successfully."
          : "Protocol created and saved successfully."
      );

      // Clear success notification after 4 seconds
      setTimeout(() => {
        setSaveStatus((current) => (current === "success" ? null : current));
      }, 4000);
    } catch (err) {
      console.error("[ProtocolBuilder] Save error:", err);
      setSaveStatus("error");
      setSaveMessage(
        err.message || "Failed to save protocol draft. Please check your backend connection."
      );
    } finally {
      setSaving(false);
    }
  };

  // Section Navigation Handlers
  const handleNextSection = () => {
    if (activeSectionIdx < PROTOCOL_SECTIONS.length - 1) {
      setActiveSectionIdx((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    if (activeSectionIdx > 0) {
      setActiveSectionIdx((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle Empty State when no studies are in database
  if (!selectedStudy && !loadingStudies) {
    return (
      <div className="f3-page-container">
        <div className="f3-page-header">
          <div>
            <span className="f3-eyebrow">RESEARCH METHODOLOGY</span>
            <h1>Protocol Builder</h1>
            <p>Standardized clinical research protocol configuration for Ayurveda trials.</p>
          </div>
        </div>

        <div className="f3-empty-state-card">
          <div className="f3-empty-state-icon">📝</div>
          <h2>No Active Study Available</h2>
          <p>
            Please create a research study first or select an existing study to initialize
            its standardized protocol builder.
          </p>
          <div className="f3-empty-state-actions">
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
            >
              + Create New Study
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentSection = PROTOCOL_SECTIONS[activeSectionIdx];

  return (
    <div className="f3-page-container">
      {/* Top Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">STANDARDIZED PROTOCOL BUILDER</span>
          <h1>Protocol Builder</h1>
          <p>
            Define clinical trial methodology, dosing parameters, inclusion boundaries,
            and safety outcomes according to Good Clinical Practice (GCP) and AYUSH guidelines.
          </p>
        </div>

        <div className="f3-header-actions">
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
          >
            ← My Studies
          </button>
          {identifier && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, selectedStudy)}
            >
              Study Details
            </button>
          )}
          {identifier && (
            <button
              type="button"
              className="f3-btn f3-btn-primary"
              onClick={() => onSelectTab(WORKSPACE_TABS.DOCUMENTS, selectedStudy)}
              title="Manage and upload documents for this study"
            >
              <span>📁 Documents</span>
              <span className="f3-btn-arrow">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Study Selector / Active Context Banner */}
      <div className="f3-protocol-context-banner">
        <div className="f3-protocol-banner-left">
          <div className="f3-context-icon">🔬</div>
          <div className="f3-context-info">
            <div className="f3-context-tag-row">
              <span className="f3-context-tag">ACTIVE STUDY CONTEXT</span>
              <StudyStatusBadge status={selectedStudy?.status || "draft"} />
              <span className="f3-protocol-status-badge">
                {hasExistingProtocol ? "Protocol Draft Active" : "No Protocol Created Yet"}
              </span>
            </div>
            <h2 className="f3-context-title">
              {selectedStudy?.title || "Untitled Research Study"}
            </h2>
            <div className="f3-context-sub-row">
              <span>
                <strong>Study ID:</strong> #{identifier}
              </span>
              {selectedStudy?.protocol_number && (
                <span>
                  <strong>Protocol ID:</strong> {selectedStudy.protocol_number}
                </span>
              )}
              {selectedStudy?.study_type && (
                <span>
                  <strong>Type:</strong> {selectedStudy.study_type}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Study Switcher dropdown if multiple studies exist */}
        {studiesList.length > 1 && (
          <div className="f3-protocol-switcher">
            <label htmlFor="protocol-study-select">Switch Study:</label>
            <select
              id="protocol-study-select"
              className="f3-input f3-select f3-select-sm"
              value={identifier}
              onChange={(e) => {
                const target = studiesList.find(
                  (s) => String(s.id ?? s.study_id) === e.target.value
                );
                if (target) {
                  setSelectedStudy(target);
                }
              }}
            >
              {studiesList.map((s) => (
                <option key={s.id ?? s.study_id} value={s.id ?? s.study_id}>
                  #{s.id ?? s.study_id} — {s.title?.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Progress Indicator Bar */}
      <div className="f3-protocol-progress-card">
        <div className="f3-progress-header">
          <div className="f3-progress-title-group">
            <span className="f3-progress-step-text">
              Section {activeSectionIdx + 1} of {PROTOCOL_SECTIONS.length}:{" "}
              <strong>{currentSection.title}</strong>
            </span>
            <span className="f3-progress-percent">
              Progress: <strong>{progressPercentage}% Completed</strong>
            </span>
          </div>
          <div className="f3-progress-bar-bg">
            <div
              className="f3-progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* API Error Notification */}
      {apiError && (
        <div className="f3-alert-box f3-alert-error">
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Protocol Load Notice</strong>
            <p>{apiError}</p>
          </div>
          <button
            type="button"
            className="f3-btn f3-btn-secondary f3-btn-sm"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Save Status Notification */}
      {saveStatus === "success" && (
        <div className="f3-alert-box f3-alert-success">
          <span className="f3-alert-icon">✓</span>
          <div className="f3-alert-content">
            <strong>Draft Saved Successfully</strong>
            <p>{saveMessage}</p>
          </div>
        </div>
      )}

      {saveStatus === "error" && (
        <div className="f3-alert-box f3-alert-error">
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Save Failed</strong>
            <p>{saveMessage}</p>
          </div>
        </div>
      )}

      {/* Main Builder Workspace (Stepper Nav + Section Form) */}
      <div className="f3-protocol-builder-layout">
        {/* Left Vertical Section Stepper */}
        <nav className="f3-protocol-stepper">
          <div className="f3-stepper-title">PROTOCOL WORKFLOW</div>

          {PROTOCOL_SECTIONS.map((sec, idx) => {
            const isActive = idx === activeSectionIdx;
            const isDone = sectionCompletions[sec.key];

            return (
              <button
                key={sec.id}
                type="button"
                className={`f3-step-btn ${isActive ? "f3-step-btn-active" : ""} ${
                  isDone ? "f3-step-btn-done" : ""
                }`}
                onClick={() => {
                  setActiveSectionIdx(idx);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <span className="f3-step-indicator">
                  {isDone ? "✓" : `0${sec.id}`}
                </span>
                <div className="f3-step-text-group">
                  <span className="f3-step-label">{sec.shortTitle}</span>
                  <span className="f3-step-sub">{sec.title}</span>
                </div>
                {isActive && <span className="f3-step-active-dot" />}
              </button>
            );
          })}
        </nav>

        {/* Right Active Section Form */}
        <div className="f3-protocol-form-panel">
          {loadingProtocol ? (
            <div className="f3-loading-container">
              <div className="f3-loader-spinner"></div>
              <p>Loading protocol sections from server...</p>
            </div>
          ) : (
            <div className="f3-protocol-section-card">
              {/* Section Header */}
              <div className="f3-section-title-row">
                <div className="f3-section-badge-wrap">
                  <span className="f3-section-icon">{currentSection.icon}</span>
                  <div>
                    <span className="f3-section-num-tag">
                      SECTION {currentSection.id} OF {PROTOCOL_SECTIONS.length}
                    </span>
                    <h3 className="f3-section-heading-title">{currentSection.title}</h3>
                  </div>
                </div>

                <button
                  type="button"
                  className={`f3-btn ${hasExistingProtocol ? "f3-btn-secondary" : "f3-btn-primary"}`}
                  onClick={handleSaveProtocol}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="f3-refresh-icon f3-spinning">↻</span>
                      <span>Saving...</span>
                    </>
                  ) : hasExistingProtocol ? (
                    <span>Save Draft</span>
                  ) : (
                    <span>Create Protocol</span>
                  )}
                </button>
              </div>

              {/* Form Content By Section */}
              <form onSubmit={(e) => e.preventDefault()}>
                {/* SECTION 1 — PROTOCOL INFORMATION */}
                {activeSectionIdx === 0 && (
                  <div className="f3-section-fields">
                    <div className="f3-form-group">
                      <label htmlFor="p-title">Protocol Title</label>
                      <input
                        id="p-title"
                        name="protocol_title"
                        type="text"
                        className="f3-input"
                        placeholder="e.g. Standardized Clinical Protocol for Ashwagandha"
                        value={protocolData.protocol_title}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-version">Protocol Version</label>
                        <input
                          id="p-version"
                          name="protocol_version"
                          type="text"
                          className="f3-input f3-font-mono"
                          placeholder="e.g. 1.0"
                          value={protocolData.protocol_version}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-date">Protocol Date</label>
                        <input
                          id="p-date"
                          name="protocol_date"
                          type="date"
                          className="f3-input"
                          value={protocolData.protocol_date}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-pi">Principal Investigator</label>
                        <input
                          id="p-pi"
                          name="principal_investigator"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Dr. Rajesh Sharma, MD (Ayu)"
                          value={protocolData.principal_investigator}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-sponsor">Sponsor / Funding Agency</label>
                        <input
                          id="p-sponsor"
                          name="sponsor"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Ministry of AYUSH / Institutional Grant"
                          value={protocolData.sponsor}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 2 — BACKGROUND */}
                {activeSectionIdx === 1 && (
                  <div className="f3-section-fields">
                    <div className="f3-form-group">
                      <label htmlFor="p-bg">Background & Classical References</label>
                      <textarea
                        id="p-bg"
                        name="background"
                        className="f3-textarea"
                        rows={4}
                        placeholder="Describe the clinical background, Ayurvedic classical texts cited (Charaka Samhita, Sushruta Samhita, etc.)..."
                        value={protocolData.background}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-rationale">Scientific Rationale</label>
                      <textarea
                        id="p-rationale"
                        name="rationale"
                        className="f3-textarea"
                        rows={3}
                        placeholder="Provide scientific reasoning, pharmacokinetic rationale, and trial necessity..."
                        value={protocolData.rationale}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-rq">Research Question</label>
                      <textarea
                        id="p-rq"
                        name="research_question"
                        className="f3-textarea"
                        rows={2}
                        placeholder="Define the specific research hypothesis and primary investigative question..."
                        value={protocolData.research_question}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 3 — OBJECTIVES */}
                {activeSectionIdx === 2 && (
                  <div className="f3-section-fields">
                    <div className="f3-form-group">
                      <label htmlFor="p-primary-obj">Primary Objective</label>
                      <textarea
                        id="p-primary-obj"
                        name="primary_objective"
                        className="f3-textarea"
                        rows={3}
                        placeholder="State the definitive primary endpoint and measurable therapeutic goal..."
                        value={protocolData.primary_objective}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-sec-obj">Secondary Objectives</label>
                      <textarea
                        id="p-sec-obj"
                        name="secondary_objectives"
                        className="f3-textarea"
                        rows={4}
                        placeholder="Enumerate exploratory endpoints, biomarker evaluations, and quality of life assessments..."
                        value={protocolData.secondary_objectives}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 4 — STUDY DESIGN */}
                {activeSectionIdx === 3 && (
                  <div className="f3-section-fields">
                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-study-type">Study Type</label>
                        <input
                          id="p-study-type"
                          name="study_type"
                          type="text"
                          className="f3-input"
                          value={protocolData.study_type}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-study-design">Study Design</label>
                        <input
                          id="p-study-design"
                          name="study_design"
                          type="text"
                          className="f3-input"
                          value={protocolData.study_design}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-phase">Study Phase</label>
                        <select
                          id="p-phase"
                          name="study_phase"
                          className="f3-input f3-select"
                          value={protocolData.study_phase}
                          onChange={handleChange}
                        >
                          <option value="Phase I (Safety & Tolerability)">Phase I (Safety & Tolerability)</option>
                          <option value="Phase II (Therapeutic Exploratory)">Phase II (Therapeutic Exploratory)</option>
                          <option value="Phase III (Therapeutic Confirmatory)">Phase III (Therapeutic Confirmatory)</option>
                          <option value="Phase IV (Post-Marketing Surveillance)">Phase IV (Post-Marketing Surveillance)</option>
                          <option value="Pilot / Feasibility Study">Pilot / Feasibility Study</option>
                        </select>
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-duration">Study Duration</label>
                        <input
                          id="p-duration"
                          name="study_duration"
                          type="text"
                          className="f3-input"
                          value={protocolData.study_duration}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-rand">Randomization</label>
                        <input
                          id="p-rand"
                          name="randomization"
                          type="text"
                          className="f3-input"
                          value={protocolData.randomization}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-blind">Blinding</label>
                        <input
                          id="p-blind"
                          name="blinding"
                          type="text"
                          className="f3-input"
                          value={protocolData.blinding}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-control">Control Type</label>
                      <input
                        id="p-control"
                        name="control_type"
                        type="text"
                        className="f3-input"
                        value={protocolData.control_type}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 5 — PARTICIPANTS */}
                {activeSectionIdx === 4 && (
                  <div className="f3-section-fields">
                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-pop">Target Population</label>
                        <input
                          id="p-pop"
                          name="target_population"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Ambulatory patients with Vataja/Kaphaja Prakriti"
                          value={protocolData.target_population}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-samplesize">Sample Size</label>
                        <input
                          id="p-samplesize"
                          name="sample_size"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. 60 (30 intervention + 30 control)"
                          value={protocolData.sample_size}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-min-age">Minimum Age (Years)</label>
                        <input
                          id="p-min-age"
                          name="minimum_age"
                          type="text"
                          className="f3-input"
                          value={protocolData.minimum_age}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-max-age">Maximum Age (Years)</label>
                        <input
                          id="p-max-age"
                          name="maximum_age"
                          type="text"
                          className="f3-input"
                          value={protocolData.maximum_age}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-gender">Gender Criteria</label>
                      <input
                        id="p-gender"
                        name="gender_criteria"
                        type="text"
                        className="f3-input"
                        value={protocolData.gender_criteria}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-inclusion">Inclusion Criteria</label>
                      <textarea
                        id="p-inclusion"
                        name="inclusion_criteria"
                        className="f3-textarea"
                        rows={4}
                        placeholder="List specific inclusion criteria (clinical parameters, diagnostic confirmations, signed informed consent)..."
                        value={protocolData.inclusion_criteria}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-exclusion">Exclusion Criteria</label>
                      <textarea
                        id="p-exclusion"
                        name="exclusion_criteria"
                        className="f3-textarea"
                        rows={4}
                        placeholder="List specific exclusion criteria (systemic comorbidities, pregnancy, concurrent medication usage)..."
                        value={protocolData.exclusion_criteria}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 6 — INTERVENTION */}
                {activeSectionIdx === 5 && (
                  <div className="f3-section-fields">
                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-int-name">Intervention / Drug Name</label>
                        <input
                          id="p-int-name"
                          name="intervention_name"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Ashwagandha Ghana Vati"
                          value={protocolData.intervention_name}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-dosage">Dosage & Strength</label>
                        <input
                          id="p-dosage"
                          name="dosage"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. 500 mg per tablet"
                          value={protocolData.dosage}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-grid-2col">
                      <div className="f3-form-group">
                        <label htmlFor="p-route">Route of Administration</label>
                        <input
                          id="p-route"
                          name="route"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Oral"
                          value={protocolData.route}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="f3-form-group">
                        <label htmlFor="p-freq">Frequency & Anupana</label>
                        <input
                          id="p-freq"
                          name="frequency"
                          type="text"
                          className="f3-input"
                          placeholder="e.g. Twice daily after food with Ksheera (milk)"
                          value={protocolData.frequency}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-int-duration">Intervention Duration</label>
                      <input
                        id="p-int-duration"
                        name="intervention_duration"
                        type="text"
                        className="f3-input"
                        placeholder="e.g. 12 Weeks"
                        value={protocolData.intervention_duration}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-int-desc">Botanical Formulation & Manufacturing Details</label>
                      <textarea
                        id="p-int-desc"
                        name="intervention_description"
                        className="f3-textarea"
                        rows={4}
                        placeholder="Specify botanical ingredients, extraction ratio, standardization markers (withanolides %), GMP certification..."
                        value={protocolData.intervention_description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}

                {/* SECTION 7 — OUTCOMES & SAFETY */}
                {activeSectionIdx === 6 && (
                  <div className="f3-section-fields">
                    <div className="f3-form-group">
                      <label htmlFor="p-primary-outcomes">Primary Outcomes & Measurement Timepoints</label>
                      <textarea
                        id="p-primary-outcomes"
                        name="primary_outcomes"
                        className="f3-textarea"
                        rows={3}
                        placeholder="Detail the primary outcome metrics, scoring criteria, and evaluation schedule (Day 0, Day 42, Day 84)..."
                        value={protocolData.primary_outcomes}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-sec-outcomes">Secondary Outcomes</label>
                      <textarea
                        id="p-sec-outcomes"
                        name="secondary_outcomes"
                        className="f3-textarea"
                        rows={3}
                        placeholder="Detail secondary endpoints, biomarker assays, and patient-reported outcomes..."
                        value={protocolData.secondary_outcomes}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-safety">Safety Monitoring Plan</label>
                      <textarea
                        id="p-safety"
                        name="safety_monitoring"
                        className="f3-textarea"
                        rows={3}
                        placeholder="Laboratory safety checks (LFT, KFT, CBC, ECG), interim monitoring committee oversight..."
                        value={protocolData.safety_monitoring}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="f3-form-group">
                      <label htmlFor="p-adverse">Adverse Event Reporting Procedure</label>
                      <textarea
                        id="p-adverse"
                        name="adverse_event_reporting"
                        className="f3-textarea"
                        rows={3}
                        placeholder="Protocols for recording, categorizing (Naranjo algorithm), and expediting SAE reporting to the Institutional Ethics Committee (IEC)..."
                        value={protocolData.adverse_event_reporting}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                )}
              </form>

              {/* Bottom Step Navigation Bar */}
              <div className="f3-stepper-footer">
                <button
                  type="button"
                  className="f3-btn f3-btn-secondary"
                  onClick={handlePrevSection}
                  disabled={activeSectionIdx === 0}
                >
                  ← Previous Section
                </button>

                <div className="f3-stepper-footer-right">
                  <button
                    type="button"
                    className={`f3-btn ${hasExistingProtocol ? "f3-btn-secondary" : "f3-btn-primary"}`}
                    onClick={handleSaveProtocol}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="f3-refresh-icon f3-spinning">↻</span>
                        <span>Saving...</span>
                      </>
                    ) : hasExistingProtocol ? (
                      <span>Save Draft</span>
                    ) : (
                      <span>Create Protocol</span>
                    )}
                  </button>

                  <button
                    type="button"
                    className="f3-btn f3-btn-primary"
                    onClick={handleNextSection}
                    disabled={activeSectionIdx === PROTOCOL_SECTIONS.length - 1}
                  >
                    <span>Next Section</span>
                    <span className="f3-btn-arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProtocolBuilderPage;
