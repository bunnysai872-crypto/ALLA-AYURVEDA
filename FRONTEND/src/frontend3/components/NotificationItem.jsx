import React from "react";
import { formatDateTime } from "../utils/formatters";

function getCategoryIcon(category) {
  switch (category) {
    case "study":
      return "🔬";
    case "protocol":
      return "📋";
    case "document":
      return "📁";
    case "quality_gate":
      return "⚖️";
    case "regulatory":
      return "🏛";
    default:
      return "🔔";
  }
}

/**
 * ALLA AYURVEDA — FRONTEND 3
 * NotificationItem Component
 * 
 * Individual notification item card with unread state,
 * category badges, timestamps, and mark-as-read trigger.
 */
export function NotificationItem({ notification, onMarkAsRead, onSelectStudy }) {
  if (!notification) return null;

  const {
    id,
    title,
    message,
    category,
    study_id,
    study_code,
    study_title,
    created_at,
    is_read,
  } = notification;

  const icon = getCategoryIcon(category);

  return (
    <div className={`f3-notif-card ${!is_read ? "f3-notif-unread" : ""}`}>
      {/* Icon */}
      <div className={`f3-notif-icon-wrap f3-notif-icon-${category || "study"}`}>
        <span>{icon}</span>
      </div>

      {/* Content */}
      <div className="f3-notif-content">
        <div className="f3-notif-top-row">
          <h4 className="f3-notif-title">
            {!is_read && <span className="f3-notif-dot" title="Unread notification" />}
            <span>{title}</span>
          </h4>
          <span className="f3-notif-time">{formatDateTime(created_at)}</span>
        </div>

        <p className="f3-notif-msg">{message}</p>

        {/* Meta row */}
        <div className="f3-notif-meta-row">
          <span className="f3-notif-tag">{category}</span>
          {study_code && (
            <span
              style={{
                cursor: onSelectStudy ? "pointer" : "default",
                color: onSelectStudy ? "var(--f3-brand-green-light)" : "inherit",
                textDecoration: onSelectStudy ? "underline" : "none",
              }}
              onClick={() => onSelectStudy && onSelectStudy(study_id)}
            >
              Study: {study_code} {study_title ? `(${study_title})` : ""}
            </span>
          )}

          {!is_read && onMarkAsRead && (
            <button
              type="button"
              className="f3-btn f3-btn-ghost f3-btn-sm"
              style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 6px" }}
              onClick={() => onMarkAsRead(id)}
            >
              Mark Read ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
