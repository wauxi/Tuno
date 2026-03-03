import { logger } from '../../shared/utils/Logger.js';
import { escapeHtml } from '../../shared/utils/sanitize.js';
import { showToast } from '../../shared/utils/toast.js';

export class SettingsManager {
    constructor() {
        this.avatarInput = document.getElementById('avatarUpload');
        this.avatarImage = document.querySelector('.settings__avatar-image');
        this.bioTextarea = document.getElementById('bio');
        this.bioCounter = document.getElementById('bioCounter');
        this.currentUser = null;

        this.pendingFavorites = { 1: null, 2: null, 3: null, 4: null };
        this.pickerSlot = null;
        this.searchDebounceTimer = null;
        this.apiBaseUrl = document.querySelector('meta[name="api-base-url"]')?.getAttribute('content') || 'http://localhost:8080';
        this._pickerEscHandler = null;
        
        this.init();
    }
    
    async init() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = '/public/pages/login.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        // Show avatar from localStorage immediately, without waiting for server
        if (this.currentUser.avatar_url && this.avatarImage) {
            const apiBase = this.apiBaseUrl;
            this.avatarImage.src = `${apiBase}/${this.currentUser.avatar_url}`;
        }
        
        await this.loadUserData();
        this.initSlotListeners();
        
        if (this.avatarInput) {
            this.avatarInput.addEventListener('change', this.handleAvatarChange.bind(this));
        }
        
        if (this.bioTextarea && this.bioCounter) {
            this.bioTextarea.addEventListener('input', this.updateBioCounter.bind(this));
        }
        
        const saveBtn = document.getElementById('saveSettings');
        const cancelBtn = document.getElementById('cancelSettings');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', this.handleSave.bind(this));
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.handleCancel.bind(this));
        }
    }

    initSlotListeners() {
        const grid = document.querySelector('.settings__albums-grid');
        if (!grid) return;

        grid.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.settings__album-remove');
            if (removeBtn) {
                e.stopPropagation();
                const slot = removeBtn.closest('.settings__album-slot');
                if (slot) this.removeAlbum(parseInt(slot.dataset.slot));
                return;
            }

            const slot = e.target.closest('.settings__album-slot');
            if (slot) {
                this.openAlbumPicker(parseInt(slot.dataset.slot));
            }
        });
    }
    
    async loadUserData() {
        try {
            logger.debug('Loading user data for user:', this.currentUser);
            
            const response = await fetch(`${this.apiBaseUrl}/api/user-settings.php?user_id=${this.currentUser.id}`, {
                credentials: 'include'
            });
            const data = await response.json();
            
            logger.debug('User settings response:', data);
            
            if (data.success) {
                document.getElementById('username').value = data.user.username || '';
                document.getElementById('displayName').value = data.user.display_name || '';
                document.getElementById('bio').value = data.user.bio || '';
                
                logger.debug('Avatar URL:', data.user.avatar_url);
                
                if (data.user.avatar_url) {
                    const avatarPath = `${this.apiBaseUrl}/${data.user.avatar_url}`;
                    this.avatarImage.src = avatarPath;
                }
                
                this.updateBioCounter();
                this.loadFavoriteAlbums(data.favoriteAlbums || []);
            } else {
                logger.error('Failed to load user data:', data.message);
                showToast(data.message || 'Failed to load user data', 'error');
            }
        } catch (error) {
            logger.error('Failed to load user data:', error);
            showToast('Failed to load user data', 'error');
        }
    }
    
    loadFavoriteAlbums(favorites) {
        this.pendingFavorites = { 1: null, 2: null, 3: null, 4: null };

        favorites.forEach(fav => {
            const slotNum = parseInt(fav.slot_number);
            if (slotNum >= 1 && slotNum <= 4) {
                this.pendingFavorites[slotNum] = {
                    album_id: fav.album_id,
                    album_name: fav.album_name,
                    artist: fav.artist,
                    coverUrl: fav.coverUrl || fav.cover_url || '/img/default-cover.png'
                };
            }
        });

        this.renderAllSlots();
    }

    renderAllSlots() {
        for (let i = 1; i <= 4; i++) {
            this.renderSlot(i);
        }
    }

    renderSlot(slotNumber) {
        const slot = document.querySelector(`[data-slot="${slotNumber}"]`);
        if (!slot) return;

        const album = this.pendingFavorites[slotNumber];

        if (album) {
            const template = document.getElementById('album-slot-filled');
            if (template) {
                const content = template.content.cloneNode(true);
                content.querySelector('.settings__album-cover').src = album.coverUrl;
                content.querySelector('.settings__album-cover').alt = album.album_name;
                content.querySelector('.settings__album-name').textContent = album.album_name;
                content.querySelector('.settings__album-artist').textContent = album.artist;
                slot.innerHTML = '';
                slot.appendChild(content);
            }
        } else {
            slot.innerHTML = `
                <div class="settings__album-placeholder">
                    <span class="settings__album-plus">+</span>
                    <span class="settings__album-label">Add Album</span>
                </div>
            `;
        }
    }

    openAlbumPicker(slotNumber) {
        this.pickerSlot = slotNumber;

        const existing = document.getElementById('albumPickerModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'albumPickerModal';
        modal.className = 'settings__picker-overlay';
        modal.innerHTML = `
            <div class="settings__picker">
                <div class="settings__picker-header">
                    <h3 class="settings__picker-title">Select Album</h3>
                    <button class="settings__picker-close" type="button" aria-label="Close">×</button>
                </div>
                <div class="settings__picker-search">
                    <input
                        type="text"
                        class="settings__picker-input"
                        id="pickerSearchInput"
                        placeholder="Search by album or artist..."
                        autocomplete="off"
                    />
                </div>
                <div class="settings__picker-results" id="pickerResults">
                    <p class="settings__picker-hint">Start typing to search albums</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeAlbumPicker();
        });

        modal.querySelector('.settings__picker-close').addEventListener('click', () => {
            this.closeAlbumPicker();
        });

        const input = modal.querySelector('#pickerSearchInput');
        input.addEventListener('input', (e) => {
            clearTimeout(this.searchDebounceTimer);
            const query = e.target.value.trim();
            if (query.length < 2) {
                document.getElementById('pickerResults').innerHTML =
                    '<p class="settings__picker-hint">Start typing to search albums</p>';
                return;
            }
            this.searchDebounceTimer = setTimeout(() => this.searchAlbums(query), 300);
        });

        this._pickerEscHandler = (e) => {
            if (e.key === 'Escape') this.closeAlbumPicker();
        };
        document.addEventListener('keydown', this._pickerEscHandler);

        requestAnimationFrame(() => input.focus());
    }

    closeAlbumPicker() {
        const modal = document.getElementById('albumPickerModal');
        if (modal) modal.remove();
        this.pickerSlot = null;
        clearTimeout(this.searchDebounceTimer);
        document.body.style.overflow = '';
        if (this._pickerEscHandler) {
            document.removeEventListener('keydown', this._pickerEscHandler);
            this._pickerEscHandler = null;
        }
    }

    async searchAlbums(query) {
        const resultsEl = document.getElementById('pickerResults');
        if (!resultsEl) return;

        resultsEl.innerHTML = '<p class="settings__picker-hint">Searching...</p>';

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/api/index.php?action=search&q=${encodeURIComponent(query)}`
            );
            const data = await response.json();

            if (data.success && data.albums && data.albums.length > 0) {
                this.renderPickerResults(data.albums);
            } else {
                resultsEl.innerHTML = '<p class="settings__picker-hint">No albums found</p>';
            }
        } catch (error) {
            logger.error('Album search error:', error);
            resultsEl.innerHTML = '<p class="settings__picker-hint">Search failed, please try again</p>';
        }
    }

    renderPickerResults(albums) {
        const resultsEl = document.getElementById('pickerResults');
        if (!resultsEl) return;

        resultsEl.innerHTML = '';

        albums.forEach(album => {
            const albumId = album.album_id || album.id;
            const coverUrl = album.coverUrl || album.cover_url || '/img/default-cover.png';

            const btn = document.createElement('button');
            btn.className = 'settings__picker-item';
            btn.type = 'button';
            btn.innerHTML = `
                <img
                    class="settings__picker-item-cover"
                    src="${coverUrl}"
                    alt="${escapeHtml(album.album_name)}"
                    onerror="this.src='/img/default-cover.png'"
                />
                <div class="settings__picker-item-info">
                    <span class="settings__picker-item-name">${escapeHtml(album.album_name)}</span>
                    <span class="settings__picker-item-artist">${escapeHtml(album.artist)}</span>
                </div>
            `;

            btn.addEventListener('click', () => {
                this.selectAlbum({
                    album_id: albumId,
                    album_name: album.album_name,
                    artist: album.artist,
                    coverUrl
                });
            });

            resultsEl.appendChild(btn);
        });
    }

    selectAlbum(albumData) {
        if (!this.pickerSlot) return;

        // Check for duplicate
        for (let slot = 1; slot <= 4; slot++) {
            if (slot === this.pickerSlot) continue;
            const existing = this.pendingFavorites[slot];
            if (existing && existing.album_id == albumData.album_id) {
                showToast('This album is already in your favorites', 'error');
                return;
            }
        }

        this.pendingFavorites[this.pickerSlot] = albumData;
        this.renderSlot(this.pickerSlot);
        this.closeAlbumPicker();
    }

    removeAlbum(slotNumber) {
        this.pendingFavorites[slotNumber] = null;
        this.renderSlot(slotNumber);
    }
    
    async handleAvatarChange(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Please select a valid image file (PNG, JPG, or WEBP)', 'error');
            return;
        }
        
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('Image size must be less than 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            if (this.avatarImage) {
                this.avatarImage.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
        
        await this.uploadAvatar(file);
    }
    
    async uploadAvatar(file) {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('user_id', this.currentUser.id);
        
        logger.info('📤 Uploading avatar...', file.name);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/upload-avatar.php`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            
            const data = await response.json();
            
            logger.info('📥 Upload response:', data);
            
            if (data.success) {
                this.currentUser.avatar_url = data.avatar_url;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                logger.success('localStorage updated with new avatar:', data.avatar_url);
                
                const headerAvatar = document.querySelector('.navigation__user-avatar img');
                if (headerAvatar) {
                    const avatarPath = `${this.apiBaseUrl}/${data.avatar_url}`;
                    headerAvatar.src = avatarPath;
                    logger.success('Header avatar updated:', avatarPath);
                }
                
                const settingsAvatar = this.avatarImage;
                if (settingsAvatar) {
                    const avatarPath = `${this.apiBaseUrl}/${data.avatar_url}`;
                    settingsAvatar.src = avatarPath;
                    logger.success('Settings avatar updated:', avatarPath);
                }
                
                showToast('Avatar uploaded successfully!', 'success');
            } else {
                showToast(data.message || 'Failed to upload avatar', 'error');
            }
        } catch (error) {
            logger.error('Upload error:', error);
            showToast('Failed to upload avatar', 'error');
        }
    }
    
    updateBioCounter() {
        if (this.bioTextarea && this.bioCounter) {
            const length = this.bioTextarea.value.length;
            this.bioCounter.textContent = length;
        }
    }
    
    async handleSave(e) {
        e.preventDefault();
        
        const username = document.getElementById('username')?.value.trim();
        const displayName = document.getElementById('displayName')?.value.trim();
        const bio = document.getElementById('bio')?.value.trim();
        
        if (!username || username.length < 2) {
            showToast('Username must be at least 2 characters', 'error');
            return;
        }
        
        if (bio.length > 500) {
            showToast('Bio must be less than 500 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/user-settings.php`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'update_profile',
                    user_id: this.currentUser.id,
                    username,
                    display_name: displayName,
                    bio
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser.username = username;
                this.currentUser.display_name = displayName;
                this.currentUser.bio = bio;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

                await this.saveFavorites();
                
                showToast('Settings saved! Reload main page to see changes.', 'success');
            } else {
                showToast(data.message || 'Failed to save settings', 'error');
            }
        } catch (error) {
            logger.error('Save error:', error);
            showToast('Failed to save settings', 'error');
        }
    }

    async saveFavorites() {
        const favorites = [];
        for (let slot = 1; slot <= 4; slot++) {
            const album = this.pendingFavorites[slot];
            if (album) {
                favorites.push({ album_id: album.album_id, slot_number: slot });
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/user-settings.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_favorites',
                    user_id: this.currentUser.id,
                    favorites
                })
            });

            const data = await response.json();
            if (!data.success) {
                logger.error('Failed to save favorites:', data.message);
                showToast('Failed to save favorites: ' + (data.message || ''), 'error');
            }
        } catch (error) {
            logger.error('Error saving favorites:', error);
            showToast('Failed to save favorites', 'error');
        }
    }
    
    handleCancel() {
        window.location.reload();
    }
}
