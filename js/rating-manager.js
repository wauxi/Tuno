export class RatingManager {
    constructor() {
        this.apiUrl = 'php/ratings-api.php';
        this.currentUserId = this.getCurrentUserId();
    }

    getCurrentUserId() {
        return localStorage.getItem('currentUserId') || 1;
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

    showRatingModal(albumData, existingRating = null) {
        if (!this.isUserLoggedIn()) {
            alert('Пожалуйста, войдите в систему для написания отзывов');
            window.location.href = 'login.html';
            return;
        }
        
        const modal = this.createRatingModal(albumData, existingRating);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    isUserLoggedIn() {
        const currentUser = localStorage.getItem('currentUser');
        return currentUser && currentUser !== 'null';
    }

    createRatingModal(albumData, existingRating) {
        const isEdit = existingRating !== null;
        const rating = existingRating || {};

        const modalHtml = `
            <div class="rating-modal" id="ratingModal">
                <div class="rating-modal__overlay"></div>
                <div class="rating-modal__content">
                    <div class="rating-modal__header">
                        <h3 class="rating-modal-h3">${isEdit ? 'Edit Review' : 'Review'}</h3>
                        <div class="rating-modal__close">
                            <button class="rating-modal__close-cross" type="button">×</button>
                        </div>
                    </div>
                    
                    <div class="rating-modal__body">
                        <div class="rating-modal__left">
                            <div class="album-info__cover">
                                <img src="${albumData.coverUrl || 'img/default-cover.png'}" alt="${albumData.album_name}">
                            </div>
                            <div class="album-info__details">
                                <h4>${albumData.album_name}</h4>
                                <p>${albumData.artist} • Album</p>
                            </div>
                        </div>
                        
                        <div class="rating-modal__right">
                            <form class="rating-form" id="ratingForm">
                                <!-- Основная строка: Rating, Checkboxes, Date -->
                                <div class="rating-row">
                                    <div class="rating-group">
                                        <label>Rating</label>
                                        <div class="rating-selector">
                                            ${this.generateInteractiveStarRating(rating.rating || 0)}
                                        </div>
                                        <input type="hidden" name="rating" value="${rating.rating || 0}">
                                    </div>

                                    <div class="checkbox-group">
                                        <div class="checkbox-section">
                                            <h4>Must listen</h4>
                                            <div class="checkbox-item">
                                                <input type="checkbox" id="mustListen" name="must_listen" ${rating.must_listen == 1 ? 'checked' : ''}>
                                                <label for="mustListen">Все должны это послушать</label>
                                            </div>
                                        </div>
                                        <div class="checkbox-section">
                                            <h4>Would re-listen</h4>
                                            <div class="checkbox-item">
                                                <input type="checkbox" id="wouldRelisten" name="would_relisten" ${rating.would_relisten == 1 ? 'checked' : ''}>
                                                <label for="wouldRelisten">Переслушал бы</label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="date-group">
                                        <label for="listenedAt">Listened at</label>
                                        <input type="date" id="listenedAt" name="listened_date" 
                                            value="${rating.listened_date || ''}">
                                    </div>
                                </div>

                                <!-- Поля ввода -->
                                <div class="input-group">
                                    <label for="favoriteSong">Favorite Song</label>
                                    <input type="text" id="favoriteSong" name="favorite_song" 
                                        value="${rating.favorite_song || ''}" placeholder="Song title">
                                </div>

                                <div class="input-group">
                                    <label for="leastFavoriteSong">Least Favorite Song</label>
                                    <input type="text" id="leastFavoriteSong" name="least_favorite_song" 
                                        value="${rating.least_favorite_song || ''}" placeholder="Song title">
                                </div>

                                <div class="input-group">
                                    <label for="review">Review</label>
                                    <textarea id="review" name="review" rows="4" 
                                            placeholder="Add a review...">${rating.review || ''}</textarea>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="rating-modal__footer">
                        ${isEdit ? '<button type="button" class="btn btn--danger" id="deleteRatingBtn">Delete</button>' : ''}
                        <button type="button" class="btn btn--primary" id="saveRatingBtn">
                            ${isEdit ? 'Update Album' : 'Log Album'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modalElement = document.createElement('div');
        modalElement.innerHTML = modalHtml;
        const modal = modalElement.firstElementChild;

        if (!modal) {
            console.error('Ошибка создания модального окна');
            return null;
        }

        this.attachModalEvents(modal, albumData, existingRating);
        return modal;
    }


    generateStarRating(currentRating) {
        const fiveStarRating = Math.round(currentRating / 2);
        
        if (fiveStarRating === 0) {
            return '<span class="no-rating">Нет оценки</span>';
        }

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= fiveStarRating) {
                starsHtml += `<span class="star star--full">★</span>`;
            } else {
                starsHtml += `<span class="star star--empty">★</span>`;
            }
        }
        return starsHtml;
    }


    generateInteractiveStarRating(currentRating) {
        const fiveStarRating = currentRating ? currentRating / 2 : 0;
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(fiveStarRating)) {
                starsHtml += `<span class="rating-star rating-star--selected" data-value="${i}">★</span>`;
            } else if (i <= fiveStarRating + 0.5) {
                starsHtml += `<span class="rating-star rating-star--half" data-value="${i}">★</span>`;
            } else {
                starsHtml += `<span class="rating-star rating-star--unselected" data-value="${i}">★</span>`;
            }
        }
        return starsHtml;
    }

    attachModalEvents(modal, albumData, existingRating) {
        const isEdit = existingRating !== null;

        const closeBtn = modal.querySelector('.rating-modal__close-cross');
        const overlay = modal.querySelector('.rating-modal__overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }
        
        if (overlay) {
            overlay.addEventListener('click', () => this.closeModal(modal));
        }

        const stars = modal.querySelectorAll('.rating-star');
        const ratingInput = modal.querySelector('input[name="rating"]');

        if (stars.length > 0 && ratingInput) {
            stars.forEach(star => {
                star.addEventListener('click', (e) => {
                    const fiveStarRating = parseInt(e.target.dataset.value);
                    const rect = e.target.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const starWidth = rect.width;
                    const isHalfStar = clickX < starWidth / 2;
                    
                    let finalRating;
                    if (isHalfStar && fiveStarRating > 1) {
                        finalRating = (fiveStarRating - 0.5) * 2;
                    } else {
                        finalRating = fiveStarRating * 2;
                    }
                    
                    this.setInteractiveStarRating(stars, finalRating / 2);
                    ratingInput.value = finalRating;
                    
                    console.log(`Выбрана оценка: ${finalRating / 2} звезд (${finalRating}/10)`);
                });

                star.addEventListener('mouseover', (e) => {
                    const fiveStarRating = parseInt(e.target.dataset.value);
                    const rect = e.target.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const starWidth = rect.width;
                    const isHalfHover = mouseX < starWidth / 2;
                    
                    const hoverRating = isHalfHover ? fiveStarRating - 0.5 : fiveStarRating;
                    this.highlightInteractiveStars(stars, hoverRating);
                });
            });

            const starContainer = modal.querySelector('.rating-selector');
            if (starContainer) {
                starContainer.addEventListener('mouseleave', () => {
                    const currentTenStarRating = parseInt(ratingInput.value);
                    const currentFiveStarRating = currentTenStarRating / 2;
                    this.setInteractiveStarRating(stars, currentFiveStarRating);
                });
            }
        }

        const saveBtn = modal.querySelector('#saveRatingBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                await this.handleSaveRating(modal, albumData, existingRating);
            });
        } else {
            console.error('Кнопка сохранения не найдена');
        }

        if (isEdit) {
            const deleteBtn = modal.querySelector('#deleteRatingBtn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    await this.handleDeleteRating(modal, existingRating.id);
                });
            }
        }

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    setInteractiveStarRating(stars, fiveStarRating) {
        stars.forEach((star, index) => {
            star.classList.remove('rating-star--selected', 'rating-star--half', 'rating-star--unselected');
            
            if (index + 1 <= Math.floor(fiveStarRating)) {
                star.classList.add('rating-star--selected');
            } else if (index + 1 <= fiveStarRating + 0.5) {
                star.classList.add('rating-star--half');
            } else {
                star.classList.add('rating-star--unselected');
            }
        });
    }

    highlightInteractiveStars(stars, fiveStarRating) {
        stars.forEach(star => {
            star.classList.remove('rating-star--hover-full', 'rating-star--hover-half');
        });

        stars.forEach((star, index) => {
            if (index + 1 <= Math.floor(fiveStarRating)) {
                star.classList.add('rating-star--hover-full');
            } else if (index + 1 <= fiveStarRating + 0.5) {
                star.classList.add('rating-star--hover-half');
            }
        });
    }

    async handleSaveRating(modal, albumData, existingRating) {
        const form = modal.querySelector('#ratingForm');
        const formData = new FormData(form);
        
        const ratingData = {
            rating: parseInt(formData.get('rating')),
            favorite_song: formData.get('favorite_song'),
            least_favorite_song: formData.get('least_favorite_song'),
            must_listen: formData.has('must_listen') ? 1 : 0,
            would_relisten: formData.has('would_relisten') ? 1 : 0,
            listened_date: formData.get('listened_date') || null,
            review: formData.get('review')
        };

        try {
            const saveBtn = modal.querySelector('#saveRatingBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = existingRating ? 'Updating...' : 'Saving...';

            if (existingRating) {
                await this.updateRating(existingRating.id, ratingData);
            } else {
                await this.addRating(albumData.id, ratingData);
            }

            this.closeModal(modal);
            this.showSuccessMessage(existingRating ? 'Rating updated' : 'Rating added');
            
            this.refreshAlbumGrid();

        } catch (error) {
            this.showErrorMessage(error.message);
            saveBtn.disabled = false;
            saveBtn.textContent = existingRating ? 'Update' : 'Save';
        }
    }

    async handleDeleteRating(modal, ratingId) {
        if (!confirm('Are you sure you want to delete this rating?')) {
            return;
        }

        try {
            const deleteBtn = modal.querySelector('#deleteRatingBtn');
            deleteBtn.disabled = true;
            deleteBtn.textContent = 'Deleting...';

            await this.deleteRating(ratingId);
            
            this.closeModal(modal);
            this.showSuccessMessage('Rating deleted');
            this.refreshAlbumGrid();

        } catch (error) {
            this.showErrorMessage(error.message);
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Delete';
        }
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    showSuccessMessage(message) {
        alert(message); 
    }

    showErrorMessage(message) {
        alert('Error: ' + message);
    }


    refreshAlbumGrid() {
        window.dispatchEvent(new CustomEvent('ratingsUpdated'));
    }
}