import { Navigation } from './utils/Navigation.js';
import { DataService } from './services/DataService.js';
import { AlbumGrid } from './components/AlbumGrid.js';
import { RatingManager } from './managers/RatingManager.js';
import { SearchManager } from './managers/SearchManager.js';
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import { UIManager } from './components/UIManager.js';
import { AlbumMenuManager } from './components/AlbumMenuManager.js';
import { eventBus, EVENTS } from './utils/EventBus.js';
import { CONFIG, DEFAULTS, UI, ROUTES, TIMEOUTS } from './config/constants.js';
import { setCurrentUserId } from './utils/authUtils.js';
import { logger } from './utils/Logger.js';
import './components/RatingModalComponent.js';


class MusicboardApp {
    constructor() {
        this.authService = new AuthService();
        this.userService = new UserService();
        this.uiManager = null;
        this.albumMenuManager = null;
        this.viewingUserId = null;
        this.dataService = null;
        this.recentlyGrid = null;
        this.listenLaterGrid = null;
        this.ratingManager = null;
        this.searchManager = null;

        
        this.init();
    }
    
    async init() {
        // Check auth synchronously (reads from localStorage)
        this.authService.checkAuth();
        
        // Load users asynchronously
        await this.userService.loadUsers();
        
        this.viewingUserId = this.getUserIdFromUrl() || 
                        (this.authService.getCurrentUser() ? this.authService.getCurrentUser().id : DEFAULTS.USER_ID);
        
        this.uiManager = new UIManager(this.authService, this.userService);
        this.uiManager.setViewingUserId(this.viewingUserId);
        this.uiManager.updateUI();
        
        new Navigation();
        this.initDataServices();
        
        // Load data asynchronously
        await this.loadData();
        
        // Update URL (synchronous)
        this.updateUrl();
        
        // Setup event delegation (synchronous)
        this.setupEventDelegation();
        
        // Initialize rating system (synchronous)
        this.initRatingSystem();
        
        if (this.ratingManager) {
            this.searchManager = new SearchManager(this.ratingManager);
            this.albumMenuManager = new AlbumMenuManager(this.authService, this.ratingManager, this.dataService);

            try {
                await this.waitForElement('.album-menu', TIMEOUTS.ELEMENT_WAIT);
                this.albumMenuManager.initAlbumMenus();
            } catch (err) {
                logger.warn('Timed out waiting for .album-menu elements, attempting to init menus anyway');
                this.albumMenuManager.initAlbumMenus();
            }
        } else {
            logger.error('RatingManager not found for SearchManager');
        }
    }
    
    setupEventDelegation() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            
            const action = target.dataset.action;
            
            switch (action) {
                case 'logout':
                    e.preventDefault();
                    this.logout();
                    break;
                case 'login':
                    e.preventDefault();
                    this.goToLogin();
                    break;
                case 'signup':
                    e.preventDefault();
                    this.goToSignup();
                    break;
                case 'switch-user':
                    e.preventDefault();
                    const userId = parseInt(target.dataset.userId);
                    if (userId) this.switchUser(userId);
                    break;
            }
        });
    }
    
    isCurrentUserAdmin() {
        return this.authService.isAdmin();
    }
    
    initDataServices() {
        this.dataService = new DataService({
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
        
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            setCurrentUserId(currentUser.id);
        } else {
            setCurrentUserId(this.viewingUserId || DEFAULTS.GUEST_USER_ID);
        }
        
        eventBus.on(EVENTS.RATING_UPDATED, async (data) => {
            if (data.shouldReload) {
                await this.refreshData();
            }
            
            if (this.albumMenuManager) {
                this.albumMenuManager.initAlbumMenus();
            }
        });
        
        eventBus.on(EVENTS.RATING_DELETED, async (data) => {
            if (data.shouldReload) {
                await this.refreshData();
            }
        });
    }
    
    async refreshData() {
        try {
            await this.dataService.loadData(true);
            
            if (this.recentlyGrid) this.recentlyGrid.render();
            if (this.listenLaterGrid) this.listenLaterGrid.render();
            
            if (this.albumMenuManager) {
                this.albumMenuManager.initAlbumMenus();
            }
            
            logger.success('Data refreshed successfully without page reload');
        } catch (error) {
            logger.error('Error refreshing data:', error);
            window.location.reload();
        }
    }
    
    async loadData() {
        try {
            await this.dataService.loadData(false);
            
            if (this.recentlyGrid) this.recentlyGrid.render();
            if (this.listenLaterGrid) this.listenLaterGrid.render();

        } catch (error) {
            logger.error('Error loading data:', error);
        }
    }

    async waitForElement(selector, timeout = TIMEOUTS.ELEMENT_WAIT) {
        const start = performance.now();

        const existing = document.querySelector(selector);
        if (existing) return existing;

        return await new Promise((resolve, reject) => {
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    clearTimeout(timer);
                    resolve(el);
                }
            });

            observer.observe(document.documentElement || document.body, {
                childList: true,
                subtree: true
            });

            const timer = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
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
    
    switchUser(userId) {
        if (this.authService.isUserLoggedIn()) return;
        window.location.href = `${ROUTES.HOME}?user=${userId}`;
    }
    
    goToLogin() {
        window.location.href = ROUTES.LOGIN;
    }
    
    goToSignup() {
        window.location.href = ROUTES.SIGNUP;
    }
    
    async logout() {
        await this.authService.logout();
        
        if (this.dataService) {
            this.dataService.clearCache();
        }
        
        eventBus.emit(EVENTS.USER_LOGOUT);
        
        const currentUserId = this.getUserIdFromUrl() || DEFAULTS.USER_ID;
        window.location.href = `${ROUTES.HOME}?user=${currentUserId}`;
    }
    
    async refreshRatings() {
        if (this.albumMenuManager) {
            this.albumMenuManager.initAlbumMenus();
        }
    }
}

// IIFE для изоляции кода
(function() {
    'use strict';
    
    let appInstance = null;

    document.addEventListener('DOMContentLoaded', () => {
        appInstance = new MusicboardApp();

        eventBus.on(EVENTS.USER_SWITCH, (data) => appInstance?.switchUser(data.userId));
        eventBus.on(EVENTS.NAVIGATE, (data) => {
            if (data.route === 'login') appInstance?.goToLogin();
            else if (data.route === 'signup') appInstance?.goToSignup();
        });
    });

    // Минимальное публичное API
    const publicAPI = {
        switchUser: (userId) => eventBus.emit(EVENTS.USER_SWITCH, { userId }),
        goToLogin: () => eventBus.emit(EVENTS.NAVIGATE, { route: 'login' }),
        goToSignup: () => eventBus.emit(EVENTS.NAVIGATE, { route: 'signup' }),
        logout: () => appInstance?.logout(),
        refreshRatings: () => appInstance?.refreshRatings(),
        getRatingManager: () => appInstance?.getRatingManager(),
        getCurrentUser: () => appInstance?.getCurrentUser(),
        isCurrentUserAdmin: () => appInstance?.isCurrentUserAdmin()
    };
    
    // Экспорт только необходимого минимума
    if (typeof window !== 'undefined') {
        // Публичное API
        Object.defineProperty(window, 'musicboardApp', {
            value: Object.freeze(publicAPI),
            writable: false,
            configurable: false
        });
        
        // Debug API только в development
        const isDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === 'ms2';
        
        if (isDev) {
            Object.defineProperty(window, '__musicboardDebug', {
                value: Object.freeze({
                    getAppInstance: () => appInstance,
                    getEventBus: () => eventBus,
                    version: '2.0.0'
                }),
                writable: false,
                configurable: false
            });
        }
    }
})();