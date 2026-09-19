/**
 * ALLA AYURVEDA — FRONTEND 3
 * Participant Management & Informed Consent API Service
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = "http://127.0.0.1:5000/api";

class ParticipantApiService {
  async _fetch(endpoint, options = {}) {
    const token = getStoredToken();
    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    if (!response.ok) {
      const error = new Error(data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  /**
   * List participants for an authorized clinical study
   */
  async getParticipants(studyIdentifier, { search = "", status = "all", consent = "all" } = {}) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "all") params.append("status", status);
    if (consent && consent !== "all") params.append("consent", consent);
    const qs = params.toString();
    return this._fetch(`/studies/${encodeURIComponent(studyIdentifier)}/participants${qs ? `?${qs}` : ""}`);
  }

  /**
   * Register a new participant in an activated study
   */
  async addParticipant(studyIdentifier, payload) {
    return this._fetch(`/studies/${encodeURIComponent(studyIdentifier)}/participants`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update participant lifecycle status (Screened, Eligible, Enrolled, Active, Withdrawn, Completed)
   */
  async updateParticipantStatus(studyIdentifier, participantRef, payload) {
    return this._fetch(`/studies/${encodeURIComponent(studyIdentifier)}/participants/${encodeURIComponent(participantRef)}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Record or update informed consent status (Not Started, Consent Pending, Consented, Declined, Withdrawn)
   */
  async recordConsent(studyIdentifier, participantRef, payload) {
    return this._fetch(`/studies/${encodeURIComponent(studyIdentifier)}/participants/${encodeURIComponent(participantRef)}/consent`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const participantApi = new ParticipantApiService();
export default participantApi;
