import React, { useState, useEffect, useCallback } from "react";
import { WORKSPACE_TABS } from "../utils/constants";
import notificationsApi from "../services/notificationsApi";
import NotificationList from "../components/NotificationList";
import "../styles/NotificationsModule.css";

/**
 * ALLA AYURVEDA — FRONTEND 3 — PHASE 3
 * NotificationsPage Component
 * 
 * System event feed delivering real, user-isolated updates across:
 * - Study registration & lifecycle milestones
 * - Protocol drafts and modifications
 * - Document upload and version records
 * - AI Quality Gate scores and risk flags
 */
export function NotificationsPage({ onSelectTab }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotifications();
      const list = (data && (data.notifications || data.data)) || [];
      setNotifications(list);
    } catch (err) {
      console.error("[NotificationsPage] Fetch error:", err);
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("[NotificationsPage] Mark read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const allIds = notifications.map((n) => n.id);
      await notificationsApi.markAllAsRead(allIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("[NotificationsPage] Mark all read error:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="f3-page-container">
      {/* Top Header */}
      <div className="f3-page-header">
        <div>
          <span className="f3-eyebrow">AUDIT & EVENT STREAM</span>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ margin: 0 }}>System Notifications</h1>
            {unreadCount > 0 && (
              <span className="f3-notif-unread-badge">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ marginTop: "6px" }}>
            Real-time feed of clinical study milestones, protocol revisions,
            document versions, and automated quality validation findings.
          </p>
        </div>

        <div className="f3-header-actions">
          {onSelectTab && (
            <button
              type="button"
              className="f3-btn f3-btn-secondary"
              onClick={() => onSelectTab(WORKSPACE_TABS.DASHBOARD)}
            >
              ← Dashboard
            </button>
          )}
          <button
            type="button"
            className="f3-btn f3-btn-secondary"
            onClick={fetchNotifications}
            title="Refresh feed"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="f3-alert-box f3-alert-error" style={{ marginBottom: "20px" }}>
          <span className="f3-alert-icon">⚠️</span>
          <div className="f3-alert-content">
            <strong>Notification Error</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="f3-btn f3-btn-secondary f3-btn-sm" onClick={fetchNotifications}>
            Retry
          </button>
        </div>
      )}

      {/* Main Notification List */}
      <NotificationList
        notifications={notifications}
        loading={loading}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onSelectStudy={(studyId) => {
          if (onSelectTab) {
            onSelectTab(WORKSPACE_TABS.MY_STUDIES);
          }
        }}
      />
    </div>
  );
}

export default NotificationsPage;
