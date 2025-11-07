import { getCurrentUserData, clearCurrentUser } from './authUtils.js';
import { logger } from '../../shared/utils/Logger.js';
import { CONFIG } from '../../config/constants.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
    }
    
    checkAuth() {
        this.currentUser = getCurrentUserData();
        this.isLoggedIn = this.currentUser !== null;
    }
    
    async logout() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.AUTH}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
            
            await response.json();
        } catch (error) {
            logger.error('Logout error:', error);
        } finally {
            this.currentUser = null;
            this.isLoggedIn = false;
            clearCurrentUser();
        }
    }
    
    isAdmin() {
        return this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.isAdmin === true);
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}
