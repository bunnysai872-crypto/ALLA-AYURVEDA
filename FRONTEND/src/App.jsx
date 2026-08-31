import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">A</div>

          <div className="brand-text">
            <h2>ALLA Ayurveda</h2>
            <span>Research & Knowledge Platform</span>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#platform">Platform</a>
          <a href="#about">About</a>

          <button
            className="nav-login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </nav>
      </header>


      {/* HERO */}
      <main id="home" className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Ayurveda Research
          </div>

          <h1>
            Advancing Ayurveda
            <br />
            <span>Through Intelligent Research</span>
          </h1>

          <p className="hero-description">
            A unified digital platform for Ayurveda clinical research —
            from study creation and protocol development to document
            verification, IEC review, regulatory tracking and study activation.
          </p>

          <div className="hero-actions">

            <button
              className="primary-btn"
              onClick={() => navigate("/login")}
            >
              Get Started
              <span>→</span>
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                document
                  .getElementById("platform")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Platform
            </button>

          </div>

          <div className="trust-row">

            <div className="trust-item">
              <span>✦</span>
              Research Focused
            </div>

            <div className="trust-item">
              <span>✓</span>
              Quality Driven
            </div>

            <div className="trust-item">
              <span>◈</span>
              AI Assisted
            </div>

          </div>

        </div>


        {/* HERO VISUAL */}
        <div className="hero-visual">

          <div className="visual-glow"></div>

          <div className="research-card">

            <div className="card-top">

              <div className="mini-logo">A</div>

              <div>
                <p className="card-label">RESEARCH PLATFORM</p>
                <h3>Study Management</h3>
              </div>

              <div className="status-dot"></div>

            </div>

            <div className="study-progress">

              <div className="progress-header">
                <span>Clinical Study Progress</span>
                <strong>68%</strong>
              </div>

              <div className="progress-bar">
                <div className="progress-value"></div>
              </div>

            </div>

            <div className="research-stats">

              <div>
                <strong>12</strong>
                <span>Studies</span>
              </div>

              <div>
                <strong>08</strong>
                <span>Active</span>
              </div>

              <div>
                <strong>24</strong>
                <span>Documents</span>
              </div>

            </div>

            <div className="ai-quality">

              <div className="ai-icon">✦</div>

              <div>
                <span>AI Quality Gate</span>
                <strong>Protocol Quality: Excellent</strong>
              </div>

              <span className="quality-check">✓</span>

            </div>

          </div>


          <div className="floating-card floating-card-one">

            <span className="floating-icon">◉</span>

            <div>
              <strong>Protocol Builder</strong>
              <small>Structured research workflow</small>
            </div>

          </div>


          <div className="floating-card floating-card-two">

            <span className="floating-icon">✓</span>

            <div>
              <strong>IEC Review</strong>
              <small>Review status tracked</small>
            </div>

          </div>

        </div>

      </main>


      {/* PLATFORM */}
      <section id="platform" className="platform-section">

        <div className="section-heading">

          <span>ONE INTEGRATED WORKFLOW</span>

          <h2>
            Everything researchers need,
            <br />
            <em>in one platform.</em>
          </h2>

          <p>
            ALLA Ayurveda connects the complete research lifecycle
            through a structured digital environment.
          </p>

        </div>


        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-number">01</div>
            <div className="feature-icon">⌘</div>

            <h3>Study Management</h3>

            <p>
              Create and manage Ayurveda research studies
              through a structured workflow.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">02</div>
            <div className="feature-icon">◇</div>

            <h3>Protocol Builder</h3>

            <p>
              Build standardized research protocols with
              organized study information.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">03</div>
            <div className="feature-icon">✦</div>

            <h3>AI Quality Gate</h3>

            <p>
              Detect completeness, consistency, cross-document
              issues and research quality risks.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-number">04</div>
            <div className="feature-icon">✓</div>

            <h3>IEC Workflow</h3>

            <p>
              Support document verification, IEC review and
              structured decision tracking.
            </p>
          </div>

        </div>

      </section>


      {/* ABOUT */}
      <section id="about" className="about-section">

        <div className="about-content">

          <span className="section-tag">
            ABOUT ALLA AYURVEDA
          </span>

          <h2>
            Technology supporting
            <br />
            <span>Ayurveda research.</span>
          </h2>

          <p>
            ALLA Ayurveda is designed as a clinical research platform
            connecting researchers, research documentation, AI-assisted
            quality checks and institutional review workflows.
          </p>

          <div className="about-points">

            <div>
              <span>✓</span>
              <p>Structured research lifecycle</p>
            </div>

            <div>
              <span>✓</span>
              <p>AI-assisted quality assurance</p>
            </div>

            <div>
              <span>✓</span>
              <p>Centralized research documentation</p>
            </div>

          </div>

        </div>


        <div className="about-visual">

          <div className="mandala">

            <div className="mandala-inner">
              आ
            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="footer">

        <div>
          <strong>ALLA Ayurveda</strong>
          <span>
            AI-Powered Ayurveda Research & Knowledge Platform
          </span>
        </div>

        <p>
          © 2026 ALLA Ayurveda. Research with intelligence.
        </p>

      </footer>

    </div>
  );
}


function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/user-login/:role"
          element={<UserLogin />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;