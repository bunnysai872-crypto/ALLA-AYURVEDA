import React from "react";

export function IECStatusBadge({ status, type = "document" }) {
  const norm = (status || "").toLowerCase().trim();

  // Document verification statuses
  if (norm === "verified") {
    return <span className="iec-badge iec-badge-verified">✓ Verified</span>;
  }
  if (norm === "pending_verification" || norm === "uploaded") {
    return <span className="iec-badge iec-badge-pending">⏳ Pending Review</span>;
  }
  if (norm === "correction_required" || norm === "correction_requested") {
    return <span className="iec-badge iec-badge-correction">⚠ Correction Required</span>;
  }
  if (norm === "rejected") {
    return <span className="iec-badge iec-badge-correction">✕ Rejected</span>;
  }
  if (norm === "missing") {
    return <span className="iec-badge iec-badge-missing">○ Not Uploaded</span>;
  }

  // Study workflow statuses
  if (norm === "ready_for_iec_review") {
    return <span className="iec-badge iec-badge-ready">✓ Ready for IEC</span>;
  }
  if (norm === "verification_completed") {
    return <span className="iec-badge iec-badge-verified">✓ Verification Complete</span>;
  }
  if (norm === "submitted" || norm === "ready_for_ai_check") {
    return <span className="iec-badge iec-badge-pending">◈ Submitted</span>;
  }
  if (norm === "draft") {
    return <span className="iec-badge iec-badge-missing">Draft</span>;
  }

  return <span className="iec-badge iec-badge-missing">{status || "Unknown"}</span>;
}

export default IECStatusBadge;
