import { Navigation } from './navigation.js';
import { DataService } from './data-service.js';
import { AlbumGrid } from './album-grid.js';
import { RatingManager } from './rating-manager.js';
import { SearchManager } from './search-manager.js';


class MusicboardApp {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.viewingUserId = null;
        this.dataService = null;
        this.recentlyGrid = null;
        this.listenLaterGrid = null;
        this.usersCache = null;
        this.ratingManager = null;
        this.searchManager = null;

        
        this.init();
    }
    
    async init() {
        this.checkAuth();
        await this.loadUsers();
        
        this.viewingUserId = this.getUserIdFromUrl() || 
                        (this.currentUser ? this.currentUser.id : 4);
        
        this.setupUI();
        new Navigation();
        this.initServices();
        await this.loadData();
        this.updateUrl();
        
        this.initRatingSystem();
                if (this.ratingManager) {
            this.searchManager = new SearchManager(this.ratingManager);
        } else {
            console.error('RatingManager не найден для SearchManager');
        }
    }
    
    checkAuth() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                this.currentUser = JSON.parse(currentUser);
                this.isLoggedIn = true;
            } catch (error) {
                localStorage.removeItem('currentUser');
            }
        }
    }

    isCurrentUserAdmin() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.isAdmin === true);
    }

    async loadUsers() {
        try {
            const response = await fetch('php/get-users.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.users && data.users.length > 0) {
                this.usersCache = data.users;
            } else {
                this.usersCache = [];
            }
        } catch (error) {
            this.usersCache = [];
        }
    }
    
    setupUI() {
        const authButtons = document.querySelector('.navigation__auth');
        const userInfo = document.querySelector('.navigation__user-info');
        const profileInfo = document.querySelector('.info__profile-name');
        
        if (this.isLoggedIn && this.currentUser) {
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="navigation__user-content">
                        <span class="navigation__user-name">${this.currentUser.display_name || this.currentUser.username}</span>
                        <button class="navigation__logout-btn" onclick="musicboardApp.logout()">Выйти</button>
                    </div>
                `;
                userInfo.style.display = 'flex';
            }
            if (profileInfo) {
                const userName = this.getUserNameById(this.viewingUserId);
                const isOwnProfile = this.currentUser.id === this.viewingUserId;
                profileInfo.innerHTML = `
                    <h5 class="nickname">${userName}</h5>
                    <h3 class="name">${userName}</h3>
                    <h4 class="biografy">${isOwnProfile ? 'Ваша музыкальная активность' : 'Музыкальная активность пользователя'}</h4>
                `;
            }
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (authButtons) {
                authButtons.style.display = 'flex';
                authButtons.innerHTML = `
                    <button type="button" class="navigation__auth-button button" onclick="musicboardApp.goToLogin()">
                        <span>Login</span>
                    </button>
                    <button type="button" class="navigation__auth-button button" onclick="musicboardApp.goToSignup()">
                        <span>Sign Up</span>
                    </button>
                `;
            }
            if (profileInfo) {
                const userName = this.getUserNameById(this.viewingUserId);
                const switcherButtons = this.getUserSwitcherHTML();
                profileInfo.innerHTML = `
                    <h5 class="nickname">${userName}</h5>
                    <h3 class="name">${userName}</h3>
                    <h4 class="biografy">
                        Музыкальная активность пользователя
                        <div class="user-switcher">${switcherButtons}</div>
                    </h4>
                `;
            }
        }
    }
    
    getUserSwitcherHTML() {
        if (!this.usersCache || this.usersCache.length === 0) {
            return '<p>Пользователи не найдены</p>';
        }
        
        return this.usersCache.map(user => {
            const isActive = this.viewingUserId === user.id;
            const userName = user.display_name || user.username;
            const activeClass = isActive ? 'active' : '';
            return `<button onclick="musicboardApp.switchUser(${user.id})" class="${activeClass}">${userName}</button>`;
        }).join('');
    }
    
    initServices() {
        this.dataService = new DataService({
            apiUrl: 'http://ms2/php/api.php',
            cacheLifetime: 60 * 60 * 1000,
            userId: this.viewingUserId
        });
        
        this.recentlyGrid = new AlbumGrid({
            container: document.querySelector('.recently__list'),
            dataType: 'recentActivity',
            dataService: this.dataService
        });
        
        this.listenLaterGrid = new AlbumGrid({
            container: document.querySelector('.listen-later__list'),
            dataType: 'listenLater',
            dataService: this.dataService,
            template: 'listen-later-item'
        });
    }
    
    initRatingSystem() {
        this.ratingManager = new RatingManager();
        window.ratingManager = this.ratingManager;
        
        if (this.currentUser) {
            localStorage.setItem('currentUserId', this.currentUser.id);
        } else {
            localStorage.setItem('currentUserId', this.viewingUserId || 1);
        }
        
        setTimeout(() => {
            this.initAlbumMenus();
        }, 1000);
        
        window.addEventListener('ratingUpdated', () => {
            this.initAlbumMenus();
        });
    }
    
    initAlbumMenus() {
        const albumMenus = document.querySelectorAll('.album-menu');
        
        albumMenus.forEach(menu => {
            const newMenu = menu.cloneNode(true);
            menu.parentNode.replaceChild(newMenu, menu);
            
            this.attachMenuHandlers(newMenu);
        });
    }
    

    attachMenuHandlers(menu) {
        const albumElement = menu.closest('[data-album-id]');
        if (!albumElement) return;
        
        const albumId = parseInt(albumElement.dataset.albumId);
        
        const writeReviewBtn = menu.querySelector('[data-action="write-review"]');
        const removeBtn = menu.querySelector('[data-action="remove-listen-later"]');
        const spotifyBtn = menu.querySelector('[data-action="go-to-album"]');
        
        if (writeReviewBtn) {
            if (!this.isLoggedIn) {
                writeReviewBtn.style.display = 'none';
            } else {
                writeReviewBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleWriteReview(albumId, albumElement);
                });
            }
        }
        
        if (removeBtn) {
            if (!this.isLoggedIn || !this.isCurrentUserAdmin()) {
                removeBtn.style.display = 'none';
            } else {
                removeBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    await this.handleRemoveFromListenLater(albumId, albumElement);
                });
            }
        }
        
        if (spotifyBtn) {
            spotifyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleGoToAlbum(albumElement);
            });
        }
    }

    
    async handleWriteReview(albumId, albumElement) {
        try {
            const albumData = this.extractAlbumData(albumElement, albumId);
            
            let existingRating = null;
            
            try {
                const ratingResponse = await this.ratingManager.getRating(albumId);
                if (ratingResponse.success && ratingResponse.rating) {
                    existingRating = ratingResponse.rating;
                    console.log('Получен рейтинг с сервера:', existingRating);
                }
            } catch (error) {
                console.error('Ошибка при получении рейтинга:', error);
            }
            
            if (!existingRating) {
                const ratingDataAttr = albumElement.dataset.ratingData;
                if (ratingDataAttr) {
                    try {
                        const ratingData = JSON.parse(ratingDataAttr);
                        
                        if (ratingData.rating_id || ratingData.rating > 0) {
                            existingRating = {
                                id: ratingData.rating_id,
                                rating: ratingData.rating,
                                favorite_song: ratingData.favorite_song,
                                least_favorite_song: ratingData.least_favorite_song,
                                must_listen: ratingData.must_listen,
                                would_relisten: ratingData.would_relisten,
                                listened_date: ratingData.listened_date,
                                review: ratingData.review
                            };
                            console.log('Получен рейтинг из data-атрибута:', existingRating);
                        }
                    } catch (e) {
                        console.error('Ошибка парсинга data-rating-data:', e);
                    }
                }
            }
            
            this.ratingManager.showRatingModal(albumData, existingRating);
            
        } catch (error) {
            alert('Ошибка при открытии формы оценки: ' + error.message);
        }
    }
    
    async handleRemoveFromListenLater(albumId, albumElement) {
        if (!this.isCurrentUserAdmin()) {
            alert('У вас нет прав для удаления альбомов из базы данных. Требуются права администратора.');
            return;
        }
        
        const albumName = albumElement.querySelector('.listen-later__album, .recently__album')?.textContent || 'этот альбом';
        const artist = albumElement.querySelector('.listen-later__artist, .recently__artist')?.textContent || '';
        const fullName = artist ? `${artist} - ${albumName}` : albumName;
        
        if (!confirm(`⚠️ ВНИМАНИЕ! Вы собираетесь удалить "${fullName}" из базы данных навсегда!\n\nЭто действие нельзя отменить. Продолжить?`)) {
            return;
        }
        
        try {
            const response = await fetch('php/api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'remove_from_listen_later',
                    album_id: albumId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                albumElement.style.transition = 'opacity 0.3s ease';
                albumElement.style.opacity = '0';
                
                setTimeout(() => {
                    albumElement.remove();
                }, 300);
                
                alert('Альбом успешно удален из базы данных');
                
                setTimeout(() => {
                    this.loadData();
                }, 500);
                
            } else {
                throw new Error(result.error || result.message || 'Ошибка при удалении');
            }
            
        } catch (error) {
            if (error.message.includes('авторизации') || error.message.includes('401')) {
                alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
                this.logout();
            } else if (error.message.includes('Доступ запрещен') || error.message.includes('403')) {
                alert('У вас нет прав для выполнения этого действия. Требуются права администратора.');
            } else {
                alert('Ошибка при удалении: ' + error.message);
            }
        }
    }
    
    handleGoToAlbum(albumElement) {
        const spotifyLink = albumElement.dataset.spotifyLink || 
                           albumElement.querySelector('[data-spotify-link]')?.dataset.spotifyLink;
        
        if (spotifyLink) {
            window.open(spotifyLink, '_blank');
        } else {
            const albumName = albumElement.querySelector('.recently__album, .listen-later__album')?.textContent;
            const artist = albumElement.querySelector('.recently__artist, .listen-later__artist')?.textContent;
            
            if (albumName && artist) {
                const searchQuery = encodeURIComponent(`${artist} ${albumName}`);
                window.open(`https://open.spotify.com/search/${searchQuery}`, '_blank');
            } else {
                alert('Не удалось найти ссылку на альбом в Spotify');
            }
        }
    }
    
    getCurrentUserId() {
        return localStorage.getItem('currentUserId') || this.viewingUserId || 1;
    }
    
    extractAlbumData(element, albumId) {
        const titleSelectors = [
            '.album-title', '.title', '.name', 
            'h3', 'h2', 'h4',
            '[class*="title"]', '[class*="name"]',
            '.recently__album', '.listen-later__album'
        ];
        
        let titleElement = null;
        for (const selector of titleSelectors) {
            titleElement = element.querySelector(selector);
            if (titleElement && titleElement.textContent.trim()) break;
        }
        
        const artistSelectors = [
            '.album-artist', '.artist', '.performer', '.author',
            '[class*="artist"]', '[class*="performer"]',
            '.recently__artist', '.listen-later__artist'
        ];
        
        let artistElement = null;
        for (const selector of artistSelectors) {
            artistElement = element.querySelector(selector);
            if (artistElement && artistElement.textContent.trim()) break;
        }
        
        const coverElement = element.querySelector('img');
        
        const albumData = {
            id: albumId,
            album_name: titleElement ? titleElement.textContent.trim() : 'Неизвестный альбом',
            artist: artistElement ? artistElement.textContent.trim() : 'Неизвестный исполнитель',
            coverUrl: coverElement ? coverElement.src : 'img/default-cover.png'
        };
        
        return albumData;
    }
    
    async loadData() {
        try {
            this.dataService.clearCache();
            await this.dataService.loadData(true);
            
            if (this.recentlyGrid) this.recentlyGrid.render();
            if (this.listenLaterGrid) this.listenLaterGrid.render();
            
            setTimeout(() => {
                this.initAlbumMenus();
            }, 500);
            
        } catch (error) {
        }
    }
    
    getUserIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const userIdParam = urlParams.get('user');
        return userIdParam ? parseInt(userIdParam) : null;
    }
    
    updateUrl() {
        const url = new URL(window.location);
        url.searchParams.set('user', this.viewingUserId);
        window.history.replaceState({}, '', url);
    }
    
    getUserNameById(userId) {
        const numericUserId = parseInt(userId);
        
        if (this.usersCache && this.usersCache.length > 0) {
            const user = this.usersCache.find(u => u.id === numericUserId);
            if (user) {
                return user.display_name || user.username;
            }
        }
        
        return `User ${numericUserId}`;
    }
    
    switchUser(userId) {
        if (this.isLoggedIn) return;
        window.location.href = `Home.html?user=${userId}`;
    }
    
    goToLogin() {
        window.location.href = 'login.html';
    }
    
    goToSignup() {
        window.location.href = 'login.html?mode=register';
    }
    
    async logout() {
        try {
            const response = await fetch('php/auth-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
            
            const result = await response.json();
        } catch (error) {
        } finally {
            this.currentUser = null;
            this.isLoggedIn = false;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentUserId');
            
            if (this.dataService) {
                this.dataService.clearCache();
            }
            
            const currentUserId = this.getUserIdFromUrl() || 4;
            window.location.href = `Home.html?user=${currentUserId}`;
        }
    }
    
    async refreshRatings() {
        await this.initAlbumMenus();
    }
    
    getRatingManager() {
        return this.ratingManager;
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
}

let musicboardApp = null;

document.addEventListener('DOMContentLoaded', () => {
    musicboardApp = new MusicboardApp();
});

window.musicboardApp = {
    switchUser: (userId) => musicboardApp?.switchUser(userId),
    goToLogin: () => musicboardApp?.goToLogin(),
    goToSignup: () => musicboardApp?.goToSignup(),
    logout: () => musicboardApp?.logout(),
    refreshRatings: () => musicboardApp?.refreshRatings(),
    getRatingManager: () => musicboardApp?.getRatingManager(),
    getCurrentUser: () => musicboardApp?.getCurrentUser(),
    isCurrentUserAdmin: () => musicboardApp?.isCurrentUserAdmin()
};

window.musicboardAppInstance = musicboardApp;