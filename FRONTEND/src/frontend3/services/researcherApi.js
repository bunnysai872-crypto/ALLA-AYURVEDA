/**
 * ALLA AYURVEDA — FRONTEND 3
 * Isolated Researcher API Service
 * 
 * Base URL: http://127.0.0.1:5000/api
 * Authenticated with JWT from localStorage ("allaAyurvedaToken")
 * Handles 400, 401, 403, 404, 500, and network errors.
 * No mock/fake data.
 */

import { getStoredToken } from "../utils/auth";

const BASE_API_URL = "http://127.0.0.1:5000/api";

/**
 * Custom API Error class with HTTP status code and response payload.
 */
export class ApiError extends Error {
  constructor(message, status, data = null, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Core request helper that attaches JWT and handles status codes & network errors.
 * 
 * @param {string} endpoint - API path (e.g. "/auth/me" or "/studies")
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const url = `${BASE_API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  // Attach Bearer token if present
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Handle JSON body if it's a plain object (do not overwrite multipart/form-data)
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch (networkErr) {
    // Handle Network / Connection Errors
    console.error(`[researcherApi] Network error contacting ${url}:`, networkErr);
    throw new ApiError(
      "Network error: Unable to connect to ALLA Ayurveda backend server. Please verify the backend is running on http://127.0.0.1:5000.",
      0,
      null,
      true
    );
  }

  // Parse JSON response body safely
  let responseData = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      responseData = await response.json();
    } catch (parseErr) {
      console.warn(`[researcherApi] Could not parse JSON response from ${endpoint}:`, parseErr);
    }
  }

  // Handle HTTP Status Codes
  if (!response.ok) {
    const errorMsg =
      (responseData && (responseData.message || responseData.error || responseData.msg)) ||
      getDefaultErrorMessage(response.status);

    console.error(`[researcherApi] HTTP ${response.status} from ${endpoint}:`, errorMsg);

    switch (response.status) {
      case 400:
        throw new ApiError(errorMsg || "400 Bad Request: Invalid input data.", 400, responseData);
      case 401:
        throw new ApiError(
          errorMsg || "401 Unauthorized: Invalid, expired, or missing authentication token.",
          401,
          responseData
        );
      case 403:
        throw new ApiError(
          errorMsg || "403 Forbidden: Access denied or insufficient permissions.",
          403,
          responseData
        );
      case 404:
        throw new ApiError(
          errorMsg || "404 Not Found: The requested resource was not found on the server.",
          404,
          responseData
        );
      case 500:
        throw new ApiError(
          errorMsg || "500 Internal Server Error: An unexpected server error occurred.",
          500,
          responseData
        );
      default:
        throw new ApiError(
          errorMsg || `HTTP ${response.status} error occurred.`,
          response.status,
          responseData
        );
    }
  }

  return responseData;
}

/**
 * Returns default human-readable messages for HTTP status codes.
 */
function getDefaultErrorMessage(status) {
  switch (status) {
    case 400:
      return "Bad Request: Please check the submitted data.";
    case 401:
      return "Authentication required or session expired. Please log in.";
    case 403:
      return "Access denied: Insufficient permissions for researcher role.";
    case 404:
      return "Requested resource not found.";
    case 500:
      return "Internal Server Error: Backend service encountered an issue.";
    default:
      return `Server returned error status ${status}`;
  }
}

/**
 * Researcher API Methods
 */
export const researcherApi = {
  /**
   * Check backend root health
   */
  async checkHealth() {
    return apiRequest("/");
  },

  /**
   * Fetch authenticated user's profile (/api/auth/me)
   */
  async getMe() {
    return apiRequest("/auth/me", { method: "GET" });
  },

  /**
   * Test researcher-specific role access (/api/auth/test/researcher)
   */
  async testResearcherAccess() {
    return apiRequest("/auth/test/researcher", { method: "GET" });
  },

  /**
   * Fetch all research studies for current researcher (GET /api/studies)
   * Normalizes response to an Array of study objects.
   */
  async getStudies() {
    const data = await apiRequest("/studies", { method: "GET" });
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.studies)) return data.studies;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  },

  /**
   * Fetch a single study by ID or identifier (GET /api/studies/:identifier)
   */
  async getStudy(identifier) {
    const data = await apiRequest(`/studies/${identifier}`, { method: "GET" });
    if (!data) return null;
    if (data.study) return data.study;
    if (data.data) return data.data;
    return data;
  },

  /**
   * Create a new research study (POST /api/studies)
   * Does NOT generate ID on client; backend creates and returns the record.
   */
  async createStudy(studyData) {
    return apiRequest("/studies", {
      method: "POST",
      body: studyData,
    });
  },

  /**
   * Update an existing study (PUT /api/studies/:identifier)
   */
  async updateStudy(identifier, studyData) {
    return apiRequest(`/studies/${identifier}`, {
      method: "PUT",
      body: studyData,
    });
  },

  /**
   * Delete a study (DELETE /api/studies/:identifier)
   * Backend only allows deletion if study is in 'draft' status.
   */
  async deleteStudy(identifier) {
    return apiRequest(`/studies/${identifier}`, {
      method: "DELETE",
    });
  },

  /**
   * Fetch protocol for a study (GET /api/studies/:identifier/protocol)
   * Returns protocol object or null if 404 (not found).
   */
  async getProtocol(identifier) {
    try {
      const data = await apiRequest(`/studies/${identifier}/protocol`, { method: "GET" });
      if (!data) return null;
      if (data.protocol) return data.protocol;
      if (data.data) return data.data;
      return data;
    } catch (err) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Create protocol for a study (POST /api/studies/:identifier/protocol)
   */
  async createProtocol(identifier, protocolData) {
    return apiRequest(`/studies/${identifier}/protocol`, {
      method: "POST",
      body: protocolData,
    });
  },

  /**
   * Update protocol for a study (PUT /api/studies/:identifier/protocol)
   */
  async updateProtocol(identifier, protocolData) {
    return apiRequest(`/studies/${identifier}/protocol`, {
      method: "PUT",
      body: protocolData,
    });
  },

  /**
   * List all documents for a study (/api/studies/:studyId/documents)
   */
  async listStudyDocuments(studyId, documentType = null) {
    let endpoint = `/studies/${studyId}/documents`;
    if (documentType) {
      endpoint += `?document_type=${encodeURIComponent(documentType)}`;
    }
    return apiRequest(endpoint, { method: "GET" });
  },

  /**
   * Get AI Quality Gate structured data for study (/api/studies/:studyId/documents/quality-data)
   */
  async getStudyQualityData(studyId) {
    return apiRequest(`/studies/${studyId}/documents/quality-data`, { method: "GET" });
  },

  /**
   * Upload a new document to a study (/api/studies/:studyId/documents)
   * Expects FormData with 'file', 'document_type', and optional 'description'
   */
  async uploadStudyDocument(studyId, formData) {
    return apiRequest(`/studies/${studyId}/documents`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Download a document (/api/documents/:documentId/download)
   */
  async downloadDocument(documentId) {
    const token = getStoredToken();
    const url = `${BASE_API_URL}/documents/${documentId}/download`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      throw new ApiError(`Download failed with status ${response.status}`, response.status);
    }
    return response.blob();
  },

  /**
   * Update document metadata (/api/documents/:documentId)
   */
  async updateDocumentMetadata(documentId, data) {
    return apiRequest(`/documents/${documentId}`, {
      method: "PUT",
      body: data,
    });
  },

  /**
   * Soft delete a document (/api/documents/:documentId)
   */
  async deleteDocument(documentId) {
    return apiRequest(`/documents/${documentId}`, {
      method: "DELETE",
    });
  },

  /**
   * Upload a new version of an existing document (/api/documents/:documentId/versions)
   * Expects FormData with 'file' and 'change_summary'
   */
  async uploadDocumentVersion(documentId, formData) {
    return apiRequest(`/documents/${documentId}/versions`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * List versions of a document (/api/documents/:documentId/versions)
   */
  async listDocumentVersions(documentId) {
    return apiRequest(`/documents/${documentId}/versions`, {
      method: "GET",
    });
  },

  /**
   * Download a specific document version (/api/documents/:documentId/versions/:versionNumber/download)
   */
  async downloadDocumentVersion(documentId, versionNumber) {
    const token = getStoredToken();
    const url = `${BASE_API_URL}/documents/${documentId}/versions/${versionNumber}/download`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!response.ok) {
      throw new ApiError(`Version download failed with status ${response.status}`, response.status);
    }
    return response.blob();
  },
};

export default researcherApi;
