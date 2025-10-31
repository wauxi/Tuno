import { IMAGES } from '../config/constants.js';

export class RatingModal extends HTMLElement {
    constructor() {
        super();
        this.existingRating = null;
        this.currentRating = 0;
    }
    
    static get observedAttributes() {
        return ['album-id', 'album-name', 'artist', 'cover-url'];
    }
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
        
        requestAnimationFrame(() => {
            const modal = this.querySelector('.rating-modal');
            if (modal) {
                modal.classList.add('show');
            }
        });
    }
    
    disconnectedCallback() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (this.querySelector('.rating-modal')) {
            this.updateAlbumInfo();
        }
    }
    
    render() {
        const albumName = this.getAttribute('album-name') || 'Unknown Album';
        const artist = this.getAttribute('artist') || 'Unknown Artist';
        const coverUrl = this.getAttribute('cover-url') || IMAGES.FALLBACK;
        
        this.innerHTML = `
            <div class="rating-modal">
                <div class="rating-modal__overlay"></div>
                <div class="rating-modal__content">
                    <div class="rating-modal__header">
                        <h3>Rate Album</h3>
                        <div class="rating-modal__close">
                            <button class="rating-modal__close-cross" type="button">×</button>
                        </div>
                    </div>
                    
                    <div class="rating-modal__body">
                        <div class="rating-modal__left">
                            <div class="album-info__cover">
                                <img src="${coverUrl}" alt="${albumName}">
                            </div>
                            <div class="album-info__details">
                                <h4>${albumName}</h4>
                                <p>${artist} • Album</p>
                            </div>
                        </div>
                        
                        <div class="rating-modal__right">
                            <form class="rating-form">
                                <div class="rating-row">
                                    <div class="rating-group">
                                        <label>Rating</label>
                                        <div class="rating-selector">
                                            ${this.generateStars()}
                                        </div>
                                        <input type="hidden" name="rating" value="0">
                                    </div>

                                    <div class="checkbox-group">
                                        <div class="checkbox-section">
                                            <h4>Must listen</h4>
                                            <label class="checkbox-item">
                                                <input type="checkbox" id="mustListen" name="must_listen">
                                                <span>Все должны это послушать</span>
                                            </label>
                                        </div>
                                        <div class="checkbox-section">
                                            <h4>Would re-listen</h4>
                                            <label class="checkbox-item">
                                                <input type="checkbox" id="wouldRelisten" name="would_relisten">
                                                <span>Переслушал бы</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="date-group">
                                        <label for="listenedAt">Listened at</label>
                                        <input type="date" id="listenedAt" name="listened_date" value="${this.getTodayDate()}">
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label for="favoriteSong">Favorite Song</label>
                                    <input type="text" id="favoriteSong" name="favorite_song" placeholder="Song title">
                                </div>

                                <div class="input-group">
                                    <label for="leastFavoriteSong">Least Favorite Song</label>
                                    <input type="text" id="leastFavoriteSong" name="least_favorite_song" placeholder="Song title">
                                </div>

                                <div class="input-group">
                                    <label for="review">Review</label>
                                    <textarea id="review" name="review" rows="4" placeholder="Add a review..."></textarea>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div class="rating-modal__footer">
                        <button type="button" class="btn btn--danger delete-btn" style="display:none;">Delete</button>
                        <button type="button" class="btn btn--primary save-btn">Log Album</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    generateStars() {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star" data-rating="${i}">★</span>`;
        }
        return html;
    }
    
    attachEventListeners() {
        const overlay = this.querySelector('.rating-modal__overlay');
        overlay.addEventListener('click', () => this.close());
        
        const closeBtn = this.querySelector('.rating-modal__close-cross');
        closeBtn.addEventListener('click', () => this.close());
        
        const stars = this.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => this.handleStarClick(e));
            star.addEventListener('mousemove', (e) => this.handleStarHover(e));
        });
        
        const starsContainer = this.querySelector('.rating-selector');
        starsContainer.addEventListener('mouseleave', () => this.resetStars());
        
        const saveBtn = this.querySelector('.save-btn');
        saveBtn.addEventListener('click', () => this.save());
        
        const deleteBtn = this.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.delete());
        
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this.escapeHandler);
    }
    
    handleStarClick(e) {
        const starElement = e.target;
        const fullRating = parseInt(starElement.dataset.rating);
        const rect = starElement.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starWidth = rect.width;
        const isLeftHalf = clickX < starWidth / 2;
        
        this.currentRating = isLeftHalf ? fullRating - 0.5 : fullRating;
        this.updateStars(this.currentRating);
        
        const input = this.querySelector('input[name="rating"]');
        input.value = this.currentRating * 2;
    }
    
    handleStarHover(e) {
        const starElement = e.target;
        const fullRating = parseInt(starElement.dataset.rating);
        const rect = starElement.getBoundingClientRect();
        const hoverX = e.clientX - rect.left;
        const starWidth = rect.width;
        const isLeftHalf = hoverX < starWidth / 2;
        
        const rating = isLeftHalf ? fullRating - 0.5 : fullRating;
        this.updateStars(rating);
    }
    
    resetStars() {
        this.updateStars(this.currentRating);
    }
    
    updateStars(rating) {
        const stars = this.querySelectorAll('.star');
        const fullStars = Math.floor(rating);
        const hasHalf = rating % 1 !== 0;
        
        stars.forEach((star, index) => {
            star.classList.remove('filled', 'half');
            
            if (index < fullStars) {
                star.classList.add('filled');
            } else if (index === fullStars && hasHalf) {
                star.classList.add('half');
            }
        });
    }
    
    updateAlbumInfo() {
        const albumName = this.getAttribute('album-name');
        const artist = this.getAttribute('artist');
        const coverUrl = this.getAttribute('cover-url');
        
        const nameEl = this.querySelector('.album-info__details h4');
        const artistEl = this.querySelector('.album-info__details p');
        const coverEl = this.querySelector('.album-info__cover img');
        
        if (nameEl) nameEl.textContent = albumName;
        if (artistEl) artistEl.textContent = `${artist} • Album`;
        if (coverEl) coverEl.src = coverUrl;
    }
    
    getFormData() {
        const form = this.querySelector('.rating-form');
        const formData = new FormData(form);
        
        return {
            album_id: parseInt(this.getAttribute('album-id')),
            rating: parseInt(formData.get('rating')) || 0,
            must_listen: formData.get('must_listen') === 'on' ? 1 : 0,
            would_relisten: formData.get('would_relisten') === 'on' ? 1 : 0,
            listened_date: formData.get('listened_date') || null,
            favorite_song: formData.get('favorite_song') || null,
            least_favorite_song: formData.get('least_favorite_song') || null,
            review: formData.get('review') || null
        };
    }
    
    save() {
        const data = this.getFormData();
        
        if (data.rating === 0) {
            alert('Please select a rating!');
            return;
        }
        
        this.dispatchEvent(new CustomEvent('save', {
            detail: {
                ratingData: data,
                existingRating: this.existingRating
            },
            bubbles: true,
            composed: true
        }));
        
        this.close();
    }
    
    delete() {
        if (!confirm('Are you sure you want to delete this rating?')) {
            return;
        }
        
        this.dispatchEvent(new CustomEvent('delete', {
            detail: this.existingRating,
            bubbles: true,
            composed: true
        }));
        
        this.close();
    }
    
    close() {
        const modal = this.querySelector('.rating-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        document.removeEventListener('keydown', this.escapeHandler);
        
        this.dispatchEvent(new CustomEvent('close', {
            bubbles: true,
            composed: true
        }));
        
        modal.addEventListener('transitionend', () => {
            this.remove();
        }, { once: true });
        
        setTimeout(() => this.remove(), 350);
    }
    
    setRating(ratingData) {
        if (!ratingData) return;
        
        this.existingRating = ratingData;
        const form = this.querySelector('.rating-form');
        
        const stars = this.querySelectorAll('.star');
        stars.forEach(star => {
            star.classList.remove('filled', 'half');
        });
        
        if (ratingData.rating) {
            const fiveStarRating = ratingData.rating / 2;
            this.currentRating = fiveStarRating;
            this.updateStars(fiveStarRating);
            form.querySelector('input[name="rating"]').value = ratingData.rating;
        }
        
        if (ratingData.must_listen) {
            form.querySelector('input[name="must_listen"]').checked = true;
        }
        if (ratingData.would_relisten) {
            form.querySelector('input[name="would_relisten"]').checked = true;
        }
        
        if (ratingData.listened_date) {
            form.querySelector('input[name="listened_date"]').value = ratingData.listened_date;
        }
        if (ratingData.favorite_song) {
            form.querySelector('input[name="favorite_song"]').value = ratingData.favorite_song;
        }
        if (ratingData.least_favorite_song) {
            form.querySelector('input[name="least_favorite_song"]').value = ratingData.least_favorite_song;
        }
        if (ratingData.review) {
            form.querySelector('textarea[name="review"]').value = ratingData.review;
        }
        
        this.querySelector('.delete-btn').style.display = 'block';
        this.querySelector('.save-btn').textContent = 'Update Album';
    }
}

customElements.define('rating-modal', RatingModal);
