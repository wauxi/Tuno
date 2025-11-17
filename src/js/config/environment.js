/**
 * Environment Configuration
 * Uses meta tags for environment detection (proper way)
 */

// Read environment from meta tag or injected env vars (Vite)
const runtimeEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : {};

const getViteEnv = (key) => {
    const viteKey = `VITE_${key}`;
    if (Object.prototype.hasOwnProperty.call(runtimeEnv, viteKey)) {
        return runtimeEnv[viteKey];
    }
    if (Object.prototype.hasOwnProperty.call(runtimeEnv, key)) {
        return runtimeEnv[key];
    }
    return null;
};

const getMetaContent = (name) => {
    const meta = typeof document !== 'undefined'
        ? document.querySelector(`meta[name="${name}"]`)
        : null;
    if (meta) {
        return meta.getAttribute('content');
    }
    // allow fallback to Vite env variables (name converted to upper snake case)
    return getViteEnv(name.replace(/-/g, '_').toUpperCase());
};

const ENV = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    STAGING: 'staging',
    TEST: 'test'
};

// Get environment from meta tag or default
const getCurrentEnvironment = () => {
    // Priority 1: Meta tag
    const metaEnv = getMetaContent('app-env') || getViteEnv('APP_ENV');
    if (metaEnv && Object.values(ENV).includes(metaEnv)) {
        return metaEnv;
    }
    
    // Priority 2: hostname (fallback)
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'ms2') {
        return ENV.DEVELOPMENT;
    }
    
    if (hostname.includes('staging') || hostname.includes('stage')) {
        return ENV.STAGING;
    }
    
    if (hostname.includes('test')) {
        return ENV.TEST;
    }
    
    return ENV.PRODUCTION;
};

const currentEnv = getCurrentEnvironment();

// Environment-specific configuration
const resolvedApiBaseUrl = getMetaContent('api-base-url') || getViteEnv('API_BASE_URL');

const environmentConfig = {
    [ENV.DEVELOPMENT]: {
        API_BASE_URL: resolvedApiBaseUrl || 'http://localhost:8080',
        DEBUG_MODE: true,
        ENABLE_LOGGING: true,
    },
    [ENV.STAGING]: {
        API_BASE_URL: resolvedApiBaseUrl || '/',
        DEBUG_MODE: true,
        ENABLE_LOGGING: true,
    },
    [ENV.PRODUCTION]: {
        API_BASE_URL: resolvedApiBaseUrl || '/',
        DEBUG_MODE: false,
        ENABLE_LOGGING: false,
    },
    [ENV.TEST]: {
        API_BASE_URL: resolvedApiBaseUrl || 'http://localhost:8000',
        DEBUG_MODE: true,
        ENABLE_LOGGING: true,
    }
};

// Export current configuration
export const ENVIRONMENT = {
    CURRENT: currentEnv,
    IS_DEV: currentEnv === ENV.DEVELOPMENT,
    IS_PROD: currentEnv === ENV.PRODUCTION,
    IS_STAGING: currentEnv === ENV.STAGING,
    IS_TEST: currentEnv === ENV.TEST,
    ...environmentConfig[currentEnv]
};

// Timeouts constants (in milliseconds)
export const TIMEOUTS = {
    API_REQUEST: 30000,
    ELEMENT_WAIT: 10000,
    SEARCH_DEBOUNCE: 300,
    ANIMATION: 300,
    MODAL_SHOW: 10,
    INIT_DELAY: 100,
    NOTIFICATION: 5000,
    RATING_LOAD: 100,
};

// Cache constants
export const CACHE_CONSTANTS = {
    USER_DATA_TTL: 3600000, // 1 hour
    COVER_TTL: 2592000000, // 30 days
};

export default ENVIRONMENT;
