/**
 * Admin utility functions for checking user permissions
 */

/**
 * Check if the current user is Tagarao (admin)
 * @param {Object|null} user - The user object from auth context
 * @returns {boolean} - True if user is Tagarao
 */
export const isTagarao = (user) => {
  return user && user.personId === 'P5' && user.username === 'tagarao';
};

/**
 * Check if the current user has admin privileges
 * @param {Object|null} user - The user object from auth context
 * @returns {boolean} - True if user has admin privileges
 */
export const isAdmin = (user) => {
  return isTagarao(user);
};

/**
 * Require admin privileges - throws error if user is not admin
 * @param {Object|null} user - The user object from auth context
 * @param {string} action - The action being attempted (for error message)
 * @throws {Error} - If user is not admin
 */
export const requireAdmin = (user, action = 'perform this action') => {
  if (!isAdmin(user)) {
    throw new Error(`Only Tagarao can ${action}.`);
  }
};

/**
 * Check admin privileges and show alert if not authorized
 * @param {Object|null} user - The user object from auth context
 * @param {string} action - The action being attempted (for alert message)
 * @returns {boolean} - True if user is authorized, false otherwise
 */
export const checkAdminAndAlert = (user, action = 'perform this action') => {
  if (!isAdmin(user)) {
    alert(`Only Tagarao can ${action}.`);
    return false;
  }
  return true;
};
