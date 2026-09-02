import React from "react";
import { DOCUMENT_STATUS_META } from "../utils/documentHelpers";

export default function DocumentStatusBadge({ status }) {
  const meta = DOCUMENT_STATUS_META[status] || DOCUMENT_STATUS_META.uploaded;

  return (
    <span
      className="f4-status-badge"
      style={{
        color: meta.color,
        backgroundColor: meta.bg,
        border: `1px solid ${meta.color}30`,
      }}
    >
      <span
        className="f4-status-dot"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
