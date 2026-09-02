/**
 * ALLA AYURVEDA — FRONTEND 4
 * Document Management & AI Quality Gate API Service
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

export const getAuthToken = () => {
  return localStorage.getItem("allaAyurvedaToken") || "";
};

export const getAuthUser = () => {
  try {
    const raw = localStorage.getItem("allaAyurvedaUser");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const getHeaders = (isMultipart = false) => {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { success: false, message: `Server response error (${response.status})` };
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP ${response.status} Request failed`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const documentApi = {
  // 1. List Study Documents
  getStudyDocuments: async (studyId, params = {}) => {
    const query = new URLSearchParams();
    if (params.document_type) query.append("document_type", params.document_type);
    if (params.status) query.append("status", params.status);
    if (params.search) query.append("search", params.search);
    if (params.sort) query.append("sort", params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents${queryString}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 2. Get Single Document Details
  getDocumentDetails: async (studyId, documentId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 3. Upload Study Document
  uploadDocument: async (studyId, formData) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  // 4. Update Document Metadata
  updateDocumentMetadata: async (studyId, documentId, data) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // 5. Delete Document (Soft Delete)
  deleteDocument: async (studyId, documentId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 6. Upload New Version
  uploadDocumentVersion: async (studyId, documentId, formData) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}/versions`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    return handleResponse(response);
  },

  // 7. List Document Versions
  getDocumentVersions: async (studyId, documentId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}/versions`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 8. Download Document (Latest Version)
  downloadDocument: async (studyId, documentId, defaultFilename = "document") => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition");
    let filename = defaultFilename;
    if (disposition && disposition.indexOf("filename=") !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    return true;
  },

  // 9. Download Specific Historical Version
  downloadDocumentVersion: async (studyId, documentId, versionNumber, defaultFilename = "document") => {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/studies/${studyId}/documents/${documentId}/versions/${versionNumber}/download`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Version download failed: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    return true;
  },

  // 10. Run AI Quality Gate for Study
  runStudyQualityCheck: async (studyId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/quality-check`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 11. Get Latest AI Quality Gate Result
  getStudyQualityCheck: async (studyId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/quality-check`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 12. Run Document Quality Check
  runDocumentQualityCheck: async (studyId, documentId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/${documentId}/quality-check`, {
      method: "POST",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // 13. Get AI Quality Gate Data Prep
  getStudyQualityData: async (studyId) => {
    const response = await fetch(`${API_BASE_URL}/studies/${studyId}/documents/quality-data`, {
      method: "GET",
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
