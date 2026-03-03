/**
 * Auth Utilities
 * Utilities for working with authentication
 */

import { DEFAULTS } from '../../config/constants.js';
import { logger } from '../../shared/utils/Logger.js';

/**
 * Get the current user's ID
 * @returns {number} User ID
 */
export const getCurrentUserId = () => {
    const userId = localStorage.getItem('currentUserId');
    return userId ? parseInt(userId, 10) : DEFAULTS.USER_ID;
};

/**
 * Set the current user's ID
 * @param {number} userId - User ID
 */
export const setCurrentUserId = (userId) => {
    localStorage.setItem('currentUserId', userId.toString());
};

/**
 * Get the current user's data
 * @returns {Object|null} User data or null
 */
export const getCurrentUserData = () => {
    const userData = localStorage.getItem('currentUser');
    if (!userData || userData === 'null') return null;
    
    try {
        return JSON.parse(userData);
    } catch (e) {
        logger.error('Failed to parse user data:', e);
        localStorage.removeItem('currentUser');
        return null;
    }
};

/**
 * Save user data
 * @param {Object} userData - User data
 */
export const setCurrentUserData = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
};

/**
 * Clear user data
 */
export const clearCurrentUser = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
};

/**
 * Check if the user is logged in
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser && currentUser !== 'null';
};
