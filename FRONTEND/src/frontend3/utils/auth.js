/**
 * ALLA AYURVEDA — FRONTEND 3
 * Isolated Authentication Helpers
 */

export const AUTH_STORAGE_KEYS = {
  TOKEN: "allaAyurvedaToken",
  USER: "allaAyurvedaUser",
};

/**
 * Safely retrieves the stored JWT token from localStorage.
 * @returns {string|null} The token or null if not found/error.
 */
export function getStoredToken() {
  try {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN);
    return token && token.trim() !== "" ? token.trim() : null;
  } catch (error) {
    console.error("[Frontend3 Auth] Error reading token from localStorage:", error);
    return null;
  }
}

/**
 * Safely retrieves and parses the stored user object from localStorage.
 * @returns {object|null} The parsed user object or null.
 */
export function getStoredUser() {
  try {
    const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch (error) {
    console.error("[Frontend3 Auth] Error parsing user from localStorage:", error);
    return null;
  }
}

/**
 * Persists token and user data to localStorage.
 * @param {string} token 
 * @param {object} user 
 */
export function setStoredAuth(token, user) {
  try {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, token);
    }
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    }
  } catch (error) {
    console.error("[Frontend3 Auth] Error saving auth to localStorage:", error);
  }
}

/**
 * Clears authentication data from localStorage.
 */
export function clearStoredAuth() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  } catch (error) {
    console.error("[Frontend3 Auth] Error clearing auth from localStorage:", error);
  }
}

/**
 * Validates whether the user object has the researcher role.
 * @param {object|null} user 
 * @returns {boolean}
 */
export function isResearcherUser(user) {
  if (!user || typeof user !== "object") return false;
  const role = (user.role || "").toLowerCase().trim();
  return role === "researcher";
}

