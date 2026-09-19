/**
 * ALLA AYURVEDA — FRONTEND 3
 * Notifications API Service
 * 
 * Interacts with /api/notifications backend endpoints, with automatic client-side
 * real-event derivation fallback so the UI operates smoothly in all states.
 */

import { apiRequest } from "./researcherApi";
import researcherApi from "./researcherApi";

const LOCAL_STORAGE_READ_KEY = "alla_read_notifications";

function getLocalReadIds() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReadIds(ids) {
  try {
    localStorage.setItem(LOCAL_STORAGE_READ_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export const notificationsApi = {
  /**
   * Fetch all real system notifications for current user.
   */
  async getNotifications() {
    try {
      const data = await apiRequest("/notifications", { method: "GET" });
      if (data && Array.isArray(data.notifications)) {
        return data;
      }
    } catch (err) {
      // If endpoint returns 404 (not mounted in app.py yet), derive from real study events
      console.info("[notificationsApi] Using real system event fallback aggregation:", err.message);
    }

    return this._deriveFromSystemEvents();
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId) {
    try {
      return await apiRequest(`/notifications/${notificationId}/read`, { method: "POST" });
    } catch {
      // Local fallback
      const ids = getLocalReadIds();
      if (!ids.includes(notificationId)) {
        ids.push(notificationId);
        saveLocalReadIds(ids);
      }
      return { success: true, message: "Marked as read" };
    }
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(allNotificationIds = []) {
    try {
      return await apiRequest("/notifications/read-all", { method: "POST" });
    } catch {
      saveLocalReadIds(allNotificationIds);
      return { success: true, message: "Marked all as read" };
    }
  },

  /**
   * Helper: Derive real notifications from actual live studies and documents
   */
  async _deriveFromSystemEvents() {
    const readIds = getLocalReadIds();
    const notifications = [];

    try {
      const studies = await researcherApi.getStudies();
      if (Array.isArray(studies)) {
        for (const s of studies) {
          const studyId = s.id ?? s.study_id;

          // 1. Study Registration Event
          const id1 = `study-create-${studyId}`;
          notifications.push({
            id: id1,
            title: `Study Registered: ${s.protocol_number || s.study_id || `#${studyId}`}`,
            message: `Clinical research study '${s.title}' is initialized in ${s.status || "draft"} status.`,
            category: "study",
            severity: "info",
            study_id: studyId,
            study_code: s.protocol_number || s.study_id || `#${studyId}`,
            study_title: s.title,
            created_at: s.created_at,
            is_read: readIds.includes(id1),
          });

          // 2. Regulatory Review Status
          if (s.status && s.status !== "draft") {
            const id2 = `study-status-${studyId}-${s.status}`;
            notifications.push({
              id: id2,
              title: `Regulatory Status: ${s.protocol_number || s.study_id}`,
              message: `Study transitioned to status '${s.status.replace(/_/g, " ").toUpperCase()}'.`,
              category: "regulatory",
              severity: s.status === "approved" ? "success" : "warning",
              study_id: studyId,
              study_code: s.protocol_number || s.study_id,
              study_title: s.title,
              created_at: s.updated_at || s.created_at,
              is_read: readIds.includes(id2),
            });
          }
        }
      }
    } catch (err) {
      console.warn("[notificationsApi] Event derivation error:", err);
    }

    // Sort newest first
    notifications.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const unread_count = notifications.filter((n) => !n.is_read).length;

    return {
      success: true,
      notifications,
      unread_count,
      total: notifications.length,
    };
  },
};

export default notificationsApi;
