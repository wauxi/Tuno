import { logger } from '../../shared/utils/Logger.js';

export class SettingsManager {
    constructor() {
        this.avatarInput = document.getElementById('avatarUpload');
        this.avatarImage = document.querySelector('.settings__avatar-image');
        this.bioTextarea = document.getElementById('bio');
        this.bioCounter = document.getElementById('bioCounter');
        this.currentUser = null;
        
        this.init();
    }
    
    async init() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = '/public/pages/login.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        await this.loadUserData();
        
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
    
    async loadUserData() {
        try {
            logger.debug('Loading user data for user:', this.currentUser);
            
            const response = await fetch(`http://localhost:8080/api/user-settings.php?user_id=${this.currentUser.id}`);
            const data = await response.json();
            
            logger.debug('User settings response:', data);
            
            if (data.success) {
                document.getElementById('username').value = data.user.username || '';
                document.getElementById('displayName').value = data.user.display_name || '';
                document.getElementById('bio').value = data.user.bio || '';
                
                logger.debug('Avatar URL:', data.user.avatar_url);
                
                if (data.user.avatar_url) {
                    const avatarPath = `http://localhost:8080/${data.user.avatar_url}`;
                    this.avatarImage.src = avatarPath;
                }
                
                this.updateBioCounter();
                this.loadFavoriteAlbums(data.favoriteAlbums || []);
            } else {
                logger.error('Failed to load user data:', data.message);
                this.showToast(data.message || 'Failed to load user data', 'error');
            }
        } catch (error) {
            logger.error('Failed to load user data:', error);
            this.showToast('Failed to load user data', 'error');
        }
    }
    
    loadFavoriteAlbums(favorites) {
        document.querySelectorAll('.settings__album-slot').forEach(slot => {
            slot.innerHTML = `
                <div class="settings__album-placeholder">
                    <span>+</span>
                </div>
            `;
        });
        
        favorites.forEach(fav => {
            const slot = document.querySelector(`[data-slot="${fav.slot_number}"]`);
            if (slot) {
                slot.innerHTML = `
                    <img src="${fav.cover_url || '/img/default-cover.png'}" alt="${fav.album_name}">
                    <div class="settings__album-info">
                        <span class="settings__album-artist">${fav.artist}</span>
                        <span class="settings__album-name">${fav.album_name}</span>
                    </div>
                    <button class="settings__album-remove" data-album-id="${fav.album_id}">×</button>
                `;
            }
        });
    }
    
    async handleAvatarChange(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            this.showToast('Please select a valid image file (PNG, JPG, or WEBP)', 'error');
            return;
        }
        
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast('Image size must be less than 2MB', 'error');
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
            const response = await fetch(`http://localhost:8080/api/upload-avatar.php`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            logger.info('📥 Upload response:', data);
            
            if (data.success) {
                // Обновить localStorage с НОВЫМ путём к аватару
                this.currentUser.avatar_url = data.avatar_url;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                logger.success('localStorage updated with new avatar:', data.avatar_url);
                
                // Обновить аватар в header (navigation)
                const headerAvatar = document.querySelector('.navigation__user-avatar img');
                if (headerAvatar) {
                    const avatarPath = `http://localhost:8080/${data.avatar_url}`;
                    headerAvatar.src = avatarPath;
                    logger.success('Header avatar updated:', avatarPath);
                }
                
                // Обновить аватар на странице settings
                const settingsAvatar = this.avatarImage;
                if (settingsAvatar) {
                    const avatarPath = `http://localhost:8080/${data.avatar_url}`;
                    settingsAvatar.src = avatarPath;
                    logger.success('Settings avatar updated:', avatarPath);
                }
                
                this.showToast('Avatar uploaded successfully!', 'success');
            } else {
                this.showToast(data.message || 'Failed to upload avatar', 'error');
            }
        } catch (error) {
            logger.error('Upload error:', error);
            this.showToast('Failed to upload avatar', 'error');
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
            this.showToast('Username must be at least 2 characters', 'error');
            return;
        }
        
        if (bio.length > 500) {
            this.showToast('Bio must be less than 500 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:8080/api/user-settings.php`, {
                method: 'POST',
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
                // Обновить localStorage
                this.currentUser.username = username;
                this.currentUser.display_name = displayName;
                this.currentUser.bio = bio;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                
                this.showToast('Settings saved! Reload main page to see changes.', 'success');
            } else {
                this.showToast(data.message || 'Failed to save settings', 'error');
            }
        } catch (error) {
            logger.error('Save error:', error);
            this.showToast('Failed to save settings', 'error');
        }
    }
    
    handleCancel() {
        window.location.reload();
    }
    
    showToast(message, type = 'info') {
        const container = document.querySelector('.settings__toast-container');
        if (!container) return;
        
        const template = document.getElementById('toast-template');
        if (!template) return;
        
        const toast = template.content.cloneNode(true);
        const toastElement = toast.querySelector('.settings__toast');
        
        toastElement.classList.add(type);
        
        const icon = toastElement.querySelector('.settings__toast-icon');
        if (type === 'success') {
            icon.textContent = '✓';
        } else if (type === 'error') {
            icon.textContent = '✗';
        } else {
            icon.textContent = 'ℹ';
        }
        
        const messageEl = toastElement.querySelector('.settings__toast-message');
        messageEl.textContent = message;
        
        const closeBtn = toastElement.querySelector('.settings__toast-close');
        closeBtn.addEventListener('click', () => {
            toastElement.remove();
        });
        
        container.appendChild(toastElement);
        
        setTimeout(() => {
            toastElement.remove();
        }, 5000);
    }
}
