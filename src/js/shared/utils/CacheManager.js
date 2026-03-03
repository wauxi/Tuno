/**
 * Unified Cache Manager
 * Unified caching strategy for the entire application - localStorage only
 */

import { logger } from './Logger.js';
import { CACHE_CONSTANTS } from '../../config/constants.js';

const CACHE_CONFIG = {
    TTL: {
        USER_DATA: CACHE_CONSTANTS.USER_DATA_TTL,
        ALBUM_COVERS: CACHE_CONSTANTS.COVER_TTL,
        SEARCH_RESULTS: 300000,
    },
    PREFIX: {
        USER: 'user_',
        COVERS: 'covers_',
        SEARCH: 'search_',
    }
};

export class CacheManager {
    constructor() {
        this.storage = localStorage; // Only localStorage, no sessionStorage
    }
    
    /**
     * Set a value in the cache
     */
    set(key, value, ttl = CACHE_CONFIG.TTL.USER_DATA) {
        try {
            const item = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            };
            
            this.storage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            logger.error(`Cache set error for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Get a value from the cache
     */
    get(key) {
        try {
            const itemStr = this.storage.getItem(key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            const now = Date.now();
            
            // Check TTL
            if (now - item.timestamp > item.ttl) {
                this.delete(key);
                return null;
            }
            
            return item.value;
        } catch (error) {
            logger.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Check if a valid cache entry exists
     */
    has(key) {
        return this.get(key) !== null;
    }
    
    /**
     * Delete a key from the cache
     */
    delete(key) {
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            logger.error(`Cache delete error for key ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Clear cache by prefix
     */
    clearByPrefix(prefix) {
        try {
            const keys = Object.keys(this.storage);
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    this.storage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            logger.error(`Cache clear by prefix error:`, error);
            return false;
        }
    }
    
    /**
     * Invalidate user cache
     */
    invalidateUserCache(userId) {
        const prefix = `${CACHE_CONFIG.PREFIX.USER}${userId}_`;
        return this.clearByPrefix(prefix);
    }
    
    /**
     * Get cache size in bytes
     */
    getSize() {
        let size = 0;
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                size += this.storage[key].length + key.length;
            }
        }
        return size;
    }
    
    /**
     * Get cache size in human-readable format
     */
    getSizeFormatted() {
        const bytes = this.getSize();
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Helper functions for backward compatibility
export const getItem = (key) => cacheManager.get(key);
export const setItem = (key, value, ttl) => cacheManager.set(key, value, ttl);
export const removeItem = (key) => cacheManager.delete(key);
export const removeItems = (keys) => keys.forEach(key => cacheManager.delete(key));
export const hasItem = (key) => cacheManager.has(key);
export const clear = () => localStorage.clear();
export const getSize = () => cacheManager.getSize();

export { CACHE_CONFIG };
