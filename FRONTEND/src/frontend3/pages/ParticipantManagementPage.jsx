import React, { useState, useEffect, useCallback } from "react";
import participantApi from "../services/participantApi";
import InformedConsentModal from "../components/InformedConsentModal";
import "../styles/ParticipantModule.css";
import "../styles/RegulatoryModule.css";

export function ParticipantManagementPage({ activeStudy, onSelectTab }) {
  const studyIdentifier = activeStudy?.id ?? activeStudy?.study_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studyData, setStudyData] = useState(activeStudy || null);
  const [stats, setStats] = useState({});
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consentFilter, setConsentFilter] = useState("all");

  // Add Participant Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    participant_id: "",
    initials: "",
    age: "",
    gender: "Male",
    prakriti: "Vata-Pitta",
    screening_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [addError, setAddError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Consent Modal State
  const [consentModalParticipant, setConsentModalParticipant] = useState(null);

  // Status Change Inline State
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!studyIdentifier) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await participantApi.getParticipants(studyIdentifier, {
        search,
        status: statusFilter,
        consent: consentFilter,
      });

      if (res.success && res.data) {
        setStudyData(res.data.study);
        setStats(res.data.stats || {});
        setParticipants(res.data.participants || []);
      } else {
        setError(res.message || "Failed to load participants.");
      }
    } catch (err) {
      console.error("Error loading participants:", err);
      setError(err.message || "Unable to load participants for this study.");
    } finally {
      setLoading(false);
    }
  }, [studyIdentifier, search, statusFilter, consentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError(null);

    try {
      const payload = {
        ...newParticipant,
        age: newParticipant.age ? parseInt(newParticipant.age, 10) : null,
      };

      const res = await participantApi.addParticipant(studyIdentifier, payload);
      if (res.success) {
        setAddModalOpen(false);
        setNewParticipant({
          participant_id: "",
          initials: "",
          age: "",
          gender: "Male",
          prakriti: "Vata-Pitta",
          screening_date: new Date().toISOString().slice(0, 10),
          notes: "",
        });
        await loadData();
      } else {
        setAddError(res.message || "Failed to register participant.");
      }
    } catch (err) {
      console.error("Error registering participant:", err);
      setAddError(err.message || "Registration failed.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleStatusChange = async (participant, newStatus) => {
    if (participant.status === newStatus) return;
    setUpdatingId(participant.participant_id || participant.id);

    try {
      const res = await participantApi.updateParticipantStatus(
        studyIdentifier,
        participant.participant_id || participant.id,
        { status: newStatus }
      );
      if (res.success) {
        await loadData();
      } else {
        alert(res.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert(err.message || "Failed to update participant status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "screened":
        return <span className="part-badge part-badge-screened">Screened</span>;
      case "eligible":
        return <span className="part-badge part-badge-eligible">Eligible</span>;
      case "enrolled":
        return <span className="part-badge part-badge-enrolled">✓ Enrolled</span>;
      case "active":
        return <span className="part-badge part-badge-active">★ Active</span>;
      case "completed":
        return <span className="part-badge part-badge-completed">Completed</span>;
      case "withdrawn":
        return <span className="part-badge part-badge-withdrawn">Withdrawn</span>;
      default:
        return <span className="part-badge part-badge-screened">{status}</span>;
    }
  };

  const getConsentBadge = (consent) => {
    const s = (consent?.status || "Not Started").toLowerCase();
    switch (s) {
      case "consented":
        return <span className="part-badge consent-badge-consented">✓ Consented</span>;
      case "consent pending":
        return <span className="part-badge consent-badge-pending">⏳ Consent Pending</span>;
      case "declined":
        return <span className="part-badge consent-badge-declined">✕ Declined</span>;
      case "withdrawn":
        return <span className="part-badge consent-badge-withdrawn">⊘ Withdrawn</span>;
      default:
        return <span className="part-badge consent-badge-notstarted">Not Started</span>;
    }
  };

  if (!studyIdentifier) {
    return (
      <div className="part-module-container">
        <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(18, 30, 26, 0.6)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontSize: "2.5rem" }}>🔍</span>
          <h2 style={{ color: "#ffffff", margin: "12px 0 6px 0" }}>No Study Selected</h2>
          <p style={{ color: "#94a3b8", maxWidth: "460px", margin: "0 auto 20px auto", fontSize: "0.9rem" }}>
            Please select an active clinical study from "My Studies" to manage participant recruitment and informed consent.
          </p>
          <button
            type="button"
            className="reg-btn reg-btn-primary"
            onClick={() => onSelectTab && onSelectTab("my-studies")}
          >
            Go to My Studies →
          </button>
        </div>
      </div>
    );
  }

  // If study is not activated, show safety guard lockout
  const isActivated = (studyData?.status || "").toLowerCase() === "activated";

  return (
    <div className="part-module-container">
      {/* Header */}
      <div className="part-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="reg-header-tag">CLINICAL COHORT MANAGEMENT</span>
            <span className={`reg-badge ${isActivated ? "reg-badge-activated" : "reg-badge-warning"}`}>
              {isActivated ? "✓ STUDY ACTIVATED" : `LOCKED (${studyData?.status?.toUpperCase()})`}
            </span>
          </div>
          <h1 className="reg-header-title">
            Participant Management: {studyData?.title || `Study #${studyIdentifier}`}
          </h1>
          <p className="reg-header-subtitle">
            Track study participant recruitment, screening eligibility, informed consent, and active trial cohorts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="reg-btn reg-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("study-details", activeStudy)}
          >
            ← Study Dossier
          </button>
          <button
            type="button"
            className="reg-btn reg-btn-primary"
            disabled={!isActivated}
            onClick={() => setAddModalOpen(true)}
            title={!isActivated ? "Study must be activated to register participants" : "Register a new participant"}
          >
            + Register Participant
          </button>
        </div>
      </div>

      {!isActivated && (
        <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid #f59e0b", borderRadius: "12px", padding: "20px 24px", color: "#fef3c7" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.5rem" }}>🔒</span>
            <h3 style={{ margin: 0, color: "#fbbf24" }}>Participant Recruitment Is Locked</h3>
          </div>
          <p style={{ margin: "8px 0 12px 0", fontSize: "0.88rem", color: "#fef3c7", lineHeight: 1.5 }}>
            Study <strong>{studyData?.study_id || studyIdentifier}</strong> is currently in <strong>'{studyData?.status}'</strong> status. Under clinical research guidelines, participant recruitment and informed consent administration are unlocked only after Institutional Ethics Committee (IEC) approval and formal Study Activation.
          </p>
          <button
            type="button"
            className="reg-btn reg-btn-secondary"
            onClick={() => onSelectTab && onSelectTab("study-details", activeStudy)}
            style={{ fontSize: "0.8rem" }}
          >
            Check Study Approval & Regulatory Progress →
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="part-metrics-grid">
        <div className="part-metric-card">
          <span className="part-metric-title">Total Registered</span>
          <span className="part-metric-value">{stats.total ?? 0}</span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Target: {stats.target_sample_size || "Not set"}
          </span>
        </div>
        <div className="part-metric-card">
          <span className="part-metric-title">Consented</span>
          <span className="part-metric-value" style={{ color: "#34d399" }}>
            {stats.consented ?? 0}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Informed Consent confirmed</span>
        </div>
        <div className="part-metric-card">
          <span className="part-metric-title">Enrolled</span>
          <span className="part-metric-value" style={{ color: "#60a5fa" }}>
            {stats.enrolled ?? 0}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Formally admitted</span>
        </div>
        <div className="part-metric-card">
          <span className="part-metric-title">Active Cohort</span>
          <span className="part-metric-value" style={{ color: "#facc15" }}>
            {stats.active ?? 0}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>On active Ayurveda therapy</span>
        </div>
        <div className="part-metric-card">
          <span className="part-metric-title">Completed</span>
          <span className="part-metric-value" style={{ color: "#c084fc" }}>
            {stats.completed ?? 0}
          </span>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Protocol finished</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="reg-controls-bar">
        <input
          type="text"
          className="reg-search-input"
          placeholder="Search by ID, initials, prakriti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            className="reg-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Lifecycle States</option>
            <option value="Screened">Screened</option>
            <option value="Eligible">Eligible</option>
            <option value="Enrolled">Enrolled</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>

          <select
            className="reg-filter-select"
            value={consentFilter}
            onChange={(e) => setConsentFilter(e.target.value)}
          >
            <option value="all">All Consent States</option>
            <option value="Consented">Consented</option>
            <option value="Consent Pending">Consent Pending</option>
            <option value="Not Started">Not Started</option>
            <option value="Declined">Declined</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          <div className="reg-spinner" />
          <p>Loading participants for study #{studyIdentifier}...</p>
        </div>
      ) : error ? (
        <div style={{ padding: "20px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "10px", color: "#fca5a5" }}>
          {error}
        </div>
      ) : participants.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(18, 30, 26, 0.5)", borderRadius: "12px" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
            {isActivated
              ? "No participants registered yet. Click '+ Register Participant' to screen your first subject."
              : "No participants can be enrolled until study activation is complete."}
          </p>
        </div>
      ) : (
        <div className="reg-table-container">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Participant ID</th>
                <th>Demographics</th>
                <th>Ayurvedic Prakriti</th>
                <th>Screening Date</th>
                <th>Consent Status</th>
                <th>Trial Lifecycle Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "0.95rem" }}>
                      {p.participant_id}
                    </strong>
                    {p.screening_number && (
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        Screening: {p.screening_number}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: "#f1f5f9" }}>
                      {p.initials ? `Initials: ${p.initials}` : "—"}
                    </span>
                    <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                      {p.age ? `${p.age} yrs` : "Age —"} • {p.gender || "—"}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                      {p.prakriti || "Not evaluated"}
                    </span>
                  </td>
                  <td>{p.screening_date || "—"}</td>
                  <td>{getConsentBadge(p.consent)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {getStatusBadge(p.status)}
                      <select
                        style={{
                          background: "rgba(10, 18, 15, 0.9)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "4px",
                          color: "#cbd5e1",
                          fontSize: "0.75rem",
                          padding: "2px 4px",
                          cursor: "pointer",
                        }}
                        value={p.status}
                        disabled={updatingId === p.participant_id}
                        onChange={(e) => handleStatusChange(p, e.target.value)}
                        title="Change participant lifecycle state"
                      >
                        <option value="Screened">Screened</option>
                        <option value="Eligible">Eligible</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="reg-btn reg-btn-gold"
                      style={{ padding: "4px 10px", fontSize: "0.76rem" }}
                      onClick={() => setConsentModalParticipant(p)}
                    >
                      📜 Consent Workflow
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Participant Modal */}
      {addModalOpen && (
        <div className="reg-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div
            className="reg-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="reg-header-tag">NEW STUDY SUBJECT</span>
                <h2 style={{ margin: "6px 0 2px 0", color: "#ffffff", fontSize: "1.35rem" }}>
                  Register Participant
                </h2>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.82rem" }}>
                  Add a de-identified subject to study #{studyIdentifier}
                </p>
              </div>
              <button
                type="button"
                className="reg-btn-secondary"
                onClick={() => setAddModalOpen(false)}
                style={{ padding: "4px 10px", borderRadius: "50%", minWidth: "32px" }}
              >
                ✕
              </button>
            </div>

            {addError && (
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "0.84rem" }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddParticipant} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="reg-form-group">
                  <label className="reg-form-label">Subject ID (Leave blank to auto-generate)</label>
                  <input
                    type="text"
                    className="reg-form-input"
                    placeholder="e.g. SUBJ-001"
                    value={newParticipant.participant_id}
                    onChange={(e) => setNewParticipant({ ...newParticipant, participant_id: e.target.value })}
                  />
                </div>

                <div className="reg-form-group">
                  <label className="reg-form-label">Patient Initials (Non-sensitive)</label>
                  <input
                    type="text"
                    className="reg-form-input"
                    placeholder="e.g. R.K."
                    maxLength={10}
                    value={newParticipant.initials}
                    onChange={(e) => setNewParticipant({ ...newParticipant, initials: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="reg-form-group">
                  <label className="reg-form-label">Age (Years) *</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    className="reg-form-input"
                    placeholder="e.g. 45"
                    value={newParticipant.age}
                    onChange={(e) => setNewParticipant({ ...newParticipant, age: e.target.value })}
                    required
                  />
                </div>

                <div className="reg-form-group">
                  <label className="reg-form-label">Gender *</label>
                  <select
                    className="reg-form-select"
                    value={newParticipant.gender}
                    onChange={(e) => setNewParticipant({ ...newParticipant, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="reg-form-group">
                  <label className="reg-form-label">Ayurvedic Prakriti (Constitution) *</label>
                  <select
                    className="reg-form-select"
                    value={newParticipant.prakriti}
                    onChange={(e) => setNewParticipant({ ...newParticipant, prakriti: e.target.value })}
                  >
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridoshic">Tridoshic (Samadosha)</option>
                  </select>
                </div>

                <div className="reg-form-group">
                  <label className="reg-form-label">Screening Date *</label>
                  <input
                    type="date"
                    className="reg-form-input"
                    value={newParticipant.screening_date}
                    onChange={(e) => setNewParticipant({ ...newParticipant, screening_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="reg-form-group">
                <label className="reg-form-label">Screening Clinical Notes</label>
                <textarea
                  className="reg-form-textarea"
                  rows={2}
                  placeholder="Record screening eligibility observations, vital parameters, or notes..."
                  value={newParticipant.notes}
                  onChange={(e) => setNewParticipant({ ...newParticipant, notes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="reg-btn reg-btn-secondary"
                  onClick={() => setAddModalOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="reg-btn reg-btn-primary"
                  disabled={isAdding}
                >
                  {isAdding ? "Registering..." : "Register Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Informed Consent Workflow Modal */}
      {consentModalParticipant && (
        <InformedConsentModal
          participant={consentModalParticipant}
          studyId={studyIdentifier}
          isOpen={Boolean(consentModalParticipant)}
          onClose={() => setConsentModalParticipant(null)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}

export default ParticipantManagementPage;
