import { CONFIG } from '../config/constants.js';
import { getItem, setItem, removeItems } from '../utils/storageUtils.js';

export class DataService {
    constructor({ apiUrl, cacheLifetime = 3600000, userId }) {
        this.apiUrl = apiUrl || 'http://ms2/php/api.php';
        this.cacheLifetime = cacheLifetime;
        this.userId = userId;
        this.cacheKeys = {
            recentActivity: `recentActivity_${userId}`,
            recentActivityTimestamp: `recentActivityTimestamp_${userId}`,
            listenLater: `listenLaterData_${userId}`,
            listenLaterTimestamp: `listenLaterTimestamp_${userId}`,
            albums: `albumsCache_${userId}`,
            albumsTimestamp: `albumsTimestamp_${userId}`
        };
        this.data = {
            recentActivity: null,
            listenLater: null,
            albums: null
        };
    }
    
    async fetchFromApi() {
        try {
            const url = this.userId ? 
                `${this.apiUrl}?user_id=${this.userId}` : 
                this.apiUrl;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error('❌ Ошибка при загрузке данных:', error);
            throw error;
        }
    }
    
    async loadData(forceRefresh = false) {
        try {
            if (!forceRefresh) {

                const cachedData = this.loadFromCache();
                if (cachedData) {
                    this.data = cachedData;
                    
                    if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
                        return this.loadData(true);
                    }
                    
                    return this.data;
                }
            }
            
            const serverData = await this.fetchFromApi();
            
            if (serverData && serverData.success) {
                this.data.recentActivity = serverData.recentActivity || [];
                this.data.listenLater = serverData.listenLater || [];
                this.data.albums = serverData.albums || [];
                
                this.saveToCache();
                
                return this.data;
            } else {
                throw new Error('Сервер вернул некорректные данные');
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            
            this.data = {
                recentActivity: [],
                listenLater: [],
                albums: []
            };
            
            return this.data;
        }
    }
    

    clearCache() {
        removeItems([
            this.cacheKeys.recentActivity,
            this.cacheKeys.recentActivityTimestamp,
            this.cacheKeys.listenLater,
            this.cacheKeys.listenLaterTimestamp,
            this.cacheKeys.albums,
            this.cacheKeys.albumsTimestamp
        ]);
    }
    

    loadFromCache() {
        try {
            const now = Date.now();
            
            const recentActivityTimestamp = getItem(this.cacheKeys.recentActivityTimestamp);
            const listenLaterTimestamp = getItem(this.cacheKeys.listenLaterTimestamp);
            
            const isRecentValid = recentActivityTimestamp && (now - parseInt(recentActivityTimestamp)) < this.cacheLifetime;
            const isLaterValid = listenLaterTimestamp && (now - parseInt(listenLaterTimestamp)) < this.cacheLifetime;
            
            if (isRecentValid && isLaterValid) {
                return {
                    recentActivity: getItem(this.cacheKeys.recentActivity, []),
                    listenLater: getItem(this.cacheKeys.listenLater, []),
                    albums: getItem(this.cacheKeys.albums, [])
                };
            }
        } catch (error) {
            console.warn('⚠️ Ошибка загрузки из кеша:', error);
        }
        
        return null;
    }
    

    saveToCache() {
        try {
            const now = Date.now();
            
            setItem(this.cacheKeys.recentActivity, this.data.recentActivity);
            setItem(this.cacheKeys.recentActivityTimestamp, now.toString());
            
            setItem(this.cacheKeys.listenLater, this.data.listenLater);
            setItem(this.cacheKeys.listenLaterTimestamp, now.toString());
            
            setItem(this.cacheKeys.albums, this.data.albums);
            setItem(this.cacheKeys.albumsTimestamp, now.toString());
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения в кеш:', error);
        }
    }
}