import { CONFIG, UI, IMAGES, BREAKPOINTS } from '../../config/constants.js';
import { getCurrentUserId } from '../auth/authUtils.js';
import { escapeHtml } from '../../shared/utils/sanitize.js';
import { showToast } from '../../shared/utils/toast.js';

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
        this.isMobile = window.innerWidth <= BREAKPOINTS.MOBILE;
        
        this.init();
        this.setupResizeListener();
    }
    
    setupResizeListener() {
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= BREAKPOINTS.MOBILE;
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
        
        // Open modal on search button click on mobile
        this.searchContainer.addEventListener('click', (e) => {
            if (this.isMobile && !e.target.closest('.navigation__search-input')) {
                this.openModal();
            }
        });
        
        // Close modal
        closeBtn?.addEventListener('click', () => this.closeModal());
        overlay?.addEventListener('click', () => this.closeModal());
        
        // Search in modal
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
        
        // Close on ESC
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
            
            // Focus on input field
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
            
            // Clear
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
            const data = await this._fetchSearch(query);
            if (data.success) {
                this._renderResults(this.searchModalResults, data.albums, query, (result) => {
                    this.handleRateAlbum(result);
                    this.closeModal();
                });
            } else {
                this._renderError(this.searchModalResults, 'Search error: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            this._renderError(this.searchModalResults, 'Connection error');
        }
    }
    
    async performSearch(query) {
        try {
            const data = await this._fetchSearch(query);
            if (data.success) {
                this._renderResults(this.searchResults, data.albums, query, (result) => {
                    this.handleRateAlbum(result);
                });
            } else {
                this._renderError(this.searchResults, 'Search error: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            this._renderError(this.searchResults, 'Connection error');
        }
        this.showResults();
    }
    
    async _fetchSearch(query) {
        const url = `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.MAIN}?action=search&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }
    
    _renderResults(container, albums, query, onItemClick) {
        if (albums.length === 0) {
            container.innerHTML = `
                <div class="search-results__empty">
                    <span class="search-results__icon">🔍</span>
                    <p>No results found for "${escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }
        
        const resultsHtml = albums.map(album => this.getAlbumResultTemplate(album)).join('');
        container.innerHTML = `
            <div class="search-results__header">
                Search results (${albums.length})
            </div>
            <div class="search-results__list">
                ${resultsHtml}
            </div>
        `;
        
        container.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => onItemClick(result));
        });
    }
    
    _renderError(container, message) {
        container.innerHTML = `
            <div class="search-results__error">
                <span class="search-results__icon">⚠️</span>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
    
    getAlbumResultTemplate(album) {
        const albumJson = JSON.stringify(album).replace(/"/g, '&quot;');
        const name = escapeHtml(album.album_name);
        const artist = escapeHtml(album.artist);
        const genre = escapeHtml(album.genre);
        
        return `
            <div class="search-result" data-album-id="${album.album_id}" data-album="${albumJson}">
                <img src="${album.coverUrl}" 
                     alt="${name}" 
                     class="search-result__cover"
                     onerror="this.src='${IMAGES.PLACEHOLDER}'">
                <div class="search-result__info">
                    <h4 class="search-result__album">${name}</h4>
                    <p class="search-result__artist">${artist}</p>
                    ${album.genre ? `<span class="search-result__genre">${genre}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    async handleRateAlbum(resultElement) {
        try {
            const albumData = JSON.parse(resultElement.dataset.album.replace(/&quot;/g, '"'));
            
            const currentUserId = getCurrentUserId();
            let existingRating = null;
            
            try {
                const ratingResponse = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.RATINGS}?album_id=${albumData.album_id}&user_id=${currentUserId}`, {
                    credentials: 'include'
                });
                const ratingData = await ratingResponse.json();
                existingRating = ratingData.success ? ratingData.rating : null;
            } catch (error) {
                // No existing rating
            }
            
            this.ratingManager.showRatingModalComponent({
                id: albumData.album_id,
                album_name: albumData.album_name,
                artist: albumData.artist,
                genre: albumData.genre,
                spotify_link: albumData.spotify_link,
                coverUrl: albumData.coverUrl
            }, existingRating);
            
            this.hideResults();
            this.clearSearch();
            
        } catch (error) {
            showToast('Error opening rating form', 'error');
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
    
    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
    }
}