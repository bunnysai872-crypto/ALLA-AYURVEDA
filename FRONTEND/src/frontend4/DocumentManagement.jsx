import React, { useState } from "react";
import DocumentManagementPage from "./pages/DocumentManagementPage";
import QualityGatePage from "./pages/QualityGatePage";
import DocumentDetailsPage from "./pages/DocumentDetailsPage";
import "./DocumentManagement.css";

/**
 * Frontend 4 Entry Point Component
 * Can be rendered directly or mounted via React Router.
 */
export default function DocumentManagement({ studyId = "1", initialView = "documents" }) {
  const [currentView, setCurrentView] = useState(initialView); // "documents" | "quality_gate" | "details"
  const [activeDocId, setActiveDocId] = useState(null);

  return (
    <div className="f4-root-container">
      {/* SECONDARY SUBNAV */}
      <nav className="f4-subnav-bar">
        <div className="f4-subnav-brand">
          <span className="f4-subnav-logo">A</span>
          <div>
            <strong>ALLA Ayurveda</strong>
            <small>Research Documentation & Quality System</small>
          </div>
        </div>

        <div className="f4-subnav-links">
          <button
            type="button"
            className={`f4-subnav-btn ${currentView === "documents" ? "active" : ""}`}
            onClick={() => setCurrentView("documents")}
          >
            📁 Study Documents
          </button>
          <button
            type="button"
            className={`f4-subnav-btn ${currentView === "quality_gate" ? "active" : ""}`}
            onClick={() => setCurrentView("quality_gate")}
          >
            ✦ AI Quality Gate
          </button>
        </div>
      </nav>

      {/* VIEW CONTENT */}
      {currentView === "documents" && (
        <DocumentManagementPage studyIdOverride={studyId} />
      )}
      {currentView === "quality_gate" && (
        <QualityGatePage studyIdOverride={studyId} />
      )}
    </div>
  );
}
