import { CONFIG, UI, IMAGES } from '../config/constants.js';
import { getCurrentUserId } from '../utils/authUtils.js';

export class SearchManager {
    constructor(ratingManager) {
        this.ratingManager = ratingManager;
        this.searchInput = null;
        this.searchContainer = null;
        this.searchResults = null;
        this.searchTimeout = null;
        this.searchModal = null;
        this.searchModalInput = null;
        this.searchModalResults = null;
        this.isMobile = window.innerWidth <= 580;
        
        this.init();
        this.setupResizeListener();
    }
    
    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 580;
        });
    }
    
    init() {
        this.searchInput = document.querySelector('.navigation__search-input');
        this.searchContainer = document.querySelector('.navigation__search');
        this.searchModal = document.querySelector('.search-modal');
        this.searchModalInput = document.querySelector('.search-modal__input');
        this.searchModalResults = document.querySelector('.search-modal__results');
        
        if (this.searchInput && this.searchContainer) {
            this.createSearchResults();
            this.bindEvents();
        }
        
        if (this.searchModal) {
            this.bindModalEvents();
        }
    }
    
    bindModalEvents() {
        const closeBtn = this.searchModal.querySelector('.search-modal__close');
        const overlay = this.searchModal.querySelector('.search-modal__overlay');
        
        // Открытие модалки при клике на кнопку поиска на мобильных
        this.searchContainer.addEventListener('click', (e) => {
            if (this.isMobile && !e.target.closest('.navigation__search-input')) {
                this.openModal();
            }
        });
        
        // Закрытие модалки
        closeBtn?.addEventListener('click', () => this.closeModal());
        overlay?.addEventListener('click', () => this.closeModal());
        
        // Поиск в модалке
        this.searchModalInput?.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            if (query.length < 2) {
                this.searchModalResults.innerHTML = '';
                return;
            }
            
            this.searchTimeout = setTimeout(() => {
                this.performModalSearch(query);
            }, UI.SEARCH_DEBOUNCE);
        });
        
        // Закрытие по ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchModal?.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    openModal() {
        if (this.searchModal) {
            this.searchModal.classList.add('active');
            this.searchModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Фокус на поле ввода
            setTimeout(() => {
                this.searchModalInput?.focus();
            }, 100);
        }
    }
    
    closeModal() {
        if (this.searchModal) {
            this.searchModal.classList.remove('active');
            this.searchModal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Очистка
            if (this.searchModalInput) {
                this.searchModalInput.value = '';
            }
            if (this.searchModalResults) {
                this.searchModalResults.innerHTML = '';
            }
        }
    }
    
    createSearchResults() {
        this.searchResults = document.createElement('div');
        this.searchResults.className = 'search-results';
        this.searchResults.style.display = 'none';
        
        this.searchContainer.appendChild(this.searchResults);
    }
    
    bindEvents() {
        this.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            if (query.length < 2) {
                this.hideResults();
                return;
            }
            
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, UI.SEARCH_DEBOUNCE);
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.navigation__search')) {
                this.hideResults();
            }
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim().length >= 2) {
                this.showResults();
            }
        });
    }
    
    async performModalSearch(query) {
        try {
            const url = `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.MAIN}?action=search&q=${encodeURIComponent(query)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.displayModalResults(data.albums, query);
            } else {
                this.showModalError('Ошибка поиска: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            this.showModalError('Ошибка соединения');
        }
    }
    
    displayModalResults(albums, query) {
        if (albums.length === 0) {
            this.searchModalResults.innerHTML = `
                <div class="search-results__empty">
                    <span class="search-results__icon">🔍</span>
                    <p>Ничего не найдено для "${query}"</p>
                </div>
            `;
        } else {
            const resultsHtml = albums.map(album => this.getAlbumResultTemplate(album)).join('');
            this.searchModalResults.innerHTML = `
                <div class="search-results__header">
                    Результаты поиска (${albums.length})
                </div>
                <div class="search-results__list">
                    ${resultsHtml}
                </div>
            `;
            
            this.bindModalResultEvents();
        }
    }
    
    bindModalResultEvents() {
        const results = this.searchModalResults.querySelectorAll('.search-result');
        
        results.forEach(result => {
            result.addEventListener('click', () => {
                this.handleRateAlbum(result);
                this.closeModal();
            });
        });
    }
    
    showModalError(message) {
        if (this.searchModalResults) {
            this.searchModalResults.innerHTML = `
                <div class="search-results__error">
                    <span class="search-results__icon">⚠️</span>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    async performSearch(query) {
        try {
            const url = `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.MAIN}?action=search&q=${encodeURIComponent(query)}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.displayResults(data.albums, query);
            } else {
                this.showError('Ошибка поиска: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            this.showError('Ошибка соединения');
        }
    }
    
    displayResults(albums, query) {
        if (albums.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-results__empty">
                    <span class="search-results__icon">🔍</span>
                    <p>Ничего не найдено для "${query}"</p>
                </div>
            `;
        } else {
            const resultsHtml = albums.map(album => this.getAlbumResultTemplate(album)).join('');
            this.searchResults.innerHTML = `
                <div class="search-results__header">
                    Результаты поиска (${albums.length})
                </div>
                <div class="search-results__list">
                    ${resultsHtml}
                </div>
            `;
            
            this.bindResultEvents();
        }
        
        this.showResults();
    }
    
    getAlbumResultTemplate(album) {
        const albumJson = JSON.stringify(album).replace(/"/g, '&quot;');
        
        return `
            <div class="search-result" data-album-id="${album.id}" data-album="${albumJson}">
                <img src="${album.coverUrl}" 
                     alt="${album.album_name}" 
                     class="search-result__cover"
                     onerror="this.src='${IMAGES.PLACEHOLDER}'">
                <div class="search-result__info">
                    <h4 class="search-result__album">${album.album_name}</h4>
                    <p class="search-result__artist">${album.artist}</p>
                    ${album.genre ? `<span class="search-result__genre">${album.genre}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    bindResultEvents() {
        const results = this.searchResults.querySelectorAll('.search-result');
        
        results.forEach(result => {
            result.addEventListener('click', () => {
                this.handleRateAlbum(result);
            });
        });
    }
    
    async handleRateAlbum(resultElement) {
        try {
            const albumData = JSON.parse(resultElement.dataset.album.replace(/&quot;/g, '"'));
            
            const currentUserId = getCurrentUserId();
            let existingRating = null;
            
            try {
                const ratingResponse = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.RATINGS}?album_id=${albumData.id}&user_id=${currentUserId}`);
                const ratingData = await ratingResponse.json();
                existingRating = ratingData.success ? ratingData.rating : null;
            } catch (error) {
                // Нет существующей оценки
            }
            
            this.ratingManager.showRatingModalComponent({
                id: albumData.id,
                album_name: albumData.album_name,
                artist: albumData.artist,
                genre: albumData.genre,
                spotify_link: albumData.spotify_link,
                coverUrl: albumData.coverUrl
            }, existingRating);
            
            this.hideResults();
            this.clearSearch();
            
        } catch (error) {
            alert('Ошибка при открытии формы оценки');
        }
    }
    
    showResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'block';
        }
    }
    
    hideResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
    
    showError(message) {
        if (this.searchResults) {
            this.searchResults.innerHTML = `
                <div class="search-results__error">
                    <span class="search-results__icon">⚠️</span>
                    <p>${message}</p>
                </div>
            `;
            this.showResults();
        }
    }
    
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
    }
}