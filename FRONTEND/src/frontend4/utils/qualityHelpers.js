/**
 * AI Quality Gate Formatting & Severity Palette Utilities
 */

export const QUALITY_STATUS_META = {
  passed: {
    label: "Passed Quality Gate",
    badge: "Passed",
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: "✓",
  },
  passed_with_warnings: {
    label: "Passed with Warnings",
    badge: "Warnings",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: "⚠",
  },
  issues_found: {
    label: "Quality Issues Found",
    badge: "Issues Found",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: "✕",
  },
  blocked: {
    label: "Submission Blocked",
    badge: "Blocked",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#f87171",
    icon: "⛔",
  },
  not_checked: {
    label: "Not Checked",
    badge: "Not Checked",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    icon: "○",
  },
};

export const SEVERITY_META = {
  CRITICAL: {
    label: "Critical",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#ef4444",
  },
  HIGH: {
    label: "High Priority",
    color: "#c2410c",
    bg: "#ffedd5",
    border: "#f97316",
  },
  WARNING: {
    label: "Warning",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#f59e0b",
  },
  INFO: {
    label: "Info / Note",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#38bdf8",
  },
};

export const getScoreColor = (score) => {
  if (score === null || score === undefined) return "#94a3b8";
  if (score >= 85) return "#16a34a"; // Green
  if (score >= 70) return "#d97706"; // Amber
  return "#dc2626"; // Red
};
