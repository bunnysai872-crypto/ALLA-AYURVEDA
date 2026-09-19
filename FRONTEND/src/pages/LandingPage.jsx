import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Users,
  Scale,
  Lock,
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Building2,
  Layers,
  Leaf,
  Award,
  FileCheck,
  History,
  UserCheck,
  FileSearch,
  CheckCircle
} from "lucide-react";

import "./LandingPage.css";
import heroImg from "../assets/hero_clinical_research.jpg";
import ayurResearchImg from "../assets/ayurveda_modern_research.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLoginClick = () => {
    navigate("/login");
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 10-step clinical research workflow as defined in project lifecycle
  const workflowSteps = [
    {
      num: "01",
      title: "Study Creation",
      desc: "Initialize trial registry, investigator roles, and baseline objectives.",
      icon: Activity,
    },
    {
      num: "02",
      title: "Protocol",
      desc: "Develop standardized clinical methodology and dosage regimens.",
      icon: FileText,
    },
    {
      num: "03",
      title: "Documents",
      desc: "Upload investigator brochures, subject forms, and trial dossiers.",
      icon: Layers,
    },
    {
      num: "04",
      title: "AI Quality Gate",
      desc: "Automated analysis for completeness, consistency, and risk flags.",
      icon: Sparkles,
    },
    {
      num: "05",
      title: "IEC Review",
      desc: "Ethics committee appraisal, member remarks, and queries.",
      icon: Scale,
    },
    {
      num: "06",
      title: "IEC Decision",
      desc: "Formal ethical clearance, conditional approval, or amendments.",
      icon: Award,
    },
    {
      num: "07",
      title: "Regulatory & CTRI",
      desc: "Tracking clinical trial registry (CTRI) and CDSCO milestones.",
      icon: Building2,
    },
    {
      num: "08",
      title: "Study Activation",
      desc: "Site readiness verification and authorized trial commencement.",
      icon: CheckCircle2,
    },
    {
      num: "09",
      title: "Participants",
      desc: "Subject screening, cohort categorization, and visit tracking.",
      icon: Users,
    },
    {
      num: "10",
      title: "Informed Consent",
      desc: "Auditable digital consent records and voluntary trial compliance.",
      icon: FileCheck,
    },
  ];

  // 7 Enterprise Platform Features requested
  const platformFeatures = [
    {
      title: "Study Management",
      desc: "Create, organize, and monitor clinical research studies.",
      tag: "Trial Orchestration",
      icon: Activity,
    },
    {
      title: "Protocol Builder",
      desc: "Structure research protocols through a guided digital workflow.",
      tag: "Standardized Framework",
      icon: FileText,
    },
    {
      title: "AI Quality Gate",
      desc: "Identify completeness, consistency, and cross-document quality issues.",
      tag: "Automated QA",
      icon: Sparkles,
    },
    {
      title: "IEC Review",
      desc: "Support structured ethical review and decision workflows.",
      tag: "Ethics Governance",
      icon: Scale,
    },
    {
      title: "Regulatory & CTRI Tracking",
      desc: "Track regulatory and registration requirements.",
      tag: "Compliance Monitoring",
      icon: Building2,
    },
    {
      title: "Participant Management",
      desc: "Manage study participants with study-scoped records and controlled workflows.",
      tag: "Subject Cohorts",
      icon: Users,
    },
    {
      title: "Informed Consent",
      desc: "Support controlled consent workflows and auditability.",
      tag: "Verified Consent",
      icon: FileCheck,
    },
  ];

  // 6 Trust / Strip indicators
  const stripIndicators = [
    {
      title: "Study Management",
      desc: "Lifecycle tracking & study cohorts",
      icon: Activity,
    },
    {
      title: "Protocol Development",
      desc: "Structured trial methodologies",
      icon: FileText,
    },
    {
      title: "AI Quality Assurance",
      desc: "Cross-document integrity checks",
      icon: Sparkles,
    },
    {
      title: "Ethical Review",
      desc: "IEC committee collaboration",
      icon: Scale,
    },
    {
      title: "Regulatory Tracking",
      desc: "CTRI & statutory compliance",
      icon: Building2,
    },
    {
      title: "Participant Management",
      desc: "Privacy-scoped trial cohorts",
      icon: Users,
    },
  ];

  // 6 Security / Governance items
  const securityItems = [
    {
      title: "Role-Based Access",
      desc: "Enforced permission boundaries for Investigators, IEC Secretariat, Members, and Regulatory Admins.",
      icon: Users,
    },
    {
      title: "Secure Authentication",
      desc: "Role-tailored credentials and tokenized access governance preventing unauthorized intrusion.",
      icon: Lock,
    },
    {
      title: "Audit Trails",
      desc: "Cryptographically traceable timeline records capturing all protocol modifications and review decisions.",
      icon: History,
    },
    {
      title: "Document Control",
      desc: "Multi-version synchronization, file checksums, and immutable locking upon ethical committee submission.",
      icon: FileSearch,
    },
    {
      title: "Workflow Governance",
      desc: "Enforced sequential phase gates prohibiting clinical activation without explicit IEC clearance.",
      icon: ShieldCheck,
    },
    {
      title: "Study-Level Data Isolation",
      desc: "Strict compartmentalization ensuring clinical trial records and patient identifiers remain strictly segregated.",
      icon: UserCheck,
    },
  ];

  return (
    <div className="alp-landing">

      {/* =================================================================
          1. NAVBAR
          ================================================================= */}
      <header className="alp-navbar">
        <div className="alp-container alp-nav-inner">
          <div className="alp-brand" onClick={() => scrollToSection("home")}>
            <div className="alp-brand-emblem">
              <Leaf size={24} strokeWidth={2.4} />
            </div>
            <div className="alp-brand-meta">
              <span className="alp-brand-name">
                ALLA <span>Ayurveda</span>
              </span>
              <span className="alp-brand-sub">
                Research &amp; Knowledge Platform
              </span>
            </div>
          </div>

          <nav className={`alp-nav-menu ${mobileMenuOpen ? "open" : ""}`}>
            <a
              href="#home"
              className="alp-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("home");
              }}
            >
              Home
            </a>
            <a
              href="#ayurveda-research"
              className="alp-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("ayurveda-research");
              }}
            >
              Research
            </a>
            <a
              href="#workflow"
              className="alp-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("workflow");
              }}
            >
              Clinical Studies
            </a>
            <a
              href="#features"
              className="alp-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("features");
              }}
            >
              Knowledge
            </a>
            <a
              href="#about"
              className="alp-nav-link"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("about");
              }}
            >
              About
            </a>
          </nav>

          <div className="alp-nav-actions">
            <button
              id="landing-navbar-login-btn"
              className="alp-btn-login"
              onClick={handleLoginClick}
            >
              <Lock size={15} />
              Login
            </button>

            <button
              className="alp-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* =================================================================
          2. HERO SECTION
          ================================================================= */}
      <section id="home" className="alp-hero">
        <div className="alp-container alp-hero-grid">
          <div className="alp-hero-content">
            <div className="alp-badge-pill">
              <span className="alp-badge-dot"></span>
              Modern Clinical Research Infrastructure
            </div>

            <h1 className="alp-hero-title">
              Advancing Ayurvedic Research Through{" "}
              <span className="alp-accent">Trusted Digital Innovation</span>
            </h1>

            <p className="alp-hero-desc">
              ALLA Ayurveda is a clinical research and knowledge platform designed
              to streamline study management, evidence-based research, ethical
              review, regulatory workflows, and participant care.
            </p>

            <div className="alp-hero-cta-group">
              <button
                id="hero-start-research-btn"
                className="alp-btn-primary"
                onClick={handleLoginClick}
              >
                Start Research
                <ArrowRight size={17} />
              </button>

              <button
                id="hero-explore-platform-btn"
                className="alp-btn-secondary"
                onClick={() => scrollToSection("platform")}
              >
                Explore Platform
              </button>
            </div>

            <div className="alp-hero-metrics">
              <div className="alp-metric-item">
                <span className="alp-metric-val">10-Stage</span>
                <span className="alp-metric-lbl">Integrated Lifecycle</span>
              </div>
              <div className="alp-metric-item">
                <span className="alp-metric-val">100%</span>
                <span className="alp-metric-lbl">Audit &amp; GCP Compliant</span>
              </div>
              <div className="alp-metric-item">
                <span className="alp-metric-val">AI-Powered</span>
                <span className="alp-metric-lbl">Quality Gate Verification</span>
              </div>
            </div>
          </div>

          <div className="alp-hero-visual-frame">
            <div className="alp-hero-img-wrap">
              <img
                src={heroImg}
                alt="Clinical investigator reviewing Ayurvedic clinical study data on a digital tablet in modern research laboratory"
                className="alp-hero-img"
              />
            </div>

            {/* Floating Telemetry 1 */}
            <div className="alp-floating-card alp-float-1">
              <div className="alp-floating-icon success">
                <ShieldCheck size={20} />
              </div>
              <div className="alp-floating-text">
                <strong>GCP &amp; IEC Ready</strong>
                <small>Ethical review workflows active</small>
              </div>
            </div>

            {/* Floating Telemetry 2 */}
            <div className="alp-floating-card alp-float-2">
              <div className="alp-floating-icon">
                <Sparkles size={20} />
              </div>
              <div className="alp-floating-text">
                <strong>AI Quality Gate</strong>
                <small>Protocol consistency verified: 99.4%</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          3. TRUST / PLATFORM STRIP
          ================================================================= */}
      <section className="alp-trust-strip">
        <div className="alp-container">
          <div className="alp-strip-header">
            <span className="alp-strip-title">
              Designed for the complete clinical research lifecycle
            </span>
          </div>

          <div className="alp-strip-grid">
            {stripIndicators.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="alp-strip-card">
                  <div className="alp-strip-icon-box">
                    <IconComponent size={19} />
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================
          4. ABOUT / PLATFORM SECTION
          ================================================================= */}
      <section id="about" className="alp-about-section">
        <div className="alp-container alp-about-grid">
          <div className="alp-about-img-wrap">
            <img
              src={ayurResearchImg}
              alt="Ayurvedic clinical research and analytical laboratory testing"
              className="alp-about-img"
            />
            <div className="alp-about-img-badge">
              ✓ Rigorous Analytical &amp; Clinical Protocols
            </div>
          </div>

          <div id="platform" className="alp-about-content">
            <span className="alp-section-tag">
              <CheckCircle size={15} />
              Unified Clinical Platform
            </span>

            <h2 className="alp-section-h2">
              One Platform. Complete Research Lifecycle.
            </h2>

            <p className="alp-section-lead">
              ALLA Ayurveda brings study creation, protocol development, document
              management, quality checks, IEC review, regulatory tracking,
              activation, participant management, and informed consent into one
              connected workflow.
            </p>

            <div className="alp-about-features">
              <div className="alp-about-feat-item">
                <div className="alp-feat-check">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>Unified Protocol &amp; Document Governance</strong>
                  <p>
                    Eliminate fragmented records and spreadsheets. Author standardized
                    protocols, manage trial investigator brochures, and preserve version
                    histories seamlessly.
                  </p>
                </div>
              </div>

              <div className="alp-about-feat-item">
                <div className="alp-feat-check">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>Automated AI Quality Gate &amp; Risk Detection</strong>
                  <p>
                    Verify study documents for structural completeness, cross-document
                    discrepancies, and methodological consistency prior to formal ethical
                    submission.
                  </p>
                </div>
              </div>

              <div className="alp-about-feat-item">
                <div className="alp-feat-check">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>Integrated IEC Review &amp; Regulatory Tracking</strong>
                  <p>
                    Facilitate secretariat checks, blinded member reviews, formal decision
                    logging, and follow CTRI registration milestones directly within the
                    platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================
          5. CLINICAL RESEARCH WORKFLOW (10 STEPS)
          ================================================================= */}
      <section id="workflow" className="alp-workflow-section">
        <div className="alp-container">
          <div className="alp-section-header-center">
            <span className="alp-section-tag">
              <Activity size={15} />
              Clinical Pipeline
            </span>
            <h2 className="alp-section-h2">
              From Research Idea to Clinical Study
            </h2>
            <p>
              A transparent, end-to-end clinical workflow connecting scientific
              hypotheses, ethical verification, and participant clinical visits.
            </p>
          </div>

          <div className="alp-workflow-grid">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="alp-workflow-step">
                  <div className="alp-step-top">
                    <span className="alp-step-num">STAGE {step.num}</span>
                    <div className="alp-step-icon">
                      <Icon size={17} />
                    </div>
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                  <div className="alp-step-indicator-bar">
                    <span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================
          6. PLATFORM FEATURES
          ================================================================= */}
      <section id="features" className="alp-features-section">
        <div className="alp-container">
          <div className="alp-section-header-center">
            <span className="alp-section-tag">
              <Award size={15} />
              Platform Features
            </span>
            <h2 className="alp-section-h2">
              Enterprise Clinical Capabilities
            </h2>
            <p>
              High-performance digital tools built specifically for clinical trial
              investigators, ethics committees, and medical administrators.
            </p>
          </div>

          <div className="alp-features-grid">
            {platformFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="alp-feature-card">
                  <div className="alp-feat-icon-box">
                    <Icon size={24} />
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                  <span className="alp-feat-tag">
                    <CheckCircle2 size={13} />
                    {feat.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================
          7. AYURVEDA + MODERN RESEARCH SECTION
          ================================================================= */}
      <section id="ayurveda-research" className="alp-ayur-research-section">
        <div className="alp-container alp-ayur-grid">
          <div className="alp-ayur-content">
            <span className="alp-section-tag">
              <Leaf size={15} />
              Scientific Heritage
            </span>

            <h2 className="alp-section-h2">
              Connecting Ayurveda With Modern Clinical Research
            </h2>

            <p className="alp-section-lead">
              The platform is designed specifically around Ayurvedic clinical
              research while providing structured digital workflows for modern
              research governance.
            </p>

            <p style={{ color: "var(--med-text-secondary)", fontSize: "14px", lineHeight: "1.65", margin: "0 0 20px" }}>
              Ayurvedic formulations represent sophisticated polyherbal pharmacognosy
              developed over millennia. ALLA Ayurveda bridges this holistic knowledge
              base with standardized clinical endpoints, Good Clinical Practice (GCP)
              protocols, biomarker correlations, and verifiable regulatory standards.
            </p>

            <div className="alp-ayur-pillars">
              <div className="alp-pillar-card">
                <h4>Formulation Standardization</h4>
                <p>
                  Standardized indexing of classical botanicals, rasapanchaka attributes,
                  and chemical bioactive profiles.
                </p>
              </div>

              <div className="alp-pillar-card">
                <h4>Evidence-Based Endpoints</h4>
                <p>
                  Correlate traditional symptom assessments with modern laboratory
                  assays, inflammatory markers, and quantitative outcomes.
                </p>
              </div>

              <div className="alp-pillar-card">
                <h4>Good Clinical Practice (GCP)</h4>
                <p>
                  Aligned with CDSCO and WHO clinical guidelines to guarantee international
                  trial reproducibility and publication integrity.
                </p>
              </div>

              <div className="alp-pillar-card">
                <h4>Knowledge Integration</h4>
                <p>
                  Direct lineage from classical Ayurvedic texts to modern digital trial
                  documentation and peer-reviewed outputs.
                </p>
              </div>
            </div>
          </div>

          <div className="alp-ayur-visual-frame">
            <img
              src={ayurResearchImg}
              alt="Ayurvedic herbs and modern scientific clinical research laboratory equipment"
              className="alp-ayur-img"
            />
          </div>
        </div>
      </section>

      {/* =================================================================
          8. SECURITY / GOVERNANCE SECTION
          ================================================================= */}
      <section id="governance" className="alp-security-section">
        <div className="alp-container">
          <div className="alp-section-header-center">
            <span className="alp-section-tag">
              <ShieldCheck size={15} />
              Institutional Security &amp; Compliance
            </span>
            <h2 className="alp-section-h2">
              Clinical Governance &amp; Data Integrity
            </h2>
            <p>
              Every interaction is governed by strict ethical standards, regulatory
              mandates, and encrypted access controls.
            </p>
          </div>

          <div className="alp-security-grid">
            {securityItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="alp-security-card">
                  <div className="alp-security-icon">
                    <Icon size={20} />
                  </div>
                  <div className="alp-security-content">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================
          9. FINAL CTA SECTION
          ================================================================= */}
      <section className="alp-cta-section">
        <div className="alp-container alp-cta-box">
          <div className="alp-cta-pill">
            <Sparkles size={14} />
            Digital Ayurvedic Trial Transformation
          </div>

          <h2 className="alp-cta-title">
            Build Better Ayurvedic Clinical Research
          </h2>

          <p className="alp-cta-desc">
            Bring study management, ethical review, regulatory tracking, and
            participant workflows into one connected platform.
          </p>

          <button
            id="final-cta-enter-btn"
            className="alp-btn-cta-primary"
            onClick={handleLoginClick}
          >
            Enter ALLA Ayurveda
            <ArrowRight size={18} />
          </button>

          <p className="alp-cta-subnote">
            Purpose-engineered for Clinical Investigators, Ethics Committees &amp; Healthcare Institutions
          </p>
        </div>
      </section>

      {/* =================================================================
          10. FOOTER
          ================================================================= */}
      <footer className="alp-footer">
        <div className="alp-container">
          <div className="alp-footer-grid">
            <div className="alp-footer-brand-wrap">
              <div className="alp-footer-logo">
                <div className="alp-footer-logo-emblem">A</div>
                <div className="alp-footer-logo-title">
                  ALLA <span>Ayurveda</span>
                </div>
              </div>
              <p className="alp-footer-brand-p">
                A modern clinical research and knowledge platform dedicated to
                accelerating evidence-based Ayurvedic medicine through ethical,
                structured, and auditable digital trial workflows.
              </p>
            </div>

            <div className="alp-footer-col">
              <h5>Platform</h5>
              <ul>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>Study Management</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>Protocol Builder</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>AI Quality Gate</a></li>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>IEC Review</a></li>
                <li><a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection("governance"); }}>Regulatory Tracking</a></li>
              </ul>
            </div>

            <div className="alp-footer-col">
              <h5>Research</h5>
              <ul>
                <li><a href="#ayurveda-research" onClick={(e) => { e.preventDefault(); scrollToSection("ayurveda-research"); }}>Ayurvedic Formulations</a></li>
                <li><a href="#ayurveda-research" onClick={(e) => { e.preventDefault(); scrollToSection("ayurveda-research"); }}>Clinical Evidence</a></li>
                <li><a href="#ayurveda-research" onClick={(e) => { e.preventDefault(); scrollToSection("ayurveda-research"); }}>Methodology Standards</a></li>
                <li><a href="#ayurveda-research" onClick={(e) => { e.preventDefault(); scrollToSection("ayurveda-research"); }}>Biomarker Studies</a></li>
              </ul>
            </div>

            <div className="alp-footer-col">
              <h5>Clinical Studies</h5>
              <ul>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>Study Workflow</a></li>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>Protocol Library</a></li>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>Subject Recruitment</a></li>
                <li><a href="#workflow" onClick={(e) => { e.preventDefault(); scrollToSection("workflow"); }}>Informed Consent</a></li>
              </ul>
            </div>

            <div className="alp-footer-col">
              <h5>Knowledge</h5>
              <ul>
                <li><a href="#ayurveda-research" onClick={(e) => { e.preventDefault(); scrollToSection("ayurveda-research"); }}>Botanical Repository</a></li>
                <li><a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection("governance"); }}>Good Clinical Practice</a></li>
                <li><a href="#governance" onClick={(e) => { e.preventDefault(); scrollToSection("governance"); }}>CTRI Guidelines</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}>Ethics Standards</a></li>
              </ul>
            </div>
          </div>

          <div className="alp-footer-bottom">
            <div>
              © 2026 ALLA Ayurveda. Research &amp; Knowledge Platform. All rights reserved.
            </div>
            <div className="alp-footer-legal-links">
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Privacy Policy</a>
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Terms of Research</a>
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Ethics Compliance</a>
              <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Security Whitepaper</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
