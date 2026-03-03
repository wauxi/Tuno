import { setCurrentUserData, getCurrentUserData } from './authUtils.js';
import { CONFIG, ROUTES } from '../../config/constants.js';
import { logger } from '../../shared/utils/Logger.js';

class AuthManager {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isLoginMode = urlParams.get('mode') !== 'register';
        this.apiUrl = `${CONFIG.API.BASE_URL}/${CONFIG.API.ENDPOINTS.AUTH}`;
        this.init();
    }
    
    init() {
        this.form = document.getElementById('authForm');
        this.formTitle = document.getElementById('formTitle');
        this.submitBtn = document.getElementById('submitBtn');
        this.switchText = document.getElementById('switchText');
        this.switchMode = document.getElementById('switchMode');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
        
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.switchMode.addEventListener('click', this.toggleMode.bind(this));
        
        this.updateUI();
        this.checkCurrentUser();
    }
    
    toggleMode(e) {
        e.preventDefault();
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
        
        const newUrl = this.isLoginMode ? ROUTES.LOGIN : ROUTES.SIGNUP;
        window.history.replaceState({}, '', newUrl);
    }
    
    updateUI() {
        if (this.isLoginMode) {
            this.formTitle.textContent = 'Log in to Musicboard';
            this.submitBtn.textContent = 'Log in';
            this.switchText.textContent = "Don't have an account?";
            this.switchMode.textContent = 'Sign up';
            this.confirmPasswordGroup.style.display = 'none';
            document.getElementById('confirmPassword').required = false;
        } else {
            this.formTitle.textContent = 'Sign up for Musicboard';
            this.submitBtn.textContent = 'Sign up';
            this.switchText.textContent = 'Already have an account?';
            this.switchMode.textContent = 'Log in';
            this.confirmPasswordGroup.style.display = 'block';
            document.getElementById('confirmPassword').required = true;
        }
        this.hideMessages();
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (!this.isLoginMode && password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        if (username.length < 2) {
            this.showError('Username must be at least 2 characters');
            return;
        }
        
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }
        
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Processing...';
        
        const requestData = {
            action: this.isLoginMode ? 'login' : 'register',
            username: username,
            password: password
        };
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const responseText = await response.text();
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                logger.error('JSON parsing error:', parseError);
                logger.debug('Raw response:', responseText);
                this.showError('Server returned an invalid response');
                return;
            }
            
            if (data.success) {
                if (this.isLoginMode) {
                    setCurrentUserData(data.user);
                    this.showSuccess('Login successful!');
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    window.location.href = ROUTES.HOME;
                } else {
                    this.showSuccess('Registration successful! You can now log in.');
                    this.isLoginMode = true;
                    this.updateUI();
                    this.form.reset();
                }
            } else {
                this.showError(data.message || 'An error occurred');
            }
        } catch (error) {
            logger.error('Error:', error);
            this.showError('Connection error with server');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.isLoginMode ? 'Log in' : 'Sign up';
        }
    }
    
    checkCurrentUser() {
        const currentUser = getCurrentUserData();
        if (currentUser) {
            window.location.href = ROUTES.HOME;
        }
    }
    
    showError(message) {
        this.hideMessages();
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }
    
    showSuccess(message) {
        this.hideMessages();
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
    }
    
    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});