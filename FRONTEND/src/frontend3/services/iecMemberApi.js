/**
 * ALLA AYURVEDA — FRONTEND 3
 * IEC Member API Service
 * 
 * Authenticated via JWT bearer token.
 * Connects to /api/iec/member endpoints.
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

class IECMemberApiService {
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
   * Fetch live KPI dashboard metrics for IEC Member
   */
  async getDashboard() {
    return this._fetch("/iec/member/dashboard");
  }

  /**
   * List studies in IEC review queue with search, status filtering, and sorting
   */
  async getReviews(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.sort) query.append("sort", params.sort);

    const qs = query.toString();
    return this._fetch(`/iec/member/reviews${qs ? `?${qs}` : ""}`);
  }

  /**
   * Fetch complete IEC Member review dossier for a study
   */
  async getStudy(identifier) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}`);
  }

  /**
   * Fetch study protocol for review
   */
  async getStudyProtocol(identifier) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}/protocol`);
  }

  /**
   * Fetch submitted documents catalog and verification checklist
   */
  async getStudyDocuments(identifier) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}/documents`);
  }

  /**
   * Fetch AI Quality Gate evaluations and risk findings
   */
  async getStudyQuality(identifier) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}/quality`);
  }

  /**
   * Transition study status from 'ready_for_iec_review' to 'under_iec_review'
   */
  async startReview(identifier) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}/start-review`, {
      method: "POST",
    });
  }

  /**
   * Submit an IEC Member review recommendation
   */
  async submitRecommendation(identifier, payload) {
    return this._fetch(`/iec/member/studies/${encodeURIComponent(identifier)}/recommendation`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Download a study document
   */
  async downloadDocument(documentId, filename = "document.pdf") {
    const token = getStoredToken();
    const response = await fetch(`${BASE_URL}/documents/${documentId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download document: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const iecMemberApi = new IECMemberApiService();
export default iecMemberApi;
