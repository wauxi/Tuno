/**
 * Centralized Error Handler with proper error taxonomy
 */

import { ENVIRONMENT } from '../config/environment.js';

// Error types
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    API: 'API_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTH: 'AUTH_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    PERMISSION: 'PERMISSION_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    SERVER: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// User-friendly messages
const ERROR_MESSAGES = {
    [ERROR_TYPES.NETWORK]: 'No internet connection. Please check your network.',
    [ERROR_TYPES.AUTH]: 'Authentication required. Please log in.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_TYPES.PERMISSION]: 'You don\'t have permission to perform this action.',
    [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
    [ERROR_TYPES.SERVER]: 'Server error. Our team has been notified.',
    [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
    [ERROR_TYPES.UNKNOWN]: 'Something went wrong. Please try again.'
};

export class AppError extends Error {
    constructor(type, message, context = {}, originalError = null) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.context = context;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
        this.userMessage = ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
    }
}

export class ErrorHandler {
    constructor() {
        this.listeners = [];
        this.sentryInitialized = false;
    }

    /**
     * Classify error by HTTP status or error type
     */
    classifyError(error, statusCode = null) {
        if (!navigator.onLine) {
            return ERROR_TYPES.NETWORK;
        }

        if (statusCode) {
            if (statusCode === 401) return ERROR_TYPES.AUTH;
            if (statusCode === 403) return ERROR_TYPES.PERMISSION;
            if (statusCode === 404) return ERROR_TYPES.NOT_FOUND;
            if (statusCode === 408) return ERROR_TYPES.TIMEOUT;
            if (statusCode >= 500) return ERROR_TYPES.SERVER;
        }

        if (error.name === 'AbortError' || error.message.includes('timeout')) {
            return ERROR_TYPES.TIMEOUT;
        }

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return ERROR_TYPES.NETWORK;
        }

        return ERROR_TYPES.API;
    }

    /**
     * Handle API errors with proper classification
     */
    handleApiError(error, context = {}) {
        const statusCode = error.response?.status || context.statusCode;
        const errorType = this.classifyError(error, statusCode);

        const appError = new AppError(
            errorType,
            error.message,
            {
                ...context,
                statusCode,
                url: context.url,
                method: context.method,
                userId: this.getUserContext()
            },
            error
        );

        this.logError(appError);
        this.notifyUser(appError.userMessage, 'error');
        this.reportToMonitoring(appError);

        return appError;
    }

    /**
     * Handle validation errors
     */
    handleValidationError(message, field = null) {
        const appError = new AppError(
            ERROR_TYPES.VALIDATION,
            message,
            { field }
        );

        this.logError(appError);
        return appError;
    }

    /**
     * Log error to console
     */
    logError(error) {
        const logData = {
            type: error.type,
            message: error.message,
            context: error.context,
            timestamp: error.timestamp,
            stack: error.stack
        };

        if (ENVIRONMENT.DEBUG_MODE) {
            console.group(`%c❌ ${error.type}`, 'color: #ff4444; font-weight: bold');
            console.error('Message:', error.message);
            console.error('Context:', error.context);
            console.error('Stack:', error.stack);
            console.groupEnd();
        } else {
            console.error(`[${error.type}]`, error.message);
        }

        // Notify listeners
        this.listeners.forEach(callback => callback(error));
    }

    /**
     * Show user notification
     */
    notifyUser(message, type = 'error') {
        window.dispatchEvent(new CustomEvent('app:notification', {
            detail: { message, type }
        }));
    }

    /**
     * Report to monitoring service (Sentry placeholder)
     */
    reportToMonitoring(error) {
        if (!ENVIRONMENT.IS_PROD) return;

        // Placeholder for Sentry/LogRocket integration
        if (typeof Sentry !== 'undefined' && this.sentryInitialized) {
            Sentry.captureException(error.originalError || error, {
                tags: {
                    errorType: error.type
                },
                contexts: {
                    custom: error.context
                }
            });
        }
    }

    /**
     * Get user context for error reporting
     */
    getUserContext() {
        try {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr).id : 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    /**
     * Initialize Sentry (call this in app init)
     */
    initSentry(dsn) {
        if (typeof Sentry !== 'undefined') {
            Sentry.init({
                dsn,
                environment: ENVIRONMENT.CURRENT,
                beforeSend(event) {
                    // Don't send errors in development
                    if (ENVIRONMENT.IS_DEV) return null;
                    return event;
                }
            });
            this.sentryInitialized = true;
        }
    }

    /**
     * Add error listener
     */
    onError(callback) {
        this.listeners.push(callback);
    }

    /**
     * Clear all listeners
     */
    clearListeners() {
        this.listeners = [];
    }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Setup global error handlers
window.addEventListener('error', (event) => {
    errorHandler.handleApiError(event.error, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleApiError(event.reason, {
        type: 'unhandled_promise_rejection'
    });
});

export default errorHandler;
