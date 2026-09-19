/**
 * ALLA AYURVEDA — FRONTEND 3
 * IEC Decision API Service
 * 
 * Authenticated via JWT bearer token.
 * Connects to /api/iec/studies/<id>/decision endpoints.
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = "http://127.0.0.1:5000/api";

class IECDecisionApiService {
  /**
   * Core authenticated fetch helper
   */
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
   * Fetch comprehensive decision dossier for a study
   * @param {string|number} identifier
   */
  async getDecisionDossier(identifier) {
    return this._fetch(`/iec/studies/${encodeURIComponent(identifier)}/decision-dossier`);
  }

  /**
   * Record official IEC Decision
   * @param {string|number} identifier
   * @param {object} payload - { decision: 'approved'|'modify'|'not_approved', comments: string, conditions?: string }
   */
  async submitDecision(identifier, payload) {
    return this._fetch(`/iec/studies/${encodeURIComponent(identifier)}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Retrieve existing official decision record (if already issued)
   * @param {string|number} identifier
   */
  async getDecision(identifier) {
    return this._fetch(`/iec/studies/${encodeURIComponent(identifier)}/decision`);
  }
}

export const iecDecisionApi = new IECDecisionApiService();
export default iecDecisionApi;
