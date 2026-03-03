import { RatingUtils } from './RatingUtils.js';
import { CONFIG, UI } from '../../config/constants.js';
import { eventBus, EVENTS } from '../../shared/utils/EventBus.js';
import { getCurrentUserId, isUserLoggedIn } from '../auth/authUtils.js';
import { logger } from '../../shared/utils/Logger.js';
import { showToast } from '../../shared/utils/toast.js';

export class RatingManager {
    constructor() {
        this.apiUrl = `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.RATINGS}`;
    }

    get currentUserId() {
        return getCurrentUserId();
    }

    async addRating(albumId, ratingData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    album_id: albumId,
                    user_id: this.currentUserId,
                    ...ratingData
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            return result;
        } catch (error) {
            logger.error('Error adding rating:', error);
            throw error;
        }
    }

    async updateRating(ratingId, ratingData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating_id: ratingId,
                    ...ratingData
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            return result;
        } catch (error) {
            logger.error('Error updating rating:', error);
            throw error;
        }
    }

    async deleteRating(ratingId) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rating_id: ratingId
                })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            return result;
        } catch (error) {
            logger.error('Error deleting rating:', error);
            throw error;
        }
    }

    async getRating(albumId, userId = null) {
        try {
            const userIdParam = userId || this.currentUserId;
            const response = await fetch(`${this.apiUrl}?album_id=${albumId}&user_id=${userIdParam}`, {
                credentials: 'include'
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            logger.error('Error getting rating:', error);
            throw error;
        }
    }

    isUserLoggedIn() {
        return isUserLoggedIn();
    }

    generateStarRating(currentRating) {
        return RatingUtils.generateStarRating(currentRating, false);
    }

    generateInteractiveStarRating(currentRating) {
        return RatingUtils.generateInteractiveStarRating(currentRating);
    }

    async showRatingModalComponent(albumData, existingRating) {
        const modal = document.createElement('rating-modal');

        modal.setAttribute('album-id', albumData.id);
        modal.setAttribute('album-name', albumData.album_name);
        modal.setAttribute('artist', albumData.artist);
        modal.setAttribute('cover-url', albumData.coverUrl || '');

        modal.addEventListener('save', async (e) => {
            const { ratingData, existingRating: existing } = e.detail;
            await this.handleSave(ratingData, existing || existingRating);
        });

        modal.addEventListener('delete', async (e) => {
            await this.handleDelete(existingRating);
        });

        document.body.appendChild(modal);
        if (existingRating) {
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => requestAnimationFrame(resolve));
            try {
                if (typeof modal.setRating === 'function') {
                    modal.setRating(existingRating);
                }
            } catch (err) {
                logger.warn('Failed to set rating on modal:', err);
            }
        }
    }


    async handleSave(ratingData, existingRating) {
        try {
            if (existingRating?.id) {
                await this.updateRating(existingRating.id, ratingData);
            } else {
                await this.addRating(ratingData.album_id, ratingData);
            }
            
            // Emit event with data for reactive update
            eventBus.emit(EVENTS.RATING_UPDATED, { 
                ratingData, 
                existingRating,
                shouldReload: true 
            });
            
        } catch (error) {
            logger.error('Error saving rating:', error);
            showToast('Error saving rating: ' + error.message, 'error');
        }
    }

    async handleDelete(existingRating) {
        if (!existingRating?.id) return;
        
        try {
            await this.deleteRating(existingRating.id);
            
            // Emit event for reactive update
            eventBus.emit(EVENTS.RATING_DELETED, { 
                ratingId: existingRating.id,
                albumId: existingRating.album_id,
                shouldReload: true 
            });
            
        } catch (error) {
            logger.error('Error deleting rating:', error);
            showToast('Error deleting rating: ' + error.message, 'error');
        }
    }
}




