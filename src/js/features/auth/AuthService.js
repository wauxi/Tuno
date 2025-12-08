import { getCurrentUserData, clearCurrentUser } from './authUtils.js';
import { logger } from '../../shared/utils/Logger.js';
import { CONFIG } from '../../config/constants.js';

export class AuthService {
    constructor() {
        this.isLoggedIn = false;
    }
    
    checkAuth() {
        const userData = getCurrentUserData();
        this.isLoggedIn = userData !== null;
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
            this.isLoggedIn = false;
            clearCurrentUser();
        }
    }
    
    isAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser && (currentUser.role === 'admin' || currentUser.isAdmin === true);
    }
    
    getCurrentUser() {
        // Всегда читать свежие данные из localStorage
        return getCurrentUserData();
    }
    
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}
