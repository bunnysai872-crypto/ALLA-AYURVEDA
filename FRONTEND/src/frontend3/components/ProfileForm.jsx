import React, { useState, useEffect } from "react";
import profileApi from "../services/profileApi";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * ProfileForm Component
 * 
 * Form interface for viewing current user credentials,
 * institutional affiliations, and updating supported profile fields.
 */
export function ProfileForm({ user, onProfileUpdated }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "",
    affiliation: "",
    specialization: "",
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        role: user.role || "researcher",
        affiliation: user.affiliation || "All India Institute of Ayurveda (AIIA)",
        specialization: user.specialization || "Dravyaguna & Kayachikitsa Clinical Research",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const updated = await profileApi.updateProfile({
        full_name: formData.full_name.trim(),
        affiliation: formData.affiliation.trim(),
        specialization: formData.specialization.trim(),
      });

      setSuccessMsg("Profile information updated successfully.");
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      setTimeout(() => {
        setSuccessMsg(null);
      }, 4000);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMsg && (
        <div className="f3-alert-box f3-alert-success" style={{ marginBottom: "16px" }}>
          <span className="f3-alert-icon">✓</span>
          <div className="f3-alert-content">
            <strong>Update Saved</strong>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "16px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Update Error</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Editable: Full Name */}
      <div className="f3-form-group" style={{ marginBottom: "16px" }}>
        <label htmlFor="p-fullname">Principal Investigator / Researcher Full Name *</label>
        <input
          id="p-fullname"
          name="full_name"
          type="text"
          className="f3-input"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
        <span style={{ fontSize: "11px", color: "var(--f3-text-muted)", marginTop: "4px" }}>
          Displayed on research protocols, study submissions, and audit trails.
        </span>
      </div>

      {/* Read-Only: Email */}
      <div className="f3-form-group" style={{ marginBottom: "16px" }}>
        <label htmlFor="p-email">Registered Email Address (Primary Identity)</label>
        <input
          id="p-email"
          name="email"
          type="email"
          className="f3-input"
          value={formData.email}
          disabled
          style={{ opacity: 0.7, cursor: "not-allowed" }}
        />
        <span style={{ fontSize: "11px", color: "var(--f3-text-muted)", marginTop: "4px" }}>
          🔒 Email address is tied to your JWT login credentials and cannot be modified.
        </span>
      </div>

      {/* Read-Only: Role */}
      <div className="f3-form-group" style={{ marginBottom: "16px" }}>
        <label htmlFor="p-role">System Authorization Role</label>
        <input
          id="p-role"
          name="role"
          type="text"
          className="f3-input"
          value={formData.role ? formData.role.replace(/_/g, " ").toUpperCase() : "RESEARCHER"}
          disabled
          style={{ opacity: 0.7, cursor: "not-allowed" }}
        />
        <span style={{ fontSize: "11px", color: "var(--f3-text-muted)", marginTop: "4px" }}>
          🔒 Role is governed by Institutional Ethics Committee (IEC) administrator policies.
        </span>
      </div>

      {/* Editable: Institutional Affiliation */}
      <div className="f3-form-group" style={{ marginBottom: "16px" }}>
        <label htmlFor="p-affiliation">Institutional Affiliation / Hospital</label>
        <input
          id="p-affiliation"
          name="affiliation"
          type="text"
          className="f3-input"
          value={formData.affiliation}
          onChange={handleChange}
          placeholder="e.g. All India Institute of Ayurveda, New Delhi"
        />
      </div>

      {/* Editable: Research Focus / Specialization */}
      <div className="f3-form-group" style={{ marginBottom: "20px" }}>
        <label htmlFor="p-specialization">Ayurvedic Clinical Specialization & Focus</label>
        <input
          id="p-specialization"
          name="specialization"
          type="text"
          className="f3-input"
          value={formData.specialization}
          onChange={handleChange}
          placeholder="e.g. Dravyaguna Vigyan, Rasayana Therapy, Standardization"
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="f3-btn f3-btn-primary"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="f3-refresh-icon f3-spinning">↻</span>
              <span>Saving Changes...</span>
            </>
          ) : (
            <span>Save Profile Information</span>
          )}
        </button>
      </div>
    </form>
  );
}

export default ProfileForm;
