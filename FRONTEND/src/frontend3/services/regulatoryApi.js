/**
 * ALLA AYURVEDA — FRONTEND 3
 * Regulatory & CTRI Tracking + Study Activation API Service
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = "http://127.0.0.1:5000/api";

class RegulatoryApiService {
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
   * List studies eligible for Regulatory & CTRI Tracking
   */
  async getRegulatoryStudies({ search = "", status = "all", sortBy = "newest" } = {}) {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (status && status !== "all") params.append("status", status);
    if (sortBy) params.append("sort_by", sortBy);
    const qs = params.toString();
    return this._fetch(`/regulatory/studies${qs ? `?${qs}` : ""}`);
  }

  /**
   * Fetch regulatory & CTRI dossier for a study
   */
  async getRegulatoryDossier(identifier) {
    return this._fetch(`/regulatory/studies/${encodeURIComponent(identifier)}`);
  }

  /**
   * Update regulatory clearance and CTRI registration parameters
   */
  async updateRegulatoryTracking(identifier, payload) {
    return this._fetch(`/regulatory/studies/${encodeURIComponent(identifier)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Evaluate the 9-point prerequisite checklist for Study Activation
   */
  async getActivationReadiness(identifier) {
    return this._fetch(`/regulatory/studies/${encodeURIComponent(identifier)}/readiness`);
  }

  /**
   * Execute official study activation
   */
  async activateStudy(identifier, payload = {}) {
    return this._fetch(`/regulatory/studies/${encodeURIComponent(identifier)}/activate`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

export const regulatoryApi = new RegulatoryApiService();
export default regulatoryApi;
