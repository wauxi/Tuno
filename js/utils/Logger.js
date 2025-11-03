/**
 * Lightweight logging utility using native console with proper structure
 * No dependencies, no memory leaks, production-ready
 */

import { ENVIRONMENT } from '../config/environment.js';

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor() {
        this.level = ENVIRONMENT.DEBUG_MODE ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    }

    /**
     * Set log level
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Debug - detailed information for debugging
     */
    debug(message, ...args) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.debug(`[DEBUG]`, message, ...args);
        }
    }

    /**
     * Info - informational messages
     */
    info(message, ...args) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.info(`[INFO]`, message, ...args);
        }
    }

    /**
     * Success - successful operations
     */
    success(message, ...args) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.log(`%c[SUCCESS]`, 'color: #22c55e', message, ...args);
        }
    }

    /**
     * Warn - warnings
     */
    warn(message, ...args) {
        if (this.level <= LOG_LEVELS.WARN) {
            console.warn(`[WARN]`, message, ...args);
        }
    }

    /**
     * Error - errors
     */
    error(message, ...args) {
        if (this.level <= LOG_LEVELS.ERROR) {
            console.error(`[ERROR]`, message, ...args);
        }
    }

    /**
     * API request logging
     */
    api(method, url, data = null) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.groupCollapsed(`%c[API] ${method} ${url}`, 'color: #3b82f6');
            if (data) console.log('Data:', data);
            console.trace('Called from:');
            console.groupEnd();
        }
    }

    /**
     * Performance logging
     */
    perf(label, duration) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.log(`%c[PERF] ${label}`, 'color: #f59e0b', `${duration.toFixed(2)}ms`);
        }
    }

    /**
     * Group logs
     */
    group(label) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.groupEnd();
        }
    }

    /**
     * Table logging
     */
    table(data) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.table(data);
        }
    }
}

// Global logger instance
export const logger = new Logger();

// Export log levels
export { LOG_LEVELS };

export default logger;
