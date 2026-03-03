/**
 * Centralized Error Handler — classifies API errors and shows toast notifications.
 */

import { showToast } from './toast.js';

const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    API: 'API_ERROR',
    AUTH: 'AUTH_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    SERVER: 'SERVER_ERROR',
};

const ERROR_MESSAGES = {
    [ERROR_TYPES.NETWORK]: 'No internet connection.',
    [ERROR_TYPES.AUTH]: 'Authorization required.',
    [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
    [ERROR_TYPES.SERVER]: 'Server error.',
    [ERROR_TYPES.API]: 'Something went wrong. Please try again.',
};

class ErrorHandler {
    classifyError(error, statusCode = null) {
        if (!navigator.onLine) return ERROR_TYPES.NETWORK;
        if (statusCode === 401) return ERROR_TYPES.AUTH;
        if (statusCode >= 500) return ERROR_TYPES.SERVER;
        if (error?.name === 'AbortError' || error?.message?.includes('timeout')) return ERROR_TYPES.TIMEOUT;
        if (error?.message?.includes('Failed to fetch')) return ERROR_TYPES.NETWORK;
        return ERROR_TYPES.API;
    }

    handleApiError(error, context = {}) {
        const statusCode = error?.response?.status || context.statusCode;
        const errorType = this.classifyError(error, statusCode);
        const userMessage = ERROR_MESSAGES[errorType];

        console.error(`[${errorType}]`, error?.message, context);
        showToast(userMessage, 'error');

        return { type: errorType, message: error?.message, userMessage };
    }

    notifyUser(message, type = 'error') {
        showToast(message, type);
    }
}

export const errorHandler = new ErrorHandler();
export { ERROR_TYPES };
export default errorHandler;
