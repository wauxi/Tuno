/**
 * Auth Utilities
 * Утилиты для работы с аутентификацией
 */

import { DEFAULTS } from '../config/constants.js';

/**
 * Получить ID текущего пользователя
 * @returns {number} User ID
 */
export const getCurrentUserId = () => {
    const userId = localStorage.getItem('currentUserId');
    return userId ? parseInt(userId, 10) : DEFAULTS.USER_ID;
};

/**
 * Установить ID текущего пользователя
 * @param {number} userId - User ID
 */
export const setCurrentUserId = (userId) => {
    localStorage.setItem('currentUserId', userId.toString());
};

/**
 * Получить данные текущего пользователя
 * @returns {Object|null} User data or null
 */
export const getCurrentUserData = () => {
    const userData = localStorage.getItem('currentUser');
    if (!userData || userData === 'null') return null;
    
    try {
        return JSON.parse(userData);
    } catch (e) {
        console.error('Failed to parse user data:', e);
        localStorage.removeItem('currentUser');
        return null;
    }
};

/**
 * Сохранить данные пользователя
 * @param {Object} userData - User data
 */
export const setCurrentUserData = (userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
};

/**
 * Очистить данные пользователя
 */
export const clearCurrentUser = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
};

/**
 * Проверить залогинен ли пользователь
 * @returns {boolean}
 */
export const isUserLoggedIn = () => {
    const currentUser = localStorage.getItem('currentUser');
    return currentUser && currentUser !== 'null';
};
