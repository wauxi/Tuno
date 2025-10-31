import { getCurrentUserData, clearCurrentUser } from '../utils/authUtils.js';

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
            const response = await fetch('php/auth-api.php', {
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
            console.error('Logout error:', error);
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
