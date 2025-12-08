/**
 * EventBus - Simple event bus for decoupled communication
 * Replaces global variables and window.* patterns
 */
import { logger } from './Logger.js';

export class EventBus {
    constructor() {
        this.events = {};
    }
    
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(callback);
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }
    
    /**
     * Subscribe to an event (one time only)
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const onceWrapper = (data) => {
            callback(data);
            this.off(event, onceWrapper);
        };
        
        this.on(event, onceWrapper);
    }
    
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        if (!this.events[event]) return;
        
        this.events[event] = this.events[event].filter(cb => cb !== callback);
        
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
    }
    
    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to callbacks
     */
    emit(event, data) {
        if (!this.events[event]) return;
        
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                logger.error(`Error in event handler for "${event}":`, error);
            }
        });
    }
    
    /**
     * Clear all event listeners
     * @param {string} event - Optional event name to clear specific event
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }
    
    /**
     * Get all registered events
     * @returns {Array} Array of event names
     */
    getEvents() {
        return Object.keys(this.events);
    }
    
    /**
     * Get number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    getListenerCount(event) {
        return this.events[event]?.length || 0;
    }
}

// Create singleton instance
export const eventBus = new EventBus();

// Event names constants to avoid typos
export const EVENTS = {
    // User events
    USER_LOGIN: 'user:login',
    USER_LOGOUT: 'user:logout',
    USER_SWITCH: 'user:switch',
    USER_UPDATED: 'user:updated',
    
    // Rating events
    RATING_ADDED: 'rating:added',
    RATING_UPDATED: 'rating:updated',
    RATING_DELETED: 'rating:deleted',
    RATINGS_LOADED: 'ratings:loaded',
    
    // Album events
    ALBUM_ADDED: 'album:added',
    ALBUM_REMOVED: 'album:removed',
    ALBUM_UPDATED: 'album:updated',
    
    // UI events
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    SEARCH_QUERY: 'search:query',
    SEARCH_RESULTS: 'search:results',
    
    // Data events
    DATA_LOADED: 'data:loaded',
    DATA_ERROR: 'data:error',
    CLEAR_CACHE: 'data:clear_cache',

    // Navigation events
    NAVIGATE: 'navigate',
    ROUTE_CHANGED: 'route:changed',
};
