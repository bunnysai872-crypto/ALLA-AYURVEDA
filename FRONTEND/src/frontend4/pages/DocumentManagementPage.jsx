import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentApi } from "../services/documentApi";
import researcherApi from "../../frontend3/services/researcherApi";
import DocumentHeader from "../components/DocumentHeader";
import DocumentTable from "../components/DocumentTable";
import DocumentUpload from "../components/DocumentUpload";
import DocumentVersionHistory from "../components/DocumentVersionHistory";
import DocumentDetailsPanel from "../components/DocumentDetailsPanel";
import ConfirmDialog from "../components/ConfirmDialog";

const CORE_REQUIRED_CATEGORIES = [
  { key: "study_protocol", label: "Study Protocol" },
  { key: "patient_information_sheet", label: "Patient Information Sheet" },
  { key: "informed_consent_form", label: "Informed Consent Form" },
  { key: "investigator_brochure", label: "Investigator Brochure" },
  { key: "case_report_form", label: "Case Report Form" },
  { key: "statistical_analysis_plan", label: "Statistical Analysis Plan" },
];

export default function DocumentManagementPage({
  studyIdOverride = null,
  activeStudy = null,
  onSelectTab = null,
}) {
  const { studyId: paramStudyId } = useParams();
  const navigate = useNavigate();

  // Studies list for switcher if needed
  const [studiesList, setStudiesList] = useState([]);
  const [selectedStudyId, setSelectedStudyId] = useState(
    studyIdOverride || (activeStudy?.id ?? activeStudy?.study_id) || paramStudyId || null
  );

  // Active study details
  const [studyInfo, setStudyInfo] = useState({
    id: selectedStudyId,
    title: activeStudy?.title || "Clinical Study Documents",
    protocolNumber: activeStudy?.protocol_number || "",
    status: activeStudy?.status || "draft",
    principalInvestigator: activeStudy?.principal_investigator_name || "",
  });

  // State
  const [documents, setDocuments] = useState([]);
  const [requiredChecklist, setRequiredChecklist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modals & Panels
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadVersionTarget, setUploadVersionTarget] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. If no study ID provided, load user's studies from backend
  useEffect(() => {
    let isCurrent = true;
    async function loadUserStudies() {
      try {
        const studies = await researcherApi.getStudies();
        if (isCurrent && Array.isArray(studies) && studies.length > 0) {
          setStudiesList(studies);
          if (!selectedStudyId) {
            const first = studies[0];
            const firstId = first.id ?? first.study_id;
            setSelectedStudyId(firstId);
            setStudyInfo({
              id: firstId,
              title: first.title,
              protocolNumber: first.protocol_number || "",
              status: first.status || "draft",
              principalInvestigator: first.principal_investigator_name || "",
            });
          }
        }
      } catch (err) {
        console.warn("[DocumentManagementPage] Error fetching studies list:", err);
      }
    }

    loadUserStudies();
    return () => {
      isCurrent = false;
    };
  }, [selectedStudyId]);

  // 2. Fetch documents whenever selectedStudyId or filters change
  const fetchDocuments = useCallback(async () => {
    if (!selectedStudyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await documentApi.getStudyDocuments(selectedStudyId, {
        search: searchTerm,
        document_type: selectedType,
        status: selectedStatus,
        sort: sortBy,
      });

      setDocuments(res.documents || []);

      if (res.required_checklist) {
        setRequiredChecklist(res.required_checklist);
      }

      setStudyInfo((prev) => ({
        ...prev,
        id: res.study_id || selectedStudyId,
        title: res.study_title || prev.title,
        protocolNumber: res.protocol_number || prev.protocolNumber,
        status: res.study_status || prev.status,
        principalInvestigator: res.principal_investigator_name || prev.principalInvestigator,
      }));
    } catch (err) {
      if (err.status === 401) {
        setError("Your session has expired or authentication is required. Please log in.");
      } else if (err.status === 403) {
        setError("You do not have permission to access this study's documents.");
      } else if (err.status === 404) {
        setError(`Study #${selectedStudyId} was not found on the server.`);
      } else {
        setError(err.message || "Failed to load study documents.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudyId, searchTerm, selectedType, selectedStatus, sortBy]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Calculate required documents status
  const readinessMetrics = useMemo(() => {
    if (!requiredChecklist) {
      const presentCount = CORE_REQUIRED_CATEGORIES.filter((cat) =>
        documents.some((d) => {
          const dt = d.document_type;
          if (cat.key === "study_protocol" && (dt === "study_protocol" || dt === "protocol")) return true;
          if (cat.key === "informed_consent_form" && (dt === "informed_consent_form" || dt === "informed_consent")) return true;
          return dt === cat.key;
        })
      ).length;
      return {
        presentCount,
        totalRequired: CORE_REQUIRED_CATEGORIES.length,
        percentage: Math.round((presentCount / CORE_REQUIRED_CATEGORIES.length) * 100),
        isComplete: presentCount === CORE_REQUIRED_CATEGORIES.length,
      };
    }

    const presentCount = CORE_REQUIRED_CATEGORIES.filter(
      (cat) => requiredChecklist[cat.key]?.present
    ).length;

    return {
      presentCount,
      totalRequired: CORE_REQUIRED_CATEGORIES.length,
      percentage: Math.round((presentCount / CORE_REQUIRED_CATEGORIES.length) * 100),
      isComplete: presentCount === CORE_REQUIRED_CATEGORIES.length,
    };
  }, [requiredChecklist, documents]);

  // Actions
  const handleDownload = async (doc) => {
    setDownloadingDocId(doc.id);
    try {
      await documentApi.downloadDocument(selectedStudyId, doc.id, doc.original_filename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await documentApi.deleteDocument(selectedStudyId, deleteTarget.id);
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSwitchStudy = (newStudyId) => {
    setSelectedStudyId(newStudyId);
    const target = studiesList.find((s) => String(s.id ?? s.study_id) === String(newStudyId));
    if (target) {
      setStudyInfo({
        id: target.id ?? target.study_id,
        title: target.title,
        protocolNumber: target.protocol_number || "",
        status: target.status || "draft",
        principalInvestigator: target.principal_investigator_name || "",
      });
    }
  };

  const handleNavigateAIQualityGate = () => {
    if (onSelectTab) {
      onSelectTab("ai-quality-gate", studyInfo);
    } else {
      navigate(`/researcher/studies/${selectedStudyId}/quality-gate`);
    }
  };

  return (
    <div className="f4-page-wrapper">
      <div className="f4-page-content">
        {/* HEADER & CONTROLS */}
        <DocumentHeader
          studyId={studyInfo.id || selectedStudyId}
          studyTitle={studyInfo.title}
          studyStatus={studyInfo.status}
          principalInvestigator={studyInfo.principalInvestigator}
          protocolNumber={studyInfo.protocolNumber}
          totalCount={documents.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onOpenUpload={() => {
            setUploadVersionTarget(null);
            setIsUploadOpen(true);
          }}
          onNavigateQualityGate={handleNavigateAIQualityGate}
          studiesList={studiesList}
          onSwitchStudy={handleSwitchStudy}
        />

        {/* REQUIRED DOCUMENTS READINESS CHECKLIST BANNER */}
        <div
          className="f4-readiness-banner"
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#059669", textTransform: "uppercase" }}>
                AI QUALITY GATE READINESS CHECKLIST
              </span>
              <h3 style={{ margin: "4px 0 0 0", fontSize: "16px", color: "#1e293b", fontWeight: "600" }}>
                Required Document Package ({readinessMetrics.presentCount} of {readinessMetrics.totalRequired} Categories Uploaded)
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: readinessMetrics.isComplete ? "#059669" : "#d97706" }}>
                {readinessMetrics.percentage}% Complete
              </span>
              <button
                type="button"
                className="f4-btn f4-btn-secondary f4-btn-xs"
                onClick={handleNavigateAIQualityGate}
                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <span>Proceed to AI Quality Gate</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* CHECKLIST CHIPS */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CORE_REQUIRED_CATEGORIES.map((cat) => {
              const isPresent = requiredChecklist
                ? Boolean(requiredChecklist[cat.key]?.present)
                : documents.some((d) => {
                    const dt = d.document_type;
                    if (cat.key === "study_protocol" && (dt === "study_protocol" || dt === "protocol")) return true;
                    if (cat.key === "informed_consent_form" && (dt === "informed_consent_form" || dt === "informed_consent")) return true;
                    return dt === cat.key;
                  });

              return (
                <div
                  key={cat.key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    backgroundColor: isPresent ? "#ecfdf5" : "#fef2f2",
                    color: isPresent ? "#065f46" : "#991b1b",
                    border: `1px solid ${isPresent ? "#a7f3d0" : "#fecaca"}`,
                  }}
                >
                  <span style={{ fontWeight: "700" }}>{isPresent ? "✓" : "✗"}</span>
                  <span>{cat.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="f4-alert f4-alert-error">
            <span>⚠</span>
            <div className="f4-alert-text">
              <strong>Access Alert:</strong> {error}
            </div>
            {error.includes("log in") && (
              <button
                type="button"
                className="f4-btn f4-btn-secondary f4-btn-xs"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        {/* DOCUMENTS TABLE / CARDS */}
        <DocumentTable
          documents={documents}
          isLoading={isLoading}
          onViewDetails={(doc) => setSelectedDocDetails(doc)}
          onDownload={handleDownload}
          onOpenVersions={(doc) => setHistoryTarget(doc)}
          onOpenUploadVersion={(doc) => {
            setUploadVersionTarget(doc);
            setIsUploadOpen(true);
          }}
          onDeleteRequest={(doc) => setDeleteTarget(doc)}
          downloadingDocId={downloadingDocId}
        />

        {/* UPLOAD MODAL (New Doc or Revision) */}
        <DocumentUpload
          isOpen={isUploadOpen}
          onClose={() => {
            setIsUploadOpen(false);
            setUploadVersionTarget(null);
          }}
          isVersionUpload={Boolean(uploadVersionTarget)}
          targetDocument={uploadVersionTarget}
          studyId={selectedStudyId}
          uploadFunction={(formData) =>
            uploadVersionTarget
              ? documentApi.uploadDocumentVersion(selectedStudyId, uploadVersionTarget.id, formData)
              : documentApi.uploadDocument(selectedStudyId, formData)
          }
          onUploadSuccess={() => {
            fetchDocuments();
          }}
        />

        {/* VERSION HISTORY MODAL */}
        <DocumentVersionHistory
          isOpen={Boolean(historyTarget)}
          onClose={() => setHistoryTarget(null)}
          document={historyTarget}
          studyId={selectedStudyId}
        />

        {/* DETAILS SLIDE-OVER DRAWER */}
        <DocumentDetailsPanel
          isOpen={Boolean(selectedDocDetails)}
          onClose={() => setSelectedDocDetails(null)}
          document={selectedDocDetails}
          studyId={selectedStudyId}
          onOpenUploadVersion={(doc) => {
            setUploadVersionTarget(doc);
            setIsUploadOpen(true);
          }}
          onOpenVersions={(doc) => setHistoryTarget(doc)}
          onDeleteRequest={(doc) => setDeleteTarget(doc)}
          onDocumentUpdated={fetchDocuments}
        />

        {/* CONFIRM DELETE MODAL */}
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Delete Study Document"
          message={`Are you sure you want to delete '${deleteTarget?.original_filename}'? The document will be archived and hidden from active study listings.`}
          confirmText="Yes, Delete Document"
          isDanger={true}
          isLoading={isDeleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
