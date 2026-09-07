/**
 * Document Management Formatting and Mapping Utilities
 */

export const DOCUMENT_TYPE_LABELS = {
  study_protocol: "Study Protocol",
  protocol: "Study Protocol",
  patient_information_sheet: "Patient Information Sheet",
  informed_consent_form: "Informed Consent Form",
  informed_consent: "Informed Consent Form",
  investigator_brochure: "Investigator Brochure",
  case_report_form: "Case Report Form",
  statistical_analysis_plan: "Statistical Analysis Plan",
  other_supporting_documents: "Other Supporting Documents",
  other: "Other Supporting Documents",
  study_plan: "Study Plan",
};

export const CANONICAL_DOCUMENT_CATEGORIES = [
  { key: "study_protocol", label: "Study Protocol", required: true },
  { key: "patient_information_sheet", label: "Patient Information Sheet", required: true },
  { key: "informed_consent_form", label: "Informed Consent Form", required: true },
  { key: "investigator_brochure", label: "Investigator Brochure", required: true },
  { key: "case_report_form", label: "Case Report Form", required: true },
  { key: "statistical_analysis_plan", label: "Statistical Analysis Plan", required: true },
  { key: "other_supporting_documents", label: "Other Supporting Documents", required: false },
];

export const DOCUMENT_STATUS_META = {
  UPLOADED: { label: "Uploaded", color: "#2563eb", bg: "#eff6ff" },
  UNDER_REVIEW: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  VERIFIED: { label: "Verified", color: "#16a34a", bg: "#f0fdf4" },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  REPLACEMENT_REQUIRED: { label: "Replacement Required", color: "#ea580c", bg: "#fff7ed" },

  // Lowercase compatibility
  uploaded: { label: "Uploaded", color: "#2563eb", bg: "#eff6ff" },
  under_review: { label: "Under Review", color: "#d97706", bg: "#fffbeb" },
  verified: { label: "Verified", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  replacement_required: { label: "Replacement Required", color: "#ea580c", bg: "#fff7ed" },
  draft: { label: "Draft", color: "#64748b", bg: "#f1f5f9" },
  processing: { label: "Processing", color: "#d97706", bg: "#fef3c7" },
  quality_check_pending: { label: "Quality Check Pending", color: "#d97706", bg: "#fffbeb" },
  quality_check_completed: { label: "Quality Check Passed", color: "#16a34a", bg: "#f0fdf4" },
  issues_found: { label: "Issues Detected", color: "#dc2626", bg: "#fef2f2" },
  ready_for_review: { label: "Ready for Review", color: "#0d9488", bg: "#f0fdfa" },
  archived: { label: "Archived", color: "#94a3b8", bg: "#f8fafc" },
};

export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

export const getFileExtension = (filename) => {
  if (!filename || filename.indexOf(".") === -1) return "";
  return filename.split(".").pop().toLowerCase();
};

export const getFileIcon = (filename) => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case "pdf":
      return "📄";
    case "doc":
    case "docx":
      return "📝";
    case "xls":
    case "xlsx":
    case "csv":
      return "📊";
    case "txt":
      return "📃";
    default:
      return "📁";
  }
};
