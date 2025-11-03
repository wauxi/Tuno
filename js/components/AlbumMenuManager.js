import { UI } from '../config/constants.js';
import { logger } from '../utils/Logger.js';

export class AlbumMenuManager {
    constructor(authService, ratingManager, dataService) {
        this.authService = authService;
        this.ratingManager = ratingManager;
        this.dataService = dataService;
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
        const dropdown = menu.querySelector('.album-menu__dropdown');

        if (dropdown) {
            const trigger = menu.querySelector('.album-menu__trigger');
            const isSideMenu = menu.classList.contains('album-menu--side');
            
            const adjustDropdownPosition = () => {
                if (isSideMenu) return;
                
                requestAnimationFrame(() => {
                    const rect = dropdown.getBoundingClientRect();
                    const windowWidth = window.innerWidth;
                    const padding = 10;
                    
                    dropdown.classList.remove('align-left', 'align-right');
                    
                    if (rect.left < padding) {
                        dropdown.classList.add('align-left');
                    } else if (rect.right > windowWidth - padding) {
                        dropdown.classList.add('align-right');
                    }
                });
            };

            if (trigger) {
                trigger.addEventListener('mouseenter', adjustDropdownPosition);
                trigger.addEventListener('focus', adjustDropdownPosition);
                trigger.addEventListener('click', adjustDropdownPosition);
            }
            menu.addEventListener('mouseenter', adjustDropdownPosition);
            dropdown.addEventListener('transitionend', adjustDropdownPosition);
        }

        const writeReviewBtn = menu.querySelector('[data-action="write-review"]');
        const removeBtn = menu.querySelector('[data-action="remove-listen-later"]');
        const spotifyBtn = menu.querySelector('[data-action="go-to-album"]');
        
        if (writeReviewBtn) {
            if (!this.authService.isUserLoggedIn()) {
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
            if (!this.authService.isUserLoggedIn() || !this.authService.isAdmin()) {
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
    
    async getExistingRating(albumId) {
        try {
            const currentUser = this.authService.getCurrentUser();
            if (!currentUser) return null;
            
            const response = await fetch(`php/ratings-api.php?album_id=${albumId}&user_id=${currentUser.id}`);
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
                albumElement.style.transition = `opacity ${UI.ANIMATION_DURATION}ms ease`;
                albumElement.style.opacity = '0';
                
                await new Promise(resolve => {
                    albumElement.addEventListener('transitionend', resolve, { once: true });
                    setTimeout(resolve, UI.ANIMATION_DURATION + 50);
                });
                
                albumElement.remove();
                alert('Альбом успешно удален из базы данных');
                
                if (this.dataService) {
                    window.location.reload();
                }
                
            } else {
                throw new Error(result.error || result.message || 'Ошибка при удалении');
            }
            
        } catch (error) {
            if (error.message.includes('авторизации') || error.message.includes('401')) {
                alert('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
                window.musicboardApp.logout();
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
        
        return {
            id: albumId,
            album_name: titleElement ? titleElement.textContent.trim() : 'Неизвестный альбом',
            artist: artistElement ? artistElement.textContent.trim() : 'Неизвестный исполнитель',
            coverUrl: coverElement ? coverElement.src : 'img/default-cover.png'
        };
    }
}
