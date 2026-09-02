import React from "react";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * AuthRequired Component
 * 
 * Displayed when no valid JWT token is found in localStorage.
 * Styled with professional healthcare/Ayurveda theme.
 */
export function AuthRequired({ message, onNavigateToLogin }) {
  const handleLoginClick = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      // Fallback navigation
      window.location.href = "/user-login/researcher";
    }
  };

  return (
    <div className="f3-auth-required-container">
      <div className="f3-auth-card">
        {/* Brand Icon */}
        <div className="f3-auth-brand-badge">
          <div className="f3-auth-logo">A</div>
          <span className="f3-auth-badge-dot"></span>
        </div>

        {/* Header */}
        <div className="f3-auth-header">
          <span className="f3-auth-eyebrow">RESEARCH PORTAL ACCESS</span>
          <h1 className="f3-auth-title">Authentication required</h1>
          <p className="f3-auth-subtitle">
            {message ||
              "Please sign in with your authorized Researcher credentials to access the ALLA Ayurveda Workspace."}
          </p>
        </div>

        {/* Security Notice Box */}
        <div className="f3-auth-notice-box">
          <div className="f3-auth-notice-icon">🔒</div>
          <div className="f3-auth-notice-text">
            <strong>Role-Based Research Security</strong>
            <p>
              This workspace requires active researcher authentication. JWT access
              tokens are verified on each backend request.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="f3-auth-actions">
          <button
            type="button"
            className="f3-btn f3-btn-primary"
            onClick={handleLoginClick}
          >
            <span>Sign In as Researcher</span>
            <span className="f3-btn-arrow">→</span>
          </button>

          <a href="/" className="f3-auth-link">
            Return to ALLA Ayurveda Home
          </a>
        </div>

        {/* Footer info */}
        <div className="f3-auth-footer">
          <span>ALLA Ayurveda Platform</span>
          <span>•</span>
          <span>Clinical Research & Knowledge</span>
        </div>
      </div>
    </div>
  );
}

export default AuthRequired;

