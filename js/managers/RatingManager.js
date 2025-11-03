import { RatingUtils } from '../utils/RatingUtils.js';
import { UI } from '../config/constants.js';
import { eventBus, EVENTS } from '../utils/EventBus.js';
import { getCurrentUserId, isUserLoggedIn } from '../utils/authUtils.js';

export class RatingManager {
    constructor() {
        this.apiUrl = 'php/ratings-api.php';
        this.currentUserId = getCurrentUserId();
    }

    async addRating(albumId, ratingData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
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
            console.error('Ошибка добавления оценки:', error);
            throw error;
        }
    }

    async updateRating(ratingId, ratingData) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'PUT',
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
            console.error('Ошибка обновления оценки:', error);
            throw error;
        }
    }

    async deleteRating(ratingId) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'DELETE',
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
            console.error('Ошибка удаления оценки:', error);
            throw error;
        }
    }

    async getRating(albumId, userId = null) {
        try {
            const userIdParam = userId || this.currentUserId;
            const response = await fetch(`${this.apiUrl}?album_id=${albumId}&user_id=${userIdParam}`);
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Ошибка получения оценки:', error);
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
                console.warn('Failed to set rating on modal:', err);
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
            
            // Испустить событие с данными для реактивного обновления
            eventBus.emit(EVENTS.RATING_UPDATED, { 
                ratingData, 
                existingRating,
                shouldReload: true 
            });
            
        } catch (error) {
            console.error('Error saving rating:', error);
            alert('Error saving rating: ' + error.message);
        }
    }

    async handleDelete(existingRating) {
        if (!existingRating?.id) return;
        
        try {
            await this.deleteRating(existingRating.id);
            
            // Испустить событие для реактивного обновления
            eventBus.emit(EVENTS.RATING_DELETED, { 
                ratingId: existingRating.id,
                albumId: existingRating.album_id,
                shouldReload: true 
            });
            
        } catch (error) {
            console.error('Error deleting rating:', error);
            alert('Error deleting rating: ' + error.message);
        }
    }
}




