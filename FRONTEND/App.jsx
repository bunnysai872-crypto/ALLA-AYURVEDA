import './App.css'

function App() {
  return (
    <div className="app">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <span>ALLA <strong>Ayurveda</strong></span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#research">Research</a>
        </div>

        <button className="nav-button">Get Started</button>
      </nav>


      {/* HERO SECTION */}
      <section className="hero-section" id="home">

        <div className="hero-content">
          <div className="tag">
            <span>✦</span> AI-POWERED AYURVEDA
          </div>

          <h1>
            Discover the
            <span> Wisdom of Ayurveda</span>
          </h1>

          <p>
            An intelligent platform connecting ancient Ayurvedic knowledge
            with modern technology, research, and evidence.
          </p>

          <div className="hero-buttons">
            <button className="primary-button">
              Explore Ayurveda →
            </button>

            <button className="secondary-button">
              Learn More
            </button>
          </div>

          <div className="trust-text">
            🌿 Knowledge • Research • Intelligence
          </div>
        </div>


        {/* HERO VISUAL */}
        <div className="hero-visual">
          <div className="glow"></div>

          <div className="ayurveda-circle">
            <div className="leaf leaf-one">🌿</div>
            <div className="leaf leaf-two">🍃</div>
            <div className="leaf leaf-three">🌱</div>

            <div className="circle-center">
              <span>ॐ</span>
              <small>AYURVEDA</small>
            </div>
          </div>

          <div className="floating-card card-one">
            <span>🌿</span>
            <div>
              <strong>Ancient Wisdom</strong>
              <small>Traditional Knowledge</small>
            </div>
          </div>

          <div className="floating-card card-two">
            <span>✦</span>
            <div>
              <strong>AI Research</strong>
              <small>Intelligent Insights</small>
            </div>
          </div>
        </div>

      </section>


      {/* STATS */}
      <section className="stats-section">
        <div>
          <strong>5000+</strong>
          <span>Years of Knowledge</span>
        </div>

        <div>
          <strong>1000+</strong>
          <span>Ayurvedic Concepts</span>
        </div>

        <div>
          <strong>AI</strong>
          <span>Intelligent Analysis</span>
        </div>

        <div>
          <strong>∞</strong>
          <span>Possibilities</span>
        </div>
      </section>


      {/* ABOUT */}
      <section className="about-section" id="about">
        <div className="section-label">ABOUT ALLA AYURVEDA</div>

        <h2>
          Where Ancient Wisdom Meets
          <span> Modern Intelligence</span>
        </h2>

        <p className="section-description">
          ALLA Ayurveda is designed to make Ayurvedic knowledge easier
          to explore, understand, research, and apply through modern
          artificial intelligence.
        </p>

        <div className="about-cards">

          <div className="about-card">
            <div className="card-icon">🌿</div>
            <h3>Traditional Knowledge</h3>
            <p>
              Explore structured Ayurvedic concepts, principles,
              herbs, therapies, and classical knowledge.
            </p>
          </div>

          <div className="about-card">
            <div className="card-icon">🧠</div>
            <h3>AI Intelligence</h3>
            <p>
              Use artificial intelligence to discover connections
              and gain meaningful insights from Ayurveda.
            </p>
          </div>

          <div className="about-card">
            <div className="card-icon">📚</div>
            <h3>Research & Evidence</h3>
            <p>
              Organize research and scientific evidence to support
              deeper exploration of Ayurvedic knowledge.
            </p>
          </div>

        </div>
      </section>


      {/* FEATURES */}
      <section className="features-section" id="features">

        <div className="section-label">PLATFORM FEATURES</div>

        <h2>
          Everything You Need to
          <span> Explore Ayurveda</span>
        </h2>

        <div className="feature-grid">

          <div className="feature-card large">
            <div className="feature-number">01</div>
            <div className="feature-icon">🔎</div>
            <h3>Ayurveda Knowledge Explorer</h3>
            <p>
              Search and explore Ayurvedic concepts through an
              organized knowledge platform.
            </p>
            <button>Explore Knowledge →</button>
          </div>

          <div className="feature-card">
            <div className="feature-number">02</div>
            <div className="feature-icon">🤖</div>
            <h3>AI Assistant</h3>
            <p>
              Ask questions and interact with an intelligent
              Ayurveda-focused AI assistant.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-number">03</div>
            <div className="feature-icon">📖</div>
            <h3>Research Hub</h3>
            <p>
              Discover and organize research related to Ayurveda.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-number">04</div>
            <div className="feature-icon">🔬</div>
            <h3>Evidence & Insights</h3>
            <p>
              Connect traditional concepts with modern scientific
              evidence and research.
            </p>
          </div>

        </div>
      </section>


      {/* RESEARCH */}
      <section className="research-section" id="research">

        <div className="research-content">
          <div className="section-label">RESEARCH • TECHNOLOGY • AYURVEDA</div>

          <h2>
            Building the Future of
            <span> Ayurvedic Research</span>
          </h2>

          <p>
            Our goal is to create a digital ecosystem where traditional
            Ayurvedic knowledge and modern artificial intelligence work
            together to support learning, research, and discovery.
          </p>

          <button className="primary-button">
            Explore Research →
          </button>
        </div>

        <div className="research-visual">
          <div className="research-orbit orbit-one"></div>
          <div className="research-orbit orbit-two"></div>

          <div className="research-center">
            <span>✦</span>
            <strong>AI</strong>
            <small>AYURVEDA</small>
          </div>
        </div>

      </section>


      {/* CTA */}
      <section className="cta-section">

        <div className="cta-glow"></div>

        <div className="cta-content">
          <div className="section-label">START YOUR JOURNEY</div>

          <h2>
            Explore the
            <span> Wisdom Within</span>
          </h2>

          <p>
            Discover Ayurveda through a new generation of intelligent
            technology.
          </p>

          <button className="primary-button">
            Get Started →
          </button>
        </div>

      </section>


      {/* FOOTER */}
      <footer className="footer">

        <div className="footer-brand">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span>ALLA <strong>Ayurveda</strong></span>
          </div>

          <p>
            AI-Powered Ayurveda Research & Knowledge Platform
          </p>
        </div>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#research">Research</a>
        </div>

        <div className="copyright">
          © 2026 ALLA Ayurveda. All rights reserved.
        </div>

      </footer>

    </div>
  )
}

export default App