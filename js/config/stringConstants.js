/**
 * String Constants and Magic Strings
 * Все строковые константы приложения в одном месте
 */

// Data types
export const DATA_TYPES = {
    RECENT_ACTIVITY: 'recentActivity',
    LISTEN_LATER: 'listenLater',
    ALBUMS: 'albums',
};

// Storage keys
export const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    CURRENT_USER_ID: 'currentUserId',
    NEEDS_FRESH_DATA: 'needsFreshData',
    ERROR_LOGS: 'error_logs',
};

// CSS Classes
export const CSS_CLASSES = {
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    ACTIVE: 'active',
    LOADING: 'loading',
    ERROR: 'error',
    LOADED: 'loaded',
};

// DOM Selectors
export const SELECTORS = {
    ALBUM_MENU: '.album-menu',
    RECENTLY_LIST: '.recently__list',
    LISTEN_LATER_LIST: '.listen-later__list',
    DELETE_BTN: '.delete-btn',
};

// Template types
export const TEMPLATE_TYPES = {
    ALBUM_ITEM: 'album-item',
    LISTEN_LATER_ITEM: 'listen-later-item',
};

// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest',
};

// Action types
export const ACTIONS = {
    LOGOUT: 'logout',
    LOGIN: 'login',
    SIGNUP: 'signup',
    SWITCH_USER: 'switch-user',
    WRITE_REVIEW: 'write-review',
    GO_TO_ALBUM: 'go-to-album',
    REMOVE_LISTEN_LATER: 'remove-listen-later',
};

// HTTP Methods
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
};

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

export default {
    DATA_TYPES,
    STORAGE_KEYS,
    CSS_CLASSES,
    SELECTORS,
    TEMPLATE_TYPES,
    USER_ROLES,
    ACTIONS,
    HTTP_METHODS,
    HTTP_STATUS,
    NOTIFICATION_TYPES,
};
