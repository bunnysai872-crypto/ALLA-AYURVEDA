/**
 * ALLA AYURVEDA — FRONTEND 3
 * Formatting & Presentation Utilities
 */

/**
 * Formats an ISO date string to human-readable format.
 * @param {string|Date|null} dateStr 
 * @returns {string} e.g. "Sep 2, 2026" or "—"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr) || "—";
  }
}

/**
 * Formats a date with time for audit records.
 * @param {string|Date|null} dateStr 
 * @returns {string} e.g. "Sep 2, 2026, 04:30 PM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr) || "—";
  }
}

/**
 * Maps study status codes to human labels and styling variants.
 * Recognizes: draft, active, ready_for_ai_check, and others.
 * @param {string} status 
 * @returns {{ label: string, variant: string, icon: string }}
 */
export function getStatusInfo(status) {
  const normStatus = (status || "").toLowerCase().trim();

  switch (normStatus) {
    case "draft":
      return {
        label: "Draft",
        variant: "f3-badge-draft",
        icon: "✎",
      };
    case "active":
      return {
        label: "Active",
        variant: "f3-badge-active",
        icon: "●",
      };
    case "ready_for_ai_check":
      return {
        label: "Ready for AI Check",
        variant: "f3-badge-ai-ready",
        icon: "✦",
      };
    case "under_review":
    case "iec_review":
      return {
        label: "Under IEC Review",
        variant: "f3-badge-review",
        icon: "🏛",
      };
    case "approved":
      return {
        label: "Approved",
        variant: "f3-badge-approved",
        icon: "✓",
      };
    case "completed":
      return {
        label: "Completed",
        variant: "f3-badge-completed",
        icon: "✔",
      };
    default:
      return {
        label: status ? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Draft",
        variant: "f3-badge-default",
        icon: "○",
      };
  }
}

/**
 * Formats file size in bytes to KB/MB.
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

