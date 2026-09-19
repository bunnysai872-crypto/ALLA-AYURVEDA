import React from "react";

export function IECVerificationSummary({ readiness }) {
  if (!readiness) return null;

  const isReady = readiness.is_ready;
  const score = readiness.score ?? 0;
  const checks = readiness.checks || [];
  const missingItems = readiness.missing_items || [];
  const correctionItems = readiness.correction_items || [];

  return (
    <div className="iec-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top Banner */}
      <div className={`iec-readiness-banner ${isReady ? "ready" : "not-ready"}`}>
        <div className="iec-readiness-left">
          <span className="iec-readiness-icon">{isReady ? "🛡" : "⚠"}</span>
          <div>
            <h3 className="iec-readiness-title">{readiness.status || (isReady ? "READY FOR IEC REVIEW" : "NOT READY")}</h3>
            <p className="iec-readiness-desc">
              {isReady
                ? "All mandatory study metadata, protocols, documents, and Quality Gate thresholds have been satisfied for ethics committee review."
                : "This study dossier cannot proceed to IEC Committee Review until the outstanding items below are resolved."}
            </p>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#94a3b8", fontWeight: 700 }}>
            Readiness Score
          </span>
          <div style={{ fontSize: "2.2rem", fontWeight: 800, color: isReady ? "#34d399" : "#f87171" }}>
            {score}%
          </div>
        </div>
      </div>

      {/* Outstanding Action Items */}
      {(missingItems.length > 0 || correctionItems.length > 0) && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "14px 18px",
          }}
        >
          <strong style={{ color: "#fca5a5", fontSize: "0.85rem", display: "block", marginBottom: "8px" }}>
            Items Requiring Attention Prior to IEC Meeting:
          </strong>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.82rem", color: "#f87171", lineHeight: 1.6 }}>
            {missingItems.map((item, idx) => (
              <li key={`miss-${idx}`}>Missing: {item}</li>
            ))}
            {correctionItems.map((item, idx) => (
              <li key={`corr-${idx}`}>Action Needed: {item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Checks Breakdown */}
      <div>
        <h4 style={{ fontSize: "0.95rem", color: "#f1f5f9", margin: "0 0 10px 0" }}>
          Secretariat Verification Criteria:
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
          {checks.map((chk) => {
            const isPass = chk.status === "pass";
            const isWarn = chk.status === "warning";
            const color = isPass ? "#34d399" : isWarn ? "#fbbf24" : "#f87171";
            const icon = isPass ? "✓" : isWarn ? "⚠" : "✕";

            return (
              <div
                key={chk.code}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "rgba(13, 21, 18, 0.6)",
                  border: `1px solid ${isPass ? "rgba(16, 185, 129, 0.3)" : isWarn ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  borderRadius: "8px",
                }}
              >
                <span style={{ color, fontWeight: "bold", fontSize: "1rem" }}>{icon}</span>
                <div style={{ fontSize: "0.82rem" }}>
                  <strong style={{ color: "#f8fafc", display: "block" }}>{chk.name}</strong>
                  <span style={{ color: "#94a3b8" }}>{chk.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default IECVerificationSummary;
