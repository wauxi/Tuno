import { CONFIG, UI } from '../../config/constants.js';
import { logger } from '../../shared/utils/Logger.js';
import { showToast } from '../../shared/utils/toast.js';

export class AlbumMenuManager {
    constructor(authService, ratingManager, dataService) {
        this.authService = authService;
        this.ratingManager = ratingManager;
        this.dataService = dataService;
    }
    
    initAlbumMenus() {
        // Only bind delegation once
        if (this._delegated) return;
        this._delegated = true;

        document.addEventListener('click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            const menu = actionBtn.closest('.album-menu');
            if (!menu) return;

            const albumElement = menu.closest('[data-album-id]');
            if (!albumElement) return;

            const albumId = parseInt(albumElement.dataset.albumId);
            const action = actionBtn.dataset.action;

            e.preventDefault();
            e.stopPropagation();

            switch (action) {
                case 'write-review':
                    if (this.authService.isUserLoggedIn()) {
                        this.handleWriteReview(albumId, albumElement);
                    }
                    break;
                case 'remove-listen-later':
                    if (this.authService.isUserLoggedIn() && this.authService.isAdmin()) {
                        this.handleRemoveFromListenLater(albumId, albumElement);
                    }
                    break;
                case 'go-to-album':
                    this.handleGoToAlbum(albumElement);
                    break;
            }
        });

        // Dropdown positioning via event delegation
        document.addEventListener('mouseenter', (e) => {
            const trigger = e.target.closest('.album-menu__trigger');
            if (!trigger) return;
            const menu = trigger.closest('.album-menu');
            if (!menu || menu.classList.contains('album-menu--side')) return;
            this.adjustDropdownPosition(menu.querySelector('.album-menu__dropdown'));
        }, true);
    }

    adjustDropdownPosition(dropdown) {
        if (!dropdown) return;
        requestAnimationFrame(() => {
            const rect = dropdown.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            dropdown.classList.remove('align-left', 'align-right');
            if (rect.left < 10) {
                dropdown.classList.add('align-left');
            } else if (rect.right > windowWidth - 10) {
                dropdown.classList.add('align-right');
            }
        });
    }

    refreshMenuVisibility() {
        // Hide admin/auth-only buttons for non-eligible users
        document.querySelectorAll('.album-menu').forEach(menu => {
            const writeReviewBtn = menu.querySelector('[data-action="write-review"]');
            const removeBtn = menu.querySelector('[data-action="remove-listen-later"]');
            if (writeReviewBtn) {
                writeReviewBtn.style.display = this.authService.isUserLoggedIn() ? '' : 'none';
            }
            if (removeBtn) {
                removeBtn.style.display = (this.authService.isUserLoggedIn() && this.authService.isAdmin()) ? '' : 'none';
            }
        });
    }
    
    async getExistingRating(albumId) {
        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) return null;
            
            const response = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.RATINGS}?album_id=${albumId}&user_id=${currentUser.id}`, {
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.success && result.rating) {
                return result.rating;
            }
            return null;
        } catch (error) {
            logger.error('Error fetching existing rating:', error);
            return null;
        }
    }
    
    async handleWriteReview(albumId, albumElement) {
        const albumData = this.extractAlbumData(albumElement, albumId);
        const existingRating = await this.getExistingRating(albumId);
        
        this.ratingManager.showRatingModalComponent(albumData, existingRating);
    }
    
    async handleRemoveFromListenLater(albumId, albumElement) {
        if (!this.authService.isAdmin()) {
            showToast('You do not have permission to delete albums from the database. Admin rights required.', 'error');
            return;
        }
        
        const albumName = albumElement.querySelector('.listen-later__album, .recently__album, .favs__album')?.textContent || 'this album';
        const artist = albumElement.querySelector('.listen-later__artist, .recently__artist, .favs__artist')?.textContent || '';
        const fullName = artist ? `${artist} - ${albumName}` : albumName;
        
        if (!confirm(`⚠️ WARNING! You are about to delete "${fullName}" from the database permanently!\n\nThis action cannot be undone. Continue?`)) {
            return;
        }
        
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.MAIN}`, {
                method: 'POST',
                credentials: 'include',
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
                albumElement.style.transition = `opacity ${UI.ANIMATION_DURATION}ms ease`;
                albumElement.style.opacity = '0';
                
                await new Promise(resolve => {
                    albumElement.addEventListener('transitionend', resolve, { once: true });
                    setTimeout(resolve, UI.ANIMATION_DURATION + 50);
                });
                
                albumElement.remove();
                showToast('Album successfully deleted from the database', 'success');
                
                if (this.dataService) {
                    window.location.reload();
                }
                
            } else {
                throw new Error(result.error || result.message || 'Error deleting');
            }
            
        } catch (error) {
            if (error.message.includes('authorization') || error.message.includes('401')) {
                showToast('Authorization error. Please log in again.', 'error');
                window.musicboardApp.logout();
            } else if (error.message.includes('Access denied') || error.message.includes('403')) {
                showToast('You do not have permission to perform this action. Admin rights required.', 'error');
            } else {
                showToast('Error deleting: ' + error.message, 'error');
            }
        }
    }
    
    handleGoToAlbum(albumElement) {
        const spotifyLink = albumElement.dataset.spotifyLink || 
                           albumElement.querySelector('[data-spotify-link]')?.dataset.spotifyLink;
        
        if (spotifyLink) {
            window.open(spotifyLink, '_blank');
        } else {
            const albumName = albumElement.querySelector('.recently__album, .listen-later__album, .favs__album')?.textContent;
            const artist = albumElement.querySelector('.recently__artist, .listen-later__artist, .favs__artist')?.textContent;
            
            if (albumName && artist) {
                const searchQuery = encodeURIComponent(`${artist} ${albumName}`);
                window.open(`https://open.spotify.com/search/${searchQuery}`, '_blank');
            } else {
                showToast('Could not find a link to the album on Spotify', 'warning');
            }
        }
    }
    
    extractAlbumData(element, albumId) {
        const titleElement = element.querySelector('.recently__album, .listen-later__album, .favs__album');
        const artistElement = element.querySelector('.recently__artist, .listen-later__artist, .favs__artist');
        const coverElement = element.querySelector('img');
        
        return {
            id: albumId,
            album_name: titleElement ? titleElement.textContent.trim() : 'Unknown Album',
            artist: artistElement ? artistElement.textContent.trim() : 'Unknown Artist',
            coverUrl: coverElement ? coverElement.src : CONFIG.DEFAULTS.COVER_PLACEHOLDER
        };
    }
}
