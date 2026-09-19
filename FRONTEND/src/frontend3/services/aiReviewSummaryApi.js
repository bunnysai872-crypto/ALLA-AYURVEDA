/**
 * ALLA AYURVEDA — FRONTEND 3
 * AI Review Summary API Service
 * 
 * Fetches synthesized, read-only AI-Assisted Review Summary dossiers.
 * Endpoint: /api/iec/review-summary/<identifier>
 * Authenticated via JWT Bearer token.
 */
import { getStoredToken } from "../utils/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000/api";

class AIReviewSummaryApiService {
  /**
   * Fetch synthesized AI-Assisted Review Summary for a study
   * @param {string|number} identifier - Study ID or primary key
   * @returns {Promise<object>} Parsed response data
   */
  async getReviewSummary(identifier) {
    const token = getStoredToken();
    const headers = {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let response;
    try {
      response = await fetch(`${BASE_URL}/iec/review-summary/${encodeURIComponent(identifier)}`, {
        method: "GET",
        headers,
      });
    } catch (networkErr) {
      console.error("[aiReviewSummaryApi] Network error:", networkErr);
      const err = new Error(
        "Unable to connect to the ALLA Ayurveda backend server. Please verify the backend is running."
      );
      err.status = 0;
      err.isNetworkError = true;
      throw err;
    }

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (parseErr) {
        console.warn("[aiReviewSummaryApi] Failed to parse JSON response:", parseErr);
      }
    }

    if (!response.ok) {
      const message = data?.message || `Request failed with HTTP ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }
}

export const aiReviewSummaryApi = new AIReviewSummaryApiService();
export default aiReviewSummaryApi;
