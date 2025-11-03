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
        
        if (window.innerWidth <= 970) {
            document.body.classList.add('modal-open');
        }
        
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
        document.body.classList.remove('modal-open');
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
                            <div class="album-info__wrapper">
                                <div class="album-info__cover">
                                    <img src="${coverUrl}" alt="${albumName}">
                                </div>
                                <div class="album-info__details">
                                    <h4>${albumName}</h4>
                                    <p>${artist} • Album</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="rating-modal__right">
                            <form class="rating-form">
                                <div class="rating-row">
                                    <div class="rating-group">
                                        <h4 class="rating-form__h4">Rating</h4>
                                        <div class="rating-selector">
                                            ${this.generateStars()}
                                        </div>
                                        <input type="hidden" name="rating" value="0">
                                    </div>

                                    <div class="checkbox-group">
                                        <div class="checkbox-section">
                                            <h4 class="rating-form__h4">Must listen</h4>
                                            <label class="checkbox-item">
                                                <input type="checkbox" id="mustListen" name="must_listen">
                                                <span>Все должны это послушать</span>
                                                <div class="checkbox-icon unchecked" data-checkbox="mustListen">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"    
                                                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">                                          
                                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>                            
                                                        <polyline points="9 22 9 12 15 12 15 22"></polyline>                 
                                                    </svg>           
                                                </div>
                                            </label>
                                        </div>
                                        <div class="checkbox-section">
                                            <h4 class="rating-form__h4">Would re-listen</h4>
                                            <label class="checkbox-item">
                                                <input type="checkbox" id="wouldRelisten" name="would_relisten">
                                                <span>Переслушал бы</span>
                                                <div class="checkbox-icon unchecked" data-checkbox="wouldRelisten">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="17 1 21 5 17 9"></polyline>
                                                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                                        <polyline points="7 23 3 19 7 15"></polyline>
                                                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                                                    </svg>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="date-group">
                                        <h4 class="rating-form__h4" for="listenedAt">Listened at</h4>
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
        
        const checkboxIcons = this.querySelectorAll('.checkbox-icon');
        checkboxIcons.forEach(icon => {
            icon.addEventListener('click', (e) => this.handleIconClick(e));
        });
        
        const checkboxes = this.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleCheckboxChange(e));
        });
        
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
    
    handleIconClick(e) {
        const icon = e.currentTarget;
        const checkboxId = icon.dataset.checkbox;
        const checkbox = this.querySelector(`#${checkboxId}`);
        
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            this.updateIconState(icon, checkbox.checked);
        }
    }
    
    handleCheckboxChange(e) {
        const checkbox = e.target;
        const icon = this.querySelector(`.checkbox-icon[data-checkbox="${checkbox.id}"]`);
        
        if (icon) {
            this.updateIconState(icon, checkbox.checked);
        }
    }
    
    updateIconState(icon, isChecked) {
        if (isChecked) {
            icon.classList.remove('unchecked');
            icon.classList.add('checked');
        } else {
            icon.classList.remove('checked');
            icon.classList.add('unchecked');
        }
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
        document.body.classList.remove('modal-open');
        
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
            const checkbox = form.querySelector('input[name="must_listen"]');
            checkbox.checked = true;
            const icon = this.querySelector('.checkbox-icon[data-checkbox="mustListen"]');
            if (icon) this.updateIconState(icon, true);
        }
        if (ratingData.would_relisten) {
            const checkbox = form.querySelector('input[name="would_relisten"]');
            checkbox.checked = true;
            const icon = this.querySelector('.checkbox-icon[data-checkbox="wouldRelisten"]');
            if (icon) this.updateIconState(icon, true);
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
