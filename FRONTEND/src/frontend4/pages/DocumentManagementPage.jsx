import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { documentApi, getAuthToken, getAuthUser } from "../services/documentApi";
import DocumentHeader from "../components/DocumentHeader";
import DocumentTable from "../components/DocumentTable";
import DocumentUpload from "../components/DocumentUpload";
import DocumentVersionHistory from "../components/DocumentVersionHistory";
import DocumentDetailsPanel from "../components/DocumentDetailsPanel";
import ConfirmDialog from "../components/ConfirmDialog";

export default function DocumentManagementPage({ studyIdOverride = null }) {
  const { studyId: paramStudyId } = useParams();
  const navigate = useNavigate();

  const studyId = studyIdOverride || paramStudyId || "1";

  // State
  const [documents, setDocuments] = useState([]);
  const [studyInfo, setStudyInfo] = useState({ title: "Clinical Study Documents", protocolNumber: "" });
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

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await documentApi.getStudyDocuments(studyId, {
        search: searchTerm,
        document_type: selectedType,
        status: selectedStatus,
        sort: sortBy,
      });
      setDocuments(res.documents || []);
      if (res.study_title) {
        setStudyInfo({
          title: res.study_title,
          protocolNumber: res.protocol_number || "",
        });
      }
    } catch (err) {
      if (err.status === 401) {
        setError("Your session has expired or authentication is required. Please log in.");
      } else if (err.status === 403) {
        setError("You do not have permission to access this study's documents.");
      } else {
        setError(err.message || "Failed to load study documents.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [studyId, searchTerm, selectedType, selectedStatus, sortBy]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Actions
  const handleDownload = async (doc) => {
    setDownloadingDocId(doc.id);
    try {
      await documentApi.downloadDocument(studyId, doc.id, doc.original_filename);
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
      await documentApi.deleteDocument(studyId, deleteTarget.id);
      setDeleteTarget(null);
      fetchDocuments();
    } catch (err) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="f4-page-wrapper">
      <div className="f4-page-content">
        {/* HEADER & CONTROLS */}
        <DocumentHeader
          studyTitle={studyInfo.title}
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
          onNavigateQualityGate={() => navigate(`/researcher/studies/${studyId}/quality-gate`)}
        />

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
          studyId={studyId}
          uploadFunction={(formData) =>
            uploadVersionTarget
              ? documentApi.uploadDocumentVersion(studyId, uploadVersionTarget.id, formData)
              : documentApi.uploadDocument(studyId, formData)
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
          studyId={studyId}
        />

        {/* DETAILS SLIDE-OVER DRAWER */}
        <DocumentDetailsPanel
          isOpen={Boolean(selectedDocDetails)}
          onClose={() => setSelectedDocDetails(null)}
          document={selectedDocDetails}
          studyId={studyId}
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
