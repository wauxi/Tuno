/**
 * Unified Cache Manager
 * Единая стратегия кэширования для всего приложения - только localStorage
 */

import { logger } from './Logger.js';

const CACHE_CONFIG = {
    // TTL для разных типов данных
    TTL: {
        USER_DATA: 3600000,      // 1 час для данных пользователя
        ALBUM_COVERS: 2592000000, // 30 дней для обложек
        SEARCH_RESULTS: 300000,   // 5 минут для результатов поиска
    },
    
    // Префиксы ключей
    PREFIX: {
        USER: 'user_',
        COVERS: 'covers_',
        SEARCH: 'search_',
        TIMESTAMP: 'ts_',
    }
};

export class CacheManager {
    constructor() {
        this.storage = localStorage; // Только localStorage, никакого sessionStorage
    }
    
    /**
     * Установить значение в кэш
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
     * Получить значение из кэша
     */
    get(key) {
        try {
            const itemStr = this.storage.getItem(key);
            if (!itemStr) return null;
            
            const item = JSON.parse(itemStr);
            const now = Date.now();
            
            // Проверить TTL
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
     * Проверить, есть ли валидный кэш
     */
    has(key) {
        return this.get(key) !== null;
    }
    
    /**
     * Удалить ключ из кэша
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
     * Очистить кэш по префиксу
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
     * Инвалидировать кэш пользователя
     */
    invalidateUserCache(userId) {
        const prefix = `${CACHE_CONFIG.PREFIX.USER}${userId}_`;
        return this.clearByPrefix(prefix);
    }
    
    /**
     * Получить размер кэша в байтах
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
     * Получить размер кэша в человекочитаемом формате
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

// Helper functions для обратной совместимости
export const getItem = (key) => cacheManager.get(key);
export const setItem = (key, value, ttl) => cacheManager.set(key, value, ttl);
export const removeItem = (key) => cacheManager.delete(key);
export const removeItems = (keys) => keys.forEach(key => cacheManager.delete(key));
export const hasItem = (key) => cacheManager.has(key);
export const clear = () => localStorage.clear();
export const getSize = () => cacheManager.getSize();

export { CACHE_CONFIG };
