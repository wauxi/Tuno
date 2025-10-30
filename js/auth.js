class AuthManager {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isLoginMode = urlParams.get('mode') !== 'register';
        this.apiUrl = 'http://ms2/php/auth-api.php';
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
        
        setTimeout(() => {
            this.checkCurrentUser();
        }, 100);
    }
    
    toggleMode(e) {
        e.preventDefault();
        this.isLoginMode = !this.isLoginMode;
        this.updateUI();
        
        const newUrl = this.isLoginMode ? 'login.html' : 'login.html?mode=register';
        window.history.replaceState({}, '', newUrl);
    }
    
    updateUI() {
        if (this.isLoginMode) {
            this.formTitle.textContent = 'Вход в Musicboard';
            this.submitBtn.textContent = 'Войти';
            this.switchText.textContent = 'Нет аккаунта?';
            this.switchMode.textContent = 'Зарегистрироваться';
            this.confirmPasswordGroup.style.display = 'none';
            document.getElementById('confirmPassword').required = false;
        } else {
            this.formTitle.textContent = 'Регистрация в Musicboard';
            this.submitBtn.textContent = 'Зарегистрироваться';
            this.switchText.textContent = 'Уже есть аккаунт?';
            this.switchMode.textContent = 'Войти';
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
            this.showError('Заполните все поля');
            return;
        }
        
        if (!this.isLoginMode && password !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return;
        }
        
        if (username.length < 2) {
            this.showError('Никнейм должен содержать минимум 2 символа');
            return;
        }
        
        if (password.length < 3) {
            this.showError('Пароль должен содержать минимум 3 символа');
            return;
        }
        
        this.submitBtn.disabled = true;
        this.submitBtn.textContent = 'Обработка...';
        
        const requestData = {
            action: this.isLoginMode ? 'login' : 'register',
            username: username,
            password: password
        };
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
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
                console.error('Ошибка парсинга JSON:', parseError);
                console.log('Сырой ответ:', responseText);
                this.showError('Сервер вернул некорректный ответ');
                return;
            }
            
            if (data.success) {
                if (this.isLoginMode) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    this.showSuccess('Вход выполнен успешно!');
                    
                    setTimeout(() => {
                        window.location.href = 'Home.html';
                    }, 1000);
                } else {
                    this.showSuccess('Регистрация прошла успешно! Теперь можете войти.');
                    this.isLoginMode = true;
                    this.updateUI();
                    this.form.reset();
                }
            } else {
                this.showError(data.message || 'Произошла ошибка');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Ошибка соединения с сервером');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = this.isLoginMode ? 'Войти' : 'Зарегистрироваться';
        }
    }
    
    checkCurrentUser() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            window.location.href = 'Home.html';
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