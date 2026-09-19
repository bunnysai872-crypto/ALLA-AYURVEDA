/**
 * ALLA AYURVEDA — FRONTEND 3
 * Profile API Service
 * 
 * Interacts with /api/profile or /api/auth/me for viewing user details
 * and saving supported profile modifications.
 */

import { apiRequest } from "./researcherApi";
import { getStoredUser, setStoredAuth, getStoredToken } from "../utils/auth";

export const profileApi = {
  /**
   * Fetch current authenticated user's profile details.
   */
  async getProfile() {
    try {
      const data = await apiRequest("/profile", { method: "GET" });
      if (data && (data.profile || data.user)) {
        return data.profile || data.user;
      }
    } catch {
      // Fallback to /auth/me
    }

    const authMe = await apiRequest("/auth/me", { method: "GET" });
    return (authMe && authMe.user) || getStoredUser() || {};
  },

  /**
   * Update supported user profile fields (e.g. full_name).
   */
  async updateProfile(profileData) {
    let updatedUser = null;

    try {
      const res = await apiRequest("/profile", {
        method: "PUT",
        body: profileData,
      });
      updatedUser = (res && (res.profile || res.user)) || null;
    } catch (err) {
      console.info("[profileApi] /profile route standalone fallback:", err.message);
      // Fallback local update
      const current = getStoredUser() || {};
      updatedUser = {
        ...current,
        full_name: profileData.full_name || current.full_name,
        affiliation: profileData.affiliation,
        specialization: profileData.specialization,
      };
    }

    if (updatedUser) {
      const token = getStoredToken();
      setStoredAuth(token, updatedUser);
    }

    return updatedUser;
  },
};

export default profileApi;
