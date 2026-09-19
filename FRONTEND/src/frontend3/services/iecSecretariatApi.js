/**
 * ALLA AYURVEDA — FRONTEND 3
 * IEC Secretariat API Service
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

class IECSecretariatApiService {
  /**
   * Helper to perform authenticated fetch requests
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
   * Fetch KPI dashboard metrics
   */
  async getDashboard() {
    return this._fetch("/iec/secretariat/dashboard");
  }

  /**
   * List study submissions with optional filters and sorting
   */
  async getSubmissions(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status && params.status !== "all") query.append("status", params.status);
    if (params.readiness && params.readiness !== "all") query.append("readiness", params.readiness);
    if (params.document_status && params.document_status !== "all") {
      query.append("document_status", params.document_status);
    }
    if (params.sort) query.append("sort", params.sort);

    const qs = query.toString();
    return this._fetch(`/iec/secretariat/submissions${qs ? `?${qs}` : ""}`);
  }

  /**
   * Fetch complete Secretariat dossier for a study
   */
  async getStudy(identifier) {
    return this._fetch(`/iec/secretariat/studies/${encodeURIComponent(identifier)}`);
  }

  /**
   * Fetch study documents catalog and checklist
   */
  async getStudyDocuments(identifier) {
    return this._fetch(`/iec/secretariat/studies/${encodeURIComponent(identifier)}/documents`);
  }

  /**
   * Fetch study AI quality gate results
   */
  async getStudyQuality(identifier) {
    return this._fetch(`/iec/secretariat/studies/${encodeURIComponent(identifier)}/quality`);
  }

  /**
   * Verify an uploaded document with remarks
   */
  async verifyDocument(documentId, remarks = "") {
    return this._fetch(`/iec/secretariat/documents/${documentId}/verify`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    });
  }

  /**
   * Flag document as requiring correction or rejected
   */
  async requestCorrection(documentId, { reason, remarks = "", reject = false }) {
    return this._fetch(`/iec/secretariat/documents/${documentId}/correction`, {
      method: "POST",
      body: JSON.stringify({ reason, remarks, reject }),
    });
  }

  /**
   * Mark document as missing / deficient with remarks
   */
  async markDocumentMissing(documentId, remarks = "") {
    return this._fetch(`/iec/secretariat/documents/${documentId}/missing`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    });
  }

  /**
   * Submit study dossier to IEC Review stage
   */
  async submitToIECReview(identifier, remarks = "") {
    return this._fetch(`/iec/secretariat/studies/${encodeURIComponent(identifier)}/submit-to-iec`, {
      method: "POST",
      body: JSON.stringify({ remarks }),
    });
  }

  /**
   * Fetch verification summary and readiness assessment
   */
  async getVerificationSummary(identifier) {
    return this._fetch(`/iec/secretariat/studies/${encodeURIComponent(identifier)}/verification-summary`);
  }

  /**
   * Download a document directly
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

export const iecSecretariatApi = new IECSecretariatApiService();
export default iecSecretariatApi;
