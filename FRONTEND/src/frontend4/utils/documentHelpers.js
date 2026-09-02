/**
 * Document Management Formatting and Mapping Utilities
 */

export const DOCUMENT_TYPE_LABELS = {
  protocol: "Study Protocol",
  informed_consent: "Informed Consent Form",
  case_report_form: "Case Report Form (CRF)",
  investigator_brochure: "Investigator Brochure",
  study_plan: "Study Plan",
  statistical_analysis_plan: "Statistical Analysis Plan",
  investigator_cv: "Investigator CV",
  ethics_document: "Ethics Document",
  supporting_document: "Supporting Document",
  other: "Other Study Document",
};

export const DOCUMENT_STATUS_META = {
  uploaded: { label: "Uploaded", color: "#2563eb", bg: "#eff6ff" },
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
