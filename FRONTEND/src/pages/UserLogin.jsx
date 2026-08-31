import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function UserLogin() {
  const navigate = useNavigate();
  const { role } = useParams();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const roleData = {
    researcher: {
      icon: "🔬",
      title: "Researcher",
      description:
        "Access your studies, protocols and research documents.",
    },

    "iec-secretariat": {
      icon: "🏛",
      title: "IEC Secretariat",
      description:
        "Manage submissions, document verification and IEC workflow.",
    },

    "iec-member": {
      icon: "✓",
      title: "IEC Member",
      description:
        "Review assigned studies and provide IEC recommendations.",
    },

    "regulatory-admin": {
      icon: "⚙",
      title: "Regulatory / Admin",
      description:
        "Manage regulatory tracking, users and platform operations.",
    },
  };

  const currentRole = roleData[role] || roleData.researcher;

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    alert(`Login submitted for ${currentRole.title}`);

    console.log({
      role,
      email: formData.email,
      password: formData.password,
      remember: formData.remember,
    });
  };

  return (
    <div className="user-login-page">

      <section className="user-login-brand">

        <button
          className="login-back-button"
          onClick={() => navigate("/login")}
        >
          ← Change User
        </button>

        <div className="login-brand-main">

          <div className="login-logo">
            A
          </div>

          <h2>ALLA Ayurveda</h2>

          <p>
            Research & Knowledge Platform
          </p>

          <div className="login-brand-line"></div>

          <div className="login-brand-message">

            <span>✦</span>

            <h1>
              Research with
              <br />
              <em>intelligence.</em>
            </h1>

            <p>
              A connected digital ecosystem for Ayurveda
              clinical research, quality assurance and
              institutional review.
            </p>

          </div>

          <div className="login-mini-features">

            <div>
              <span>✓</span>
              Structured Workflow
            </div>

            <div>
              <span>✦</span>
              AI Quality Assistance
            </div>

            <div>
              <span>◇</span>
              Secure Role-Based Access
            </div>

          </div>

        </div>

        <div className="login-brand-footer">
          AYURVEDA • RESEARCH • INNOVATION
        </div>

      </section>

      <section className="actual-login-panel">

        <div className="actual-login-container">

          <div className="mobile-login-brand">

            <div className="brand-logo">
              A
            </div>

            <div>
              <strong>ALLA Ayurveda</strong>
              <span>Research Platform</span>
            </div>

          </div>

          <div className="login-role">

            <div className="login-role-icon">
              {currentRole.icon}
            </div>

            <div>

              <span>
                SIGNING IN AS
              </span>

              <strong>
                {currentRole.title}
              </strong>

            </div>

          </div>

          <div className="actual-login-heading">

            <span>
              SECURE PLATFORM ACCESS
            </span>

            <h1>
              Welcome back.
            </h1>

            <p>
              {currentRole.description}
            </p>

          </div>

          <form
            className="actual-login-form"
            onSubmit={handleSubmit}
          >

            <div className="actual-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="actual-input">

                <span>@</span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

            <div className="actual-form-group">

              <div className="password-header">

                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    alert("Password recovery will be connected later.")
                  }
                >
                  Forgot password?
                </button>

              </div>

              <div className="actual-input">

                <span>●</span>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            <div className="login-options">

              <label>

                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />

                Remember me

              </label>

              <span>
                🔒 Secure Login
              </span>

            </div>

            <button
              type="submit"
              className="actual-login-button"
            >
              Sign In as {currentRole.title}

              <span>
                →
              </span>

            </button>

          </form>

          <div className="change-user-section">

            <p>
              Not the right user?
            </p>

            <button
              onClick={() => navigate("/login")}
            >
              ← Choose another user
            </button>

          </div>

          <div className="security-box">

            <span>
              ⓘ
            </span>

            <p>
              This is a role-based access system.
              Your account permissions and workspace are
              determined by your authorized platform role.
            </p>

          </div>

          <button
            className="login-home-link"
            onClick={() => navigate("/")}
          >
            Return to ALLA Ayurveda
          </button>

        </div>

      </section>

    </div>
  );
}

export default UserLogin;