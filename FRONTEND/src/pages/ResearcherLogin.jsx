import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function ResearcherLogin() {

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false
  });

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox"
        ? checked
        : value
    }));

  };

  const handleSubmit = (event) => {

    event.preventDefault();

    console.log("Researcher Login:", formData);

    alert(
      "Login authentication will be connected to the backend next."
    );

  };

  return (

    <div className="login-page">

      {/* LEFT PANEL */}

      <section className="login-brand-panel">

        <div className="login-brand-content">

          <button
            className="back-home"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </button>

          <div className="login-brand">

            <div className="brand-logo large">
              A
            </div>

            <div>
              <h2>ALLA Ayurveda</h2>

              <span>
                Research & Knowledge Platform
              </span>
            </div>

          </div>

          <div className="login-quote">

            <div className="quote-symbol">
              “
            </div>

            <h1>
              Empowering
              <br />
              <span>Ayurveda Research</span>
              <br />
              with Intelligence.
            </h1>

            <p>
              A secure research environment for creating studies,
              managing protocols, reviewing documents and progressing
              clinical research.
            </p>

          </div>

          <div className="login-features">

            <div>

              <span>✦</span>

              <div>
                <strong>
                  AI-Assisted Research
                </strong>

                <small>
                  Intelligent quality and consistency checks
                </small>
              </div>

            </div>

            <div>

              <span>◇</span>

              <div>
                <strong>
                  Structured Workflow
                </strong>

                <small>
                  Manage your research lifecycle efficiently
                </small>
              </div>

            </div>

            <div>

              <span>✓</span>

              <div>
                <strong>
                  Secure Environment
                </strong>

                <small>
                  Designed for responsible research management
                </small>
              </div>

            </div>

          </div>

        </div>

        <div className="login-panel-footer">
          AYURVEDA • RESEARCH • INNOVATION
        </div>

      </section>


      {/* RIGHT PANEL */}

      <section className="login-form-panel">

        <div className="login-form-container">

          <div className="mobile-logo">

            <div className="brand-logo">
              A
            </div>

            <div>

              <strong>
                ALLA Ayurveda
              </strong>

              <span>
                Research Platform
              </span>

            </div>

          </div>


          <div className="login-heading">

            <span className="login-eyebrow">
              RESEARCHER PORTAL
            </span>

            <h1>
              Welcome back.
            </h1>

            <p>
              Sign in to continue to your research workspace.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Researcher Email
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="researcher@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    alert(
                      "Password recovery will be connected later."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>

              <div className="input-wrapper">

                <span className="input-icon">
                  ●
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* OPTIONS */}

            <div className="form-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />

                <span>
                  Remember me
                </span>

              </label>

              <span className="secure-login">
                🔒 Secure Login
              </span>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit"
            >
              Sign In
              <span>→</span>
            </button>

          </form>


          <div className="login-divider">
            <span>OR</span>
          </div>


          {/* REGISTRATION */}

          <div className="new-researcher">

            <p>
              New to ALLA Ayurveda?
            </p>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Researcher registration will be added next."
                )
              }
            >
              Request Researcher Access
              <span>→</span>
            </button>

          </div>


          {/* SECURITY */}

          <div className="login-security-note">

            <span>ⓘ</span>

            <p>
              Access is intended for authorized researchers
              and institutional users.
            </p>

          </div>


          <button
            className="return-home"
            onClick={() => navigate("/")}
          >
            ← Return to ALLA Ayurveda
          </button>

        </div>

      </section>

    </div>

  );
}

export default ResearcherLogin;