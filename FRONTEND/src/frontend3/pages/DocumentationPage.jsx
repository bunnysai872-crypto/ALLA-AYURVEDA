import React, { useState, useEffect, useCallback } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import researcherApi from "../services/researcherApi";
import StudyStatusBadge from "../components/StudyStatusBadge";
import DocumentList from "../components/DocumentList";
import DocumentUpload from "../components/DocumentUpload";
import "../styles/DocumentationModule.css";

/**
 * ALLA AYURVEDA — FRONTEND 3 — PHASE 1
 * DocumentationPage Component
 * 
 * Centralized Study Document Management workspace:
 * - Study asset metrics
 * - Document classification (Protocol, ICF, Brochure, CRF, Ethics)
 * - Version control and audit trail
 * - File downloads and uploads
 */
export function DocumentationPage({ activeStudy, onSelectTab }) {
  const [studiesList, setStudiesList] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(activeStudy || null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("list"); // "list" | "upload"

  const studyId = selectedStudy?.id ?? selectedStudy?.study_id;

  // Load studies list if no activeStudy provided
  useEffect(() => {
    if (selectedStudy) return;

    let isMounted = true;
    async function fetchStudies() {
      try {
        const list = await researcherApi.getStudies();
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setStudiesList(list);
          setSelectedStudy(list[0]);
        }
      } catch (err) {
        console.error("[DocumentationPage] Error loading studies:", err);
      }
    }

    fetchStudies();
    return () => {
      isMounted = false;
    };
  }, [selectedStudy]);

  // Load documents for current study
  const fetchDocuments = useCallback(async () => {
    if (!studyId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await researcherApi.listStudyDocuments(studyId);
      const list = (data && (data.documents || data.data)) || (Array.isArray(data) ? data : []);
      setDocuments(list);
    } catch (err) {
      console.error("[DocumentationPage] Error fetching documents:", err);
      setError(err.message || `Failed to load documents for study #${studyId}.`);
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Derived statistics
  const totalCount = documents.length;
  const hasProtocol = documents.some((d) => d.document_type === "protocol");
  const hasICF = documents.some((d) => d.document_type === "informed_consent_form");
  const totalBytes = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);

  // If no studies in system
  if (!selectedStudy && !loading) {
    return (
      <div className="f3-page-container">
        <div className="f3-page-header">
          <div>
            <span className="f3-eyebrow">REGULATORY ARCHIVE</span>
            <h1>Document Management</h1>
            <p>Secure, audit-compliant document repository with versioning and GCP validation.</p>
          </div>
        </div>

        <div className="f3-empty-state-card">
          <div className="f3-empty-state-icon">📁</div>
          <h2>No Research Studies Found</h2>
          <p>Create a research study first to initialize its regulatory document archive.</p>
          {onSelectTab && (
            <div className="f3-empty-state-actions">
              <button
                type="button"
                className="f3-btn f3-btn-primary"
                onClick={() => onSelectTab(WORKSPACE_TABS.CREATE_STUDY)}
              >
                + Create New Study
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="f3-page-container">
      {/* Top Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">STUDY ASSETS & GOVERNANCE</span>
          <h1>Document Management</h1>
          <p>
            Centralized regulatory repository with cryptographic version tracking,
            audit history, and automated quality gate preparation.
          </p>
        </div>

        <div className="f3-header-actions">
          {onSelectTab && (
            <>
              <button
                type="button"
                className="f3-btn f3-btn-secondary"
                onClick={() => onSelectTab(WORKSPACE_TABS.MY_STUDIES)}
              >
                ← My Studies
              </button>
              {studyId && (
                <button
                  type="button"
                  className="f3-btn f3-btn-secondary"
                  onClick={() => onSelectTab(WORKSPACE_TABS.STUDY_DETAILS, selectedStudy)}
                >
                  Study Details
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Study Banner */}
      <div className="f3-protocol-context-banner">
        <div className="f3-protocol-banner-left">
          <div className="f3-context-icon">📂</div>
          <div className="f3-context-info">
            <div className="f3-context-tag-row">
              <span className="f3-context-tag">ACTIVE REPOSITORY CONTEXT</span>
              <StudyStatusBadge status={selectedStudy?.status || "draft"} />
              <span className="f3-protocol-status-badge">
                {totalCount} Document{totalCount === 1 ? "" : "s"} Uploaded
              </span>
            </div>
            <h2 className="f3-context-title">
              {selectedStudy?.title || "Untitled Research Study"}
            </h2>
            <div className="f3-context-sub-row">
              <span><strong>Study ID:</strong> #{studyId}</span>
              {selectedStudy?.protocol_number && (
                <span><strong>Protocol ID:</strong> {selectedStudy.protocol_number}</span>
              )}
              {selectedStudy?.study_type && (
                <span><strong>Type:</strong> {selectedStudy.study_type}</span>
              )}
            </div>
          </div>
        </div>

        {/* Study Switcher if multiple */}
        {studiesList.length > 1 && (
          <div className="f3-protocol-switcher">
            <label htmlFor="doc-study-switcher">Switch Study:</label>
            <select
              id="doc-study-switcher"
              className="f3-input f3-select f3-select-sm"
              value={studyId}
              onChange={(e) => {
                const target = studiesList.find(
                  (s) => String(s.id ?? s.study_id) === e.target.value
                );
                if (target) {
                  setSelectedStudy(target);
                }
              }}
            >
              {studiesList.map((s) => (
                <option key={s.id ?? s.study_id} value={s.id ?? s.study_id}>
                  #{s.id ?? s.study_id} — {s.title?.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="f3-doc-grid-top">
        <div className="f3-doc-stat-card">
          <div className="f3-doc-stat-icon">📑</div>
          <div className="f3-doc-stat-info">
            <span className="f3-doc-stat-label">Total Assets</span>
            <span className="f3-doc-stat-value">{totalCount} files</span>
          </div>
        </div>

        <div className="f3-doc-stat-card">
          <div className="f3-doc-stat-icon">📋</div>
          <div className="f3-doc-stat-info">
            <span className="f3-doc-stat-label">Study Protocol</span>
            <span
              className="f3-doc-stat-value"
              style={{ color: hasProtocol ? "#4ade80" : "#ef4444", fontSize: "16px" }}
            >
              {hasProtocol ? "✓ Uploaded" : "⚠️ Missing"}
            </span>
          </div>
        </div>

        <div className="f3-doc-stat-card">
          <div className="f3-doc-stat-icon">📝</div>
          <div className="f3-doc-stat-info">
            <span className="f3-doc-stat-label">Informed Consent</span>
            <span
              className="f3-doc-stat-value"
              style={{ color: hasICF ? "#4ade80" : "#ef4444", fontSize: "16px" }}
            >
              {hasICF ? "✓ Uploaded" : "⚠️ Missing"}
            </span>
          </div>
        </div>

        <div className="f3-doc-stat-card">
          <div className="f3-doc-stat-icon">💾</div>
          <div className="f3-doc-stat-info">
            <span className="f3-doc-stat-label">Storage Allocated</span>
            <span className="f3-doc-stat-value">
              {(totalBytes / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          type="button"
          className={`f3-btn ${activeSubTab === "list" ? "f3-btn-primary" : "f3-btn-secondary"}`}
          onClick={() => setActiveSubTab("list")}
        >
          📂 Document Repository ({totalCount})
        </button>

        <button
          type="button"
          className={`f3-btn ${activeSubTab === "upload" ? "f3-btn-primary" : "f3-btn-secondary"}`}
          onClick={() => setActiveSubTab("upload")}
        >
          + Upload New Document
        </button>
      </div>

      {/* Tab 1: Upload Form */}
      {activeSubTab === "upload" && (
        <DocumentUpload
          studyId={studyId}
          onUploadSuccess={() => {
            fetchDocuments();
            setActiveSubTab("list");
          }}
        />
      )}

      {/* Tab 2: Document Repository Table */}
      {activeSubTab === "list" && (
        <div className="f3-protocol-section-card" style={{ padding: "20px" }}>
          <DocumentList
            documents={documents}
            loading={loading}
            error={error}
            onRefresh={fetchDocuments}
            onTriggerUpload={() => setActiveSubTab("upload")}
          />
        </div>
      )}
    </div>
  );
}

export default DocumentationPage;
