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
        try {
            localStorage.removeItem(this.cacheKeys.recentActivity);
            localStorage.removeItem(this.cacheKeys.recentActivityTimestamp);
            localStorage.removeItem(this.cacheKeys.listenLater);
            localStorage.removeItem(this.cacheKeys.listenLaterTimestamp);
            localStorage.removeItem(this.cacheKeys.albums);
            localStorage.removeItem(this.cacheKeys.albumsTimestamp);
        } catch (error) {
            console.warn('⚠️ Ошибка очистки кеша:', error);
        }
    }
    

    loadFromCache() {
        try {
            const now = Date.now();
            
            const recentActivityTimestamp = localStorage.getItem(this.cacheKeys.recentActivityTimestamp);
            const listenLaterTimestamp = localStorage.getItem(this.cacheKeys.listenLaterTimestamp);
            
            const isRecentValid = recentActivityTimestamp && (now - parseInt(recentActivityTimestamp)) < this.cacheLifetime;
            const isLaterValid = listenLaterTimestamp && (now - parseInt(listenLaterTimestamp)) < this.cacheLifetime;
            
            if (isRecentValid && isLaterValid) {
                return {
                    recentActivity: JSON.parse(localStorage.getItem(this.cacheKeys.recentActivity) || '[]'),
                    listenLater: JSON.parse(localStorage.getItem(this.cacheKeys.listenLater) || '[]'),
                    albums: JSON.parse(localStorage.getItem(this.cacheKeys.albums) || '[]')
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
            
            localStorage.setItem(this.cacheKeys.recentActivity, JSON.stringify(this.data.recentActivity));
            localStorage.setItem(this.cacheKeys.recentActivityTimestamp, now.toString());
            
            localStorage.setItem(this.cacheKeys.listenLater, JSON.stringify(this.data.listenLater));
            localStorage.setItem(this.cacheKeys.listenLaterTimestamp, now.toString());
            
            localStorage.setItem(this.cacheKeys.albums, JSON.stringify(this.data.albums));
            localStorage.setItem(this.cacheKeys.albumsTimestamp, now.toString());
        } catch (error) {
            console.warn('⚠️ Ошибка сохранения в кеш:', error);
        }
    }
}