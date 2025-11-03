import { CACHE_CONFIG, cacheManager } from '../utils/CacheManager.js';

export class DataService {
    constructor({ apiUrl, userId }) {
        this.apiUrl = apiUrl || 'http://ms2/php/api.php';
        this.userId = userId;
        this.cacheManager = cacheManager;
        
        // Ключи кэша с префиксом пользователя
        this.cacheKey = `user_${userId}_data`;
        
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
            // Попытаться загрузить из кэша
            if (!forceRefresh) {
                const cachedData = this.cacheManager.get(this.cacheKey);
                
                if (cachedData) {
                    this.data = cachedData;
                    
                    if (!this.data.recentActivity || this.data.recentActivity.length === 0) {
                        return this.loadData(true);
                    }
                    
                    console.log('📦 Data loaded from cache');
                    return this.data;
                }
            }
            
            // Загрузить с сервера
            console.log('🌐 Loading data from server...');
            const serverData = await this.fetchFromApi();
            
            if (serverData && serverData.success) {
                this.data.recentActivity = serverData.recentActivity || [];
                this.data.listenLater = serverData.listenLater || [];
                this.data.albums = serverData.albums || [];
                
                // Сохранить в кэш
                this.cacheManager.set(
                    this.cacheKey, 
                    this.data, 
                    CACHE_CONFIG.TTL.USER_DATA
                );
                
                console.log('✅ Data loaded and cached');
                return this.data;
            } else {
                throw new Error('Сервер вернул некорректные данные');
            }
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            
            // Fallback на кэш даже если устарел
            const staleCache = localStorage.getItem(this.cacheKey);
            if (staleCache) {
                try {
                    const parsed = JSON.parse(staleCache);
                    this.data = parsed.value;
                    console.warn('⚠️ Using stale cache due to error');
                    return this.data;
                } catch (e) {
                    // Ignore parse errors
                }
            }
            
            this.data = {
                recentActivity: [],
                listenLater: [],
                albums: []
            };
            
            return this.data;
        }
    }
    
    /**
     * Инвалидировать кэш
     */
    clearCache() {
        return this.cacheManager.invalidateUserCache(this.userId);
    }
}