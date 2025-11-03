import { logger } from '../utils/Logger.js';

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

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !userDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Close dropdown when escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
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
            // Navigate to user's profile page
            window.location.href = `/Home.html?user_id=${currentUser.id}`;
        }
    }

    handleSettings() {
        // Navigate to settings page or open settings modal
        logger.info('Settings action clicked');
        // You can implement this based on your needs
    }

    async handleLogout() {
        try {
            await this.authService.logout();
            window.location.href = '/Home.html';
        } catch (error) {
            logger.error('Error during logout:', error);
            alert('Error logging out. Please try again.');
        }
    }

    closeDropdown() {
        const userDropdown = document.querySelector('.navigation__user-dropdown');
        if (userDropdown) {
            // Don't use inline styles - let CSS handle visibility
            // Just remove any active state if you add one later
        }
    }
}
