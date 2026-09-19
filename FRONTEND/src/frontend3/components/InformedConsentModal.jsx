import React, { useState, useEffect } from "react";
import participantApi from "../services/participantApi";
import "../styles/ParticipantModule.css";
import "../styles/RegulatoryModule.css";

export function InformedConsentModal({
  participant,
  studyId,
  isOpen,
  onClose,
  onSuccess,
}) {
  if (!isOpen || !participant) return null;

  const currentConsent = participant.consent || {};
  const [status, setStatus] = useState(currentConsent.status || "Consent Pending");
  const [witnessName, setWitnessName] = useState(currentConsent.witness_name || "");
  const [language, setLanguage] = useState(currentConsent.language || "English");
  const [remarks, setRemarks] = useState(currentConsent.remarks || "");
  const [consentDate, setConsentDate] = useState(
    currentConsent.consent_date || new Date().toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (participant?.consent) {
      setStatus(participant.consent.status || "Consent Pending");
      setWitnessName(participant.consent.witness_name || "");
      setLanguage(participant.consent.language || "English");
      setRemarks(participant.consent.remarks || "");
      setConsentDate(
        participant.consent.consent_date || new Date().toISOString().slice(0, 16)
      );
    }
  }, [participant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        status,
        witness_name: witnessName,
        language,
        remarks,
        consent_date: consentDate,
      };

      const res = await participantApi.recordConsent(
        studyId,
        participant.participant_id || participant.id,
        payload
      );

      if (res.success) {
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || "Failed to record informed consent.");
      }
    } catch (err) {
      console.error("Error recording consent:", err);
      setError(err.message || "Failed to update consent status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConsentBadgeClass = (st) => {
    const s = (st || "").toLowerCase();
    if (s === "consented") return "consent-badge-consented";
    if (s === "consent pending") return "consent-badge-pending";
    if (s === "declined" || s === "withdrawn") return "consent-badge-declined";
    return "consent-badge-notstarted";
  };

  const auditTrail = currentConsent.audit_trail || [];

  return (
    <div className="reg-modal-backdrop" onClick={onClose}>
      <div
        className="reg-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="reg-header-tag">ETHICAL SAFEGUARD</span>
            <h2 style={{ margin: "6px 0 2px 0", color: "#ffffff", fontSize: "1.35rem" }}>
              Informed Consent Workflow
            </h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.84rem" }}>
              Participant: <strong style={{ color: "#38bdf8" }}>{participant.participant_id}</strong>
              {participant.initials ? ` (${participant.initials})` : ""} • Age: {participant.age || "—"} • Prakriti: {participant.prakriti || "—"}
            </p>
          </div>
          <button
            type="button"
            className="reg-btn-secondary"
            onClick={onClose}
            style={{ padding: "4px 10px", borderRadius: "50%", minWidth: "32px" }}
          >
            ✕
          </button>
        </div>

        {/* Current State & Document Info */}
        <div className="consent-document-box">
          <span className="consent-document-icon">📜</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ color: "#f1f5f9", fontSize: "0.9rem" }}>
                {currentConsent.consent_document?.name || "Approved Informed Consent Form"}
              </strong>
              <span className="reg-badge reg-badge-neutral">
                {currentConsent.consent_document?.version || "v1.0"}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", color: "#94a3b8", fontSize: "0.78rem" }}>
              Current Status:{" "}
              <span className={`part-badge ${getConsentBadgeClass(currentConsent.status)}`}>
                {currentConsent.status || "Not Started"}
              </span>
            </p>
          </div>
        </div>

        {/* Safety Warning */}
        <div className="consent-warning-banner">
          <span>⚠️</span>
          <span>
            <strong>Protocol Safety Guard:</strong> Clinical enrollment and study intervention are strictly blocked until Informed Consent is recorded in <strong>'Consented'</strong> status.
          </span>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "0.84rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="reg-form-group">
            <label className="reg-form-label">Consent Decision Status *</label>
            <select
              className="reg-form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="Consent Pending">Consent Pending (Discussion ongoing)</option>
              <option value="Consented">Consented (Signed voluntary consent)</option>
              <option value="Declined">Declined (Patient refused trial entry)</option>
              <option value="Withdrawn">Withdrawn (Consent revoked)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="reg-form-group">
              <label className="reg-form-label">Consent Date / Timestamp *</label>
              <input
                type="datetime-local"
                className="reg-form-input"
                value={consentDate}
                onChange={(e) => setConsentDate(e.target.value)}
                required
              />
            </div>

            <div className="reg-form-group">
              <label className="reg-form-label">Consent Language</label>
              <select
                className="reg-form-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Sanskrit">Sanskrit</option>
                <option value="Marathi">Marathi</option>
                <option value="Tamil">Tamil</option>
                <option value="Other Regional">Other Regional Language</option>
              </select>
            </div>
          </div>

          <div className="reg-form-group">
            <label className="reg-form-label">Independent Witness Name (If illiterate/verbal)</label>
            <input
              type="text"
              className="reg-form-input"
              placeholder="e.g., Dr. Ramesh Sharma / Next of Kin"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
            />
          </div>

          <div className="reg-form-group">
            <label className="reg-form-label">Consent Remarks & Verification Notes</label>
            <textarea
              className="reg-form-textarea"
              rows={2}
              placeholder="Record any specific consent considerations, patient clarifications, or translation details..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {auditTrail.length > 0 && (
            <div>
              <span className="reg-form-label" style={{ display: "block", marginBottom: "4px" }}>
                Consent Audit Trail ({auditTrail.length} entries)
              </span>
              <div className="consent-audit-list">
                {auditTrail.map((item, idx) => (
                  <div key={idx} className="consent-audit-item">
                    <span>
                      <strong style={{ color: "#34d399" }}>{item.to_status || item.status}</strong>
                      {item.consented_by?.full_name ? ` by ${item.consented_by.full_name}` : ""}
                    </span>
                    <span style={{ color: "#94a3b8" }}>
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
            <button
              type="button"
              className="reg-btn reg-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reg-btn reg-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Record Official Consent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InformedConsentModal;
