import React, { useState, useEffect } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import profileApi from "../services/profileApi";
import ProfileForm from "../components/ProfileForm";
import "../styles/ProfileModule.css";

/**
 * ALLA AYURVEDA — FRONTEND 3 — PHASE 4
 * ProfilePage Component
 * 
 * Researcher profile and credentials management workspace:
 * - View authenticated researcher information
 * - Edit supported profile fields (Name, Affiliation, Specialization)
 * - Security and compliance overview (JWT, scrypt encryption, GCP scope)
 */
export function ProfilePage({ onSelectTab }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadUserProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await profileApi.getProfile();
        if (isCurrent) {
          setProfile(data);
        }
      } catch (err) {
        if (isCurrent) {
          setError(err.message || "Failed to load user profile.");
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      isCurrent = false;
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return "R";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="f3-page-container">
      {/* Top Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">RESEARCHER CREDENTIALS & IDENTITY</span>
          <h1>Researcher Profile</h1>
          <p>
            Manage your investigator identity, institutional affiliations,
            and view authenticated permissions across the ALLA Ayurveda research platform.
          </p>
        </div>

        <div className="f3-header-actions">
          {onSelectTab && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={() => onSelectTab(WORKSPACE_TABS.DASHBOARD)}
            >
              ← Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "20px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Profile Load Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="f3-loading-container" style={{ padding: "60px 0" }}>
          <div className="f3-loader-spinner"></div>
          <p>Loading profile details...</p>
        </div>
      ) : (
        <>
          {/* Profile Hero Card */}
          <div className="f3-profile-hero">
            <div className="f3-profile-avatar">
              {getInitials(profile?.full_name)}
            </div>

            <div className="f3-profile-hero-info">
              <h2>{profile?.full_name || "Investigator"}</h2>
              <div className="f3-profile-hero-meta">
                <span>{profile?.email}</span>
                <span>•</span>
                <span className="f3-profile-role-badge">
                  {profile?.role ? profile.role.replace(/_/g, " ").toUpperCase() : "RESEARCHER"}
                </span>
                <span>•</span>
                <span>User ID: #{profile?.id}</span>
              </div>
            </div>
          </div>

          {/* Two-Column Grid */}
          <div className="f3-profile-grid">
            {/* Left Column: Editable Form */}
            <div className="f3-profile-panel">
              <h3>
                <span>👤</span>
                <span>Investigator Details</span>
              </h3>
              <ProfileForm
                user={profile}
                onProfileUpdated={(updated) => setProfile(updated)}
              />
            </div>

            {/* Right Column: Security & Role Scope */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Security Status Box */}
              <div className="f3-profile-panel">
                <h3>
                  <span>🛡️</span>
                  <span>Security Credentials</span>
                </h3>

                <div className="f3-profile-security-box">
                  <div className="f3-profile-security-item">
                    <span className="f3-profile-security-label">Authentication:</span>
                    <span className="f3-profile-security-val">JSON Web Token (JWT)</span>
                  </div>
                  <div className="f3-profile-security-item">
                    <span className="f3-profile-security-label">Password Storage:</span>
                    <span className="f3-profile-security-val">scrypt Hashed (1-Way)</span>
                  </div>
                  <div className="f3-profile-security-item">
                    <span className="f3-profile-security-label">Account Status:</span>
                    <span className="f3-profile-security-val">Active / Verified</span>
                  </div>
                  <div className="f3-profile-security-item">
                    <span className="f3-profile-security-label">GCP Compliance:</span>
                    <span className="f3-profile-security-val">AYUSH / ICMR</span>
                  </div>
                </div>
              </div>

              {/* Scope & Permissions */}
              <div className="f3-profile-panel">
                <h3>
                  <span>📋</span>
                  <span>Workspace Permissions</span>
                </h3>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "12px",
                    color: "var(--f3-text-secondary)",
                  }}
                >
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--f3-brand-green-light)" }}>✓</span>
                    <span>Create and edit clinical research studies</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--f3-brand-green-light)" }}>✓</span>
                    <span>Author standardized Ayurvedic protocols</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--f3-brand-green-light)" }}>✓</span>
                    <span>Upload and manage study regulatory documents</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--f3-brand-green-light)" }}>✓</span>
                    <span>Execute automated AI Quality Gate pre-checks</span>
                  </li>
                  <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--f3-brand-green-light)" }}>✓</span>
                    <span>Receive real-time audit & IEC milestone alerts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ProfilePage;
