// Application Configuration Constants
import { ENVIRONMENT, TIMEOUTS, CACHE_CONSTANTS } from './environment.js';

export const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: ENVIRONMENT.API_BASE_URL,
        ENDPOINTS: {
            MAIN: 'api.php',
            AUTH: 'auth-api.php',
            RATINGS: 'ratings-api.php',
            USERS: 'get-users.php',
        },
        TIMEOUT: TIMEOUTS.API_REQUEST,
    },
    
    // Cache Configuration
    CACHE: {
        LIFETIME: CACHE_CONSTANTS.USER_DATA_TTL,
        KEYS: {
            RECENT_ACTIVITY: 'recentActivity',
            LISTEN_LATER: 'listenLater',
            ALBUMS: 'albums',
            CURRENT_USER: 'currentUser',
            CURRENT_USER_ID: 'currentUserId',
        }
    },
    
    // Default Values
    DEFAULTS: {
        USER_ID: 4,
        GUEST_USER_ID: 1,
        ITEMS_PER_PAGE: 20,
        COVER_PLACEHOLDER: 'img/default-cover.png',
    },
    
    // UI Timing (milliseconds)
    UI: {
        SEARCH_DEBOUNCE: TIMEOUTS.SEARCH_DEBOUNCE,
        ANIMATION_DURATION: TIMEOUTS.ANIMATION,
        MODAL_SHOW_DELAY: TIMEOUTS.MODAL_SHOW,
        INIT_DELAY: TIMEOUTS.INIT_DELAY,
        NOTIFICATION_DURATION: TIMEOUTS.NOTIFICATION,
        RATING_LOAD_DELAY: TIMEOUTS.RATING_LOAD,
    },
    
    // Routes
    ROUTES: {
        HOME: 'Home.html',
        LOGIN: 'login.html',
        SIGNUP: 'login.html?mode=register',
    },
    
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        USER: 'user',
        GUEST: 'guest',
    },
    
    // Rating System
    RATING: {
        MIN: 0,
        MAX: 10,
        STARS: 5,
        HALF_STAR_ENABLED: true,
    },
    
    // Image Configuration
    IMAGES: {
        PLACEHOLDER: 'https://via.placeholder.com/150x150/333/666?text=No+Image',
        FALLBACK: 'img/default-cover.png',
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_SEARCH: true,
        ENABLE_CACHE: true,
        ENABLE_NOTIFICATIONS: true,
        DEBUG_MODE: ENVIRONMENT.DEBUG_MODE,
    }
};

// Export environment
export { ENVIRONMENT, TIMEOUTS, CACHE_CONSTANTS };

// Helper functions to get config values
export const getApiUrl = (endpoint) => {
    return `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS[endpoint] || endpoint}`;
};

export const getCacheKey = (key) => {
    return CONFIG.CACHE.KEYS[key] || key;
};

export const getRoute = (route) => {
    return CONFIG.ROUTES[route] || route;
};

export const isDebugMode = () => {
    return CONFIG.FEATURES.DEBUG_MODE;
};

// Export individual constants for convenience
export const {
    API,
    CACHE,
    DEFAULTS,
    UI,
    ROUTES,
    ROLES,
    RATING,
    IMAGES,
    FEATURES
} = CONFIG;
