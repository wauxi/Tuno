// Application Configuration Constants

export const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'php',
        ENDPOINTS: {
            MAIN: 'api.php',
            AUTH: 'auth-api.php',
            RATINGS: 'ratings-api.php',
            USERS: 'get-users.php',
        },
        TIMEOUT: 30000, // 30 seconds
    },
    
    // Cache Configuration
    CACHE: {
        LIFETIME: 60 * 60 * 1000, // 1 hour in milliseconds
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
        USER_ID: 4, // Default viewing user
        GUEST_USER_ID: 1, // Guest user
        ITEMS_PER_PAGE: 20,
        COVER_PLACEHOLDER: 'img/default-cover.png',
    },
    
    // UI Timing (milliseconds)
    UI: {
        SEARCH_DEBOUNCE: 300, // Debounce delay for search input
        ANIMATION_DURATION: 300, // CSS transition duration
        MODAL_SHOW_DELAY: 10, // Delay before showing modal animation
        INIT_DELAY: 100, // Delay for component initialization
        NOTIFICATION_DURATION: 5000, // Toast notification display time
        RATING_LOAD_DELAY: 100, // Delay before loading rating in modal
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
        DEBUG_MODE: false,
    }
};

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
