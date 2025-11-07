import { CACHE_CONFIG, cacheManager } from '../utils/CacheManager.js';
import { CONFIG } from '../../config/constants.js';
import { errorHandler } from '../utils/ErrorHandler.js';
import { logger } from '../utils/Logger.js';

export class DataService {
    constructor({ apiUrl, userId }) {
        this.apiUrl = apiUrl || `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.MAIN}`;
        this.userId = userId;
        this.cacheManager = cacheManager;
        
        this.cacheKey = `user_${userId}_data`;
        
        this.data = {
            recentActivity: null,
            listenLater: null,
            albums: null
        };
    }
    
    async fetchFromApi(retryCount = 0) {
        const MAX_RETRIES = 3;
        
        try {
            const url = this.userId ? 
                `${this.apiUrl}?user_id=${this.userId}` : 
                this.apiUrl;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache',
                signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return data;
        } catch (error) {
            await errorHandler.handleApiError(error, { 
                url: this.apiUrl, 
                userId: this.userId, 
                attempt: retryCount + 1 
            });
            
            // Retry logic
            if (retryCount < MAX_RETRIES) {
                const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                logger.info(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchFromApi(retryCount + 1);
            }
            
            throw error;
        }
    }
    
    async loadData(forceRefresh = false) {
        try {
            // Attempt to load from cache
            if (!forceRefresh) {
                const cachedData = this.cacheManager.get(this.cacheKey);
                
                if (cachedData) {
                    this.data = cachedData;
                    
                    if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
                        return this.loadData(true);
                    }
                    
                    logger.info('Data loaded from cache');
                    return this.data;
                }
            }
            
            // Load from server with retry logic
            logger.info('Loading data from server...');
            const serverData = await this.fetchFromApi();
            
            if (serverData && serverData.success) {
                this.data.recentActivity = serverData.recentActivity || [];
                this.data.listenLater = serverData.listenLater || [];
                this.data.albums = serverData.albums || [];
                
                // Save to cache
                this.cacheManager.set(
                    this.cacheKey, 
                    this.data, 
                    CACHE_CONFIG.TTL.USER_DATA
                );
                
                logger.success('Data loaded and cached');
                return this.data;
            } else {
                throw new Error('Server returned invalid data');
            }
            
        } catch (error) {
            await errorHandler.handleApiError(error, { 
                userId: this.userId, 
                forceRefresh 
            });
            
            // Fallback to stale cache on error
            const staleCache = localStorage.getItem(this.cacheKey);
            if (staleCache) {
                try {
                    const parsed = JSON.parse(staleCache);
                    this.data = parsed.value;
                    logger.warn('Using stale cache due to error');
                    errorHandler.notifyUser('Using cached data', 'warning');
                    return this.data;
                } catch (e) {
                    logger.error('Failed to parse stale cache:', e);
                }
            }
            
            // Return empty data as last resort
            this.data = {
                recentActivity: [],
                listenLater: [],
                albums: []
            };
            
            return this.data;
        }
    }
    
    clearCache() {
        return this.cacheManager.invalidateUserCache(this.userId);
    }
}