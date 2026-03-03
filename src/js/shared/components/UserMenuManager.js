import { logger } from '../utils/Logger.js';
import { ROUTES } from '../../config/constants.js';
import { showToast } from '../utils/toast.js';

export class UserMenuManager {
    constructor(authService) {
        this.authService = authService;
        this.isInitialized = false;
    }

    initUserMenu() {
        if (this.isInitialized) {
            return; // Already initialized, don't add duplicate listeners
        }

        const userAvatar = document.querySelector('.navigation__user-avatar');
        const userDropdown = document.querySelector('.navigation__user-dropdown');

        if (!userAvatar || !userDropdown) {
            return;
        }

        // Use event delegation on document for dropdown item clicks
        document.addEventListener('click', (e) => {
            const dropdownItem = e.target.closest('.navigation__user-dropdown-item');
            if (dropdownItem) {
                e.preventDefault();
                e.stopPropagation();
                this.handleMenuItemClick(dropdownItem);
            }
        });

        this.isInitialized = true;
    }

    handleMenuItemClick(item) {
        const action = item.dataset.action;

        switch (action) {
            case 'view-profile':
                this.handleViewProfile();
                break;
            case 'settings':
                this.handleSettings();
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                logger.warn('Unknown user menu action:', action);
        }
    }

    handleViewProfile() {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            window.location.href = `/?user=${currentUser.id}`;
        }
    }

    handleSettings() {
        window.location.href = '/public/pages/settings.html';
    }

    async handleLogout() {
        try {
            await this.authService.logout();
            window.location.href = ROUTES.HOME;
        } catch (error) {
            logger.error('Error during logout:', error);
            showToast('Logout failed. Please try again.', 'error');
        }
    }
}
