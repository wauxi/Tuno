import { logger } from '../utils/Logger.js';
import { escapeHtml } from '../utils/sanitize.js';
import { CONFIG } from '../../config/constants.js';

export class UIManager {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
        this.viewingUserId = null;
    }
    
    setViewingUserId(userId) {
        this.viewingUserId = userId;
    }
    
    updateAuthUI() {
        const authButtons = document.querySelector('.navigation__auth');
        const userInfo = document.querySelector('.navigation__user-info');
        const initialState = (typeof window !== 'undefined' && window.__INITIAL_STATE__) ? window.__INITIAL_STATE__ : null;
        const currentUser = initialState && initialState.currentUser ? initialState.currentUser : (this.authService.isUserLoggedIn() ? this.authService.getCurrentUser() : null);
        
        logger.debug('UpdateAuthUI - currentUser:', currentUser);
        
        if (currentUser) {
            
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) {
                const avatarPath = currentUser.avatar_url 
                    ? `${CONFIG.API.BASE_URL}/${currentUser.avatar_url}` 
                    : '/img/logo.jpg';
                
                logger.debug('Setting header avatar:', avatarPath);
                
                userInfo.innerHTML = `
                    <div class="navigation__user-avatar navigation-img">
                        <img src="${avatarPath}" alt="User Avatar" draggable="false">
                        <div class="navigation__user-dropdown">
                            <button class="navigation__user-dropdown-item" data-action="view-profile">
                                Profile
                            </button>
                            <button class="navigation__user-dropdown-item" data-action="settings">
                                Settings
                            </button>
                            <button class="navigation__user-dropdown-item navigation__user-dropdown-item--logout" data-action="logout">
                                Log out
                            </button>
                        </div>
                    </div>
                `;
                userInfo.style.display = 'flex';
            }
            if (authButtons) authButtons.style.display = 'none';
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (authButtons) {
                authButtons.style.display = 'flex';
                authButtons.innerHTML = `
                    <button type="button" class="navigation__auth-button button" data-action="login">
                        <span>Login</span>
                    </button>
                    <button type="button" class="navigation__auth-button button" data-action="signup">
                        <span>Sign Up</span>
                    </button>
                `;
            }
        }
    }
    
    updateProfileUI() {
        const profileInfo = document.querySelector('.info__profile-name');
        const profileAvatarContainer = document.querySelector('.info__profile-avatar');
        if (!profileInfo) return;
        const currentUser = this.authService.getCurrentUser();
        const isOwnProfile = currentUser && currentUser.id === this.viewingUserId;
        
        logger.debug('UpdateProfileUI:', {
            currentUser,
            isOwnProfile,
            viewingUserId: this.viewingUserId
        });
        
        const viewingUser = isOwnProfile 
            ? currentUser 
            : this.userService.getUserById(this.viewingUserId);
        
        if (profileAvatarContainer && viewingUser) {
            const avatarPath = viewingUser.avatar_url 
                ? `${CONFIG.API.BASE_URL}/${viewingUser.avatar_url}` 
                : '/img/logo.jpg';
            
            logger.debug('Setting avatar:', avatarPath);
            
            profileAvatarContainer.innerHTML = `
                <img src="${avatarPath}" alt="Profile Image" draggable="false">
            `;
        }
        
        if (viewingUser) {
            const bio = escapeHtml(viewingUser.bio || 'User music activity');
            const displayName = escapeHtml(viewingUser.display_name || viewingUser.username);
            const username = escapeHtml(viewingUser.username);
            
            logger.debug('Setting profile:', { username, displayName, bio });
            
            if (isOwnProfile) {
                profileInfo.innerHTML = `
                    <h5 class="nickname">${username}</h5>
                    <h3 class="name">${displayName}</h3>
                    <h4 class="biografy">${bio}</h4>
                `;
            } else {
                const switcherButtons = this.getUserSwitcherHTML();
                profileInfo.innerHTML = `
                    <h5 class="nickname">${username}</h5>
                    <h3 class="name">${displayName}</h3>
                    <h4 class="biografy">
                        ${bio}
                        <div class="user-switcher">${switcherButtons}</div>
                    </h4>
                `;
            }
        } else {
            const userName = escapeHtml(this.userService.getUserNameById(this.viewingUserId));
            const switcherButtons = this.getUserSwitcherHTML();
            profileInfo.innerHTML = `
                <h5 class="nickname">${userName}</h5>
                <h3 class="name">${userName}</h3>
                <h4 class="biografy">
                    User music activity
                    <div class="user-switcher">${switcherButtons}</div>
                </h4>
            `;
        }
    }
    
    getUserSwitcherHTML() {
        const users = this.userService.getAllUsers();
        
        if (!users || users.length === 0) {
            return '<p>No users found</p>';
        }
        
        return users.map(user => {
            const isActive = this.viewingUserId === user.id;
            const userName = escapeHtml(user.display_name || user.username);
            const activeClass = isActive ? 'active' : '';
            return `<button data-action="switch-user" data-user-id="${user.id}" class="${activeClass}">${userName}</button>`;
        }).join('');
    }
    
    updateUI() {
        this.updateAuthUI();
        this.updateProfileUI();
    }
}
