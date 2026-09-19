import React, { useState, useEffect } from "react";
import iecSecretariatApi from "../services/iecSecretariatApi";
import IECSubmissionQueue from "../components/IECSubmissionQueue";
import "../styles/IECSecretariatModule.css";

export function IECSubmissionQueuePage({ onSelectTab, onSelectStudy }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [docFilter, setDocFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let isMounted = true;

    async function loadSubmissions() {
      try {
        setLoading(true);
        setError(null);
        const data = await iecSecretariatApi.getSubmissions({
          search: searchTerm,
          status: statusFilter,
          readiness: readinessFilter,
          document_status: docFilter,
          sort: sortBy,
        });
        if (isMounted) {
          setSubmissions(data.submissions || []);
        }
      } catch (err) {
        console.error("Failed to load IEC submissions:", err);
        if (isMounted) {
          setError(err.message || "Failed to load submissions");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadSubmissions();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, statusFilter, readinessFilter, docFilter, sortBy]);

  const handleOpenStudy = (studyIdentifier) => {
    if (onSelectStudy) onSelectStudy(studyIdentifier);
    if (onSelectTab) onSelectTab("study-review");
  };

  const handleOpenVerification = (studyIdentifier) => {
    if (onSelectStudy) onSelectStudy(studyIdentifier);
    if (onSelectTab) onSelectTab("document-verification");
  };

  return (
    <div className="iec-module-container">
      {/* Header */}
      <div className="iec-page-header">
        <div className="iec-header-left">
          <span className="iec-header-tag">📋 Submission Queue</span>
          <h1 className="iec-header-title">Study Submission Registry</h1>
          <p className="iec-header-subtitle">
            Track, filter, and inspect all registered Ayurveda clinical research studies submitted for
            Institutional Ethics Committee administrative scrutiny and document verification.
          </p>
        </div>
      </div>

      {loading && submissions.length === 0 ? (
        <div className="iec-loading-container">
          <div className="iec-spinner" />
          <p>Loading submission queue...</p>
        </div>
      ) : error ? (
        <div className="iec-card" style={{ borderColor: "#ef4444" }}>
          <h4 style={{ color: "#f87171", margin: "0 0 8px 0" }}>Failed to load submissions</h4>
          <p style={{ color: "#cbd5e1" }}>{error}</p>
        </div>
      ) : (
        <IECSubmissionQueue
          submissions={submissions}
          onSelectStudy={handleOpenStudy}
          onOpenVerification={handleOpenVerification}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          readinessFilter={readinessFilter}
          onReadinessFilterChange={setReadinessFilter}
          docFilter={docFilter}
          onDocFilterChange={setDocFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}
    </div>
  );
}

export default IECSubmissionQueuePage;
