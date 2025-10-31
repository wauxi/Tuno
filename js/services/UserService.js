export class UserService {
    constructor() {
        this.usersCache = null;
    }
    
    async loadUsers() {
        try {
            const response = await fetch('php/get-users.php');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.users && data.users.length > 0) {
                this.usersCache = data.users;
            } else {
                this.usersCache = [];
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.usersCache = [];
        }
    }
    
    getUserById(userId) {
        const numericUserId = parseInt(userId);
        
        if (this.usersCache && this.usersCache.length > 0) {
            return this.usersCache.find(u => u.id === numericUserId);
        }
        
        return null;
    }
    
    getUserNameById(userId) {
        const user = this.getUserById(userId);
        if (user) {
            return user.display_name || user.username;
        }
        
        return `User ${userId}`;
    }
    
    getAllUsers() {
        return this.usersCache || [];
    }
}
