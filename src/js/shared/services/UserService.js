import { CONFIG } from '../../config/constants.js';

export class UserService {
    constructor() {
        this.usersCache = null;
    }
    
    async loadUsers() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.USERS}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Server returned HTML instead of JSON. Check PHP errors.');
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
