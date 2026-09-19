/**
 * ALLA AYURVEDA — FRONTEND 3
 * AI Quality Gate API Service
 * 
 * Interacts with backend AI Quality Gate endpoints:
 * - POST /api/studies/:studyId/quality-check (Triggers deterministic rule-based evaluation)
 * - GET  /api/studies/:studyId/quality-check (Fetches latest evaluation results)
 * - GET  /api/studies/:studyId/documents/quality-data (Retrieves pre-check preparation data)
 */

import { apiRequest } from "./researcherApi";

export const qualityGateApi = {
  /**
   * Run the AI Quality Gate evaluation pipeline for a study.
   */
  async runQualityCheck(studyId) {
    return apiRequest(`/studies/${studyId}/quality-check`, {
      method: "POST",
    });
  },

  /**
   * Retrieve the most recent AI Quality Gate evaluation report for a study.
   */
  async getLatestQualityCheck(studyId) {
    return apiRequest(`/studies/${studyId}/quality-check`, {
      method: "GET",
    });
  },

  /**
   * Get pre-pipeline preparation data (document readiness, text extraction status, protocol number status).
   */
  async getQualityData(studyId) {
    return apiRequest(`/studies/${studyId}/documents/quality-data`, {
      method: "GET",
    });
  },
};

export default qualityGateApi;
