import React, { useState, useMemo } from "react";
import NotificationItem from "./NotificationItem";

/**
 * ALLA AYURVEDA — FRONTEND 3
 * NotificationList Component
 * 
 * Filterable feed of clinical platform notifications with search
 * and bulk mark-all-as-read actions.
 */
export function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectStudy,
}) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!Array.isArray(notifications)) return [];

    return notifications.filter((item) => {
      // Unread only
      if (filterCategory === "unread" && item.is_read) return false;

      // Category filter
      if (
        filterCategory !== "all" &&
        filterCategory !== "unread" &&
        item.category !== filterCategory
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        const matchesStudy = item.study_code?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesStudy) return false;
      }

      return true;
    });
  }, [notifications, filterCategory, searchQuery]);

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  return (
    <div>
      {/* Filter and Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "study", label: "Studies" },
            { id: "protocol", label: "Protocols" },
            { id: "document", label: "Documents" },
            { id: "quality_gate", label: "Quality Gate" },
            { id: "regulatory", label: "Regulatory" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`f3-filter-tab ${filterCategory === tab.id ? "f3-filter-tab-active" : ""}`}
              onClick={() => setFilterCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            className="f3-input f3-search-input"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "220px", padding: "6px 12px", fontSize: "13px" }}
          />

          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary f3-btn-sm"
              onClick={onMarkAllAsRead}
            >
              Mark All Read ✓
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="f3-loading-container" style={{ padding: "40px 0" }}>
          <div className="f3-loader-spinner"></div>
          <p>Loading notification feed...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="f3-empty-state-card">
          <div className="f3-empty-state-icon">🔔</div>
          <h3>No Notifications Found</h3>
          <p>
            {searchQuery
              ? `No notifications matching "${searchQuery}".`
              : filterCategory === "unread"
              ? "You have read all notifications. No pending notices!"
              : "No system event notifications recorded yet."}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onMarkAsRead={onMarkAsRead}
              onSelectStudy={onSelectStudy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationList;
