export class AuthService {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
    }
    
    checkAuth() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
            } catch (error) {
                this.logout();
            }
        }
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
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentUserId');
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
