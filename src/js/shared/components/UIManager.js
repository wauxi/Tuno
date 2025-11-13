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
        
        if (currentUser) {
            
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) {
                userInfo.innerHTML = `
                    <div class="navigation__user-avatar navigation-img">
                        <img src="${currentUser.avatar_url || '/img/logo.jpg'}" alt="User Avatar">
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
        if (!profileInfo) return;
        
        const userName = this.userService.getUserNameById(this.viewingUserId);
        const currentUser = this.authService.getCurrentUser();
        const isOwnProfile = currentUser && currentUser.id === this.viewingUserId;
        
        if (this.authService.isUserLoggedIn() && currentUser) {
            profileInfo.innerHTML = `
                <h5 class="nickname">${userName}</h5>
                <h3 class="name">${userName}</h3>
                <h4 class="biografy">${isOwnProfile ? 'Ваша музыкальная активность' : 'Музыкальная активность пользователя'}</h4>
            `;
        } else {
            const switcherButtons = this.getUserSwitcherHTML();
            profileInfo.innerHTML = `
                <h5 class="nickname">${userName}</h5>
                <h3 class="name">${userName}</h3>
                <h4 class="biografy">
                    Музыкальная активность пользователя
                    <div class="user-switcher">${switcherButtons}</div>
                </h4>
            `;
        }
    }
    
    getUserSwitcherHTML() {
        const users = this.userService.getAllUsers();
        
        if (!users || users.length === 0) {
            return '<p>Пользователи не найдены</p>';
        }
        
        return users.map(user => {
            const isActive = this.viewingUserId === user.id;
            const userName = user.display_name || user.username;
            const activeClass = isActive ? 'active' : '';
            return `<button data-action="switch-user" data-user-id="${user.id}" class="${activeClass}">${userName}</button>`;
        }).join('');
    }
    
    updateUI() {
        this.updateAuthUI();
        this.updateProfileUI();
    }
}
