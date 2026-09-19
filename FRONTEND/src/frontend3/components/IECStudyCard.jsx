import React from "react";
import IECStatusBadge from "./IECStatusBadge";

export function IECStudyCard({ study, onSelectStudy }) {
  if (!study) return null;

  return (
    <div className="iec-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "#d4af37", fontWeight: 700 }}>
            {study.protocol_number || study.study_id}
          </span>
          <h4
            onClick={() => onSelectStudy && onSelectStudy(study.study_id || study.id)}
            style={{
              margin: "4px 0 0 0",
              color: "#6ee7b7",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
            }}
          >
            {study.title}
          </h4>
        </div>
        <IECStatusBadge status={study.status} type="study" />
      </div>

      <div style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
        Principal Investigator: <strong style={{ color: "#e2e8f0" }}>{study.researcher_name}</strong>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "#cbd5e1",
          paddingTop: "8px",
          borderTop: "1px solid rgba(45, 75, 60, 0.4)",
        }}
      >
        <span>
          Docs: {study.verified_count}/{study.documents_count} Verified
        </span>
        <button
          type="button"
          className="iec-btn-secondary"
          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
          onClick={() => onSelectStudy && onSelectStudy(study.study_id || study.id)}
        >
          Review Dossier →
        </button>
      </div>
    </div>
  );
}

export default IECStudyCard;
