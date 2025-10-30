# 🔍 Code Review: Musicboard Project

**Дата:** 2025-06-17  
**Оценка:** 3/10  
**Статус:** Требует критических исправлений

---

## 🚨 КРИТИЧЕСКИЕ ПРОБЛЕМЫ БЕЗОПАСНОСТИ

### ❌ Проблема #1: Пароли хранятся в открытом виде
**Файл:** `php/auth-api.php:97`
```php
if ($user && $user['password'] === $inputPassword) {
```

**Описание:**  
Пароли сравниваются как обычные строки. В базе данных пароли хранятся в открытом виде без хеширования.

**Решение:**
```php
// 1. Миграция существующих паролей
// Создайте скрипт для хеширования всех паролей:

<?php
// migrate_passwords.php
require_once 'config.php';

$users = $pdo->query("SELECT id, password FROM users")->fetchAll();

foreach ($users as $user) {
    $hashedPassword = password_hash($user['password'], PASSWORD_ARGON2ID);
    $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->execute([$hashedPassword, $user['id']]);
}

echo "Passwords migrated successfully";
```

```php
// 2. Обновите auth-api.php:

// При регистрации:
$hashedPassword = password_hash($inputPassword, PASSWORD_ARGON2ID);
$insertQuery = "INSERT INTO users (username, display_name, password, role) VALUES (?, ?, ?, ?)";
$insertStmt->execute([$inputUsername, $inputUsername, $hashedPassword, 'user']);

// При входе:
if ($user && password_verify($inputPassword, $user['password'])) {
    // Вход успешен
}
```

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Время на исправление:** 1 час

---

### ❌ Проблема #2: Отсутствует HTTPS
**Файл:** `js/main.js:149`, `js/data-service.js:3`
```javascript
apiUrl: 'http://ms2/php/api.php',
```

**Описание:**  
Все запросы идут по HTTP. Данные, включая пароли, передаются в открытом виде.

**Решение:**
```apache
# 1. Настройте SSL сертификат (для локальной разработки - mkcert):

# Установите mkcert
choco install mkcert

# Создайте локальный CA
mkcert -install

# Создайте сертификат для вашего домена
mkcert ms2 localhost 127.0.0.1 ::1

# 2. Обновите Apache/Nginx конфигурацию:
# httpd.conf или nginx.conf

<VirtualHost *:443>
    ServerName ms2
    DocumentRoot "путь/к/musicboard_2"
    
    SSLEngine on
    SSLCertificateFile "путь/к/ms2.pem"
    SSLCertificateKeyFile "путь/к/ms2-key.pem"
</VirtualHost>

# 3. Обновите код:
```

```javascript
// config.js (создайте новый файл)
const API_BASE_URL = window.location.protocol === 'https:' 
    ? 'https://ms2/php' 
    : 'http://ms2/php';

export { API_BASE_URL };

// Используйте в коде:
import { API_BASE_URL } from './config.js';
apiUrl: `${API_BASE_URL}/api.php`
```

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Время на исправление:** 2 часа

---

### ❌ Проблема #3: SQL Injection потенциал
**Файл:** `php/api.php`, отсутствует валидация входных данных

**Описание:**  
Хотя используются prepared statements, нет валидации и санитизации входных данных.

**Решение:**
```php
// Создайте validator.php:

<?php
class InputValidator {
    public static function validateInteger($value, $min = null, $max = null) {
        $value = filter_var($value, FILTER_VALIDATE_INT);
        if ($value === false) {
            throw new InvalidArgumentException('Invalid integer value');
        }
        
        if ($min !== null && $value < $min) {
            throw new InvalidArgumentException("Value must be >= $min");
        }
        
        if ($max !== null && $value > $max) {
            throw new InvalidArgumentException("Value must be <= $max");
        }
        
        return $value;
    }
    
    public static function validateString($value, $maxLength = 255) {
        $value = trim($value);
        $value = filter_var($value, FILTER_SANITIZE_STRING);
        
        if (strlen($value) > $maxLength) {
            throw new InvalidArgumentException("String too long");
        }
        
        return $value;
    }
    
    public static function validateAlbumId($id) {
        return self::validateInteger($id, 1);
    }
    
    public static function validateUserId($id) {
        return self::validateInteger($id, 1);
    }
    
    public static function validateRating($rating) {
        return self::validateInteger($rating, 0, 10);
    }
}
```

```php
// Используйте в api.php:
require_once 'validator.php';

try {
    $albumId = InputValidator::validateAlbumId($_POST['album_id']);
    $userId = InputValidator::validateUserId($_POST['user_id']);
    $rating = InputValidator::validateRating($_POST['rating']);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}
```

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Время на исправление:** 3 часа

---

### ❌ Проблема #4: Пустой пароль базы данных
**Файл:** `php/config.php:4`
```php
define('DB_PASS', '');
```

**Описание:**  
Root доступ с пустым паролем - прямой путь к взлому.

**Решение:**
```php
// 1. Создайте файл .env (добавьте в .gitignore!):
DB_HOST=localhost
DB_NAME=musicboard
DB_USER=musicboard_user
DB_PASS=ваш_сложный_пароль_тут_123!@#

// 2. Установите vlucas/phpdotenv:
composer require vlucas/phpdotenv

// 3. Обновите config.php:
<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

define('DB_HOST', $_ENV['DB_HOST']);
define('DB_NAME', $_ENV['DB_NAME']);
define('DB_USER', $_ENV['DB_USER']);
define('DB_PASS', $_ENV['DB_PASS']);

// 4. Создайте нового пользователя MySQL:
```

```sql
CREATE USER 'musicboard_user'@'localhost' IDENTIFIED BY 'ваш_сложный_пароль';
GRANT SELECT, INSERT, UPDATE, DELETE ON musicboard.* TO 'musicboard_user'@'localhost';
FLUSH PRIVILEGES;
```

**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Время на исправление:** 1 час

---

## 🔥 АРХИТЕКТУРНЫЕ ПРОБЛЕМЫ

### ❌ Проблема #5: God Object антипаттерн
**Файл:** `js/main.js` (523 строки в одном классе)

**Описание:**  
Класс MusicboardApp делает ВСЁ: управление UI, аутентификацию, навигацию, работу с API.

**Решение:**
```javascript
// Разбейте на модули:

// js/services/AuthService.js
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
    
    async login(username, password) { /* ... */ }
    async logout() { /* ... */ }
    isAdmin() { return this.currentUser?.role === 'admin'; }
}

// js/services/UserService.js
export class UserService {
    async loadUsers() { /* ... */ }
    getUserById(id) { /* ... */ }
    getUserNameById(id) { /* ... */ }
}

// js/components/UIManager.js
export class UIManager {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
    }
    
    updateAuthUI() { /* ... */ }
    updateProfileUI() { /* ... */ }
}

// js/main.js (новый, упрощенный)
import { AuthService } from './services/AuthService.js';
import { UserService } from './services/UserService.js';
import { UIManager } from './components/UIManager.js';
import { Navigation } from './navigation.js';
import { DataService } from './data-service.js';

class MusicboardApp {
    constructor() {
        this.authService = new AuthService();
        this.userService = new UserService();
        this.uiManager = new UIManager(this.authService, this.userService);
        this.dataService = null;
        
        this.init();
    }
    
    async init() {
        await this.authService.checkAuth();
        await this.userService.loadUsers();
        this.uiManager.updateUI();
        new Navigation();
        this.initDataServices();
    }
    
    initDataServices() { /* ... */ }
}

new MusicboardApp();
```

**Приоритет:** 🟠 ВЫСОКИЙ  
**Время на исправление:** 8 часов

---

### ❌ Проблема #6: Дублирование кода подключения к БД
**Файлы:** `php/api.php:15-20`, `php/auth-api.php:15-20`, `php/ratings-api.php:10-15`

**Описание:**  
Один и тот же код подключения к БД скопирован в три файла.

**Решение:**
```php
// php/Database.php (создайте новый файл):
<?php
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $this->connection = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch(PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Предотвращаем клонирование
    private function __clone() {}
    
    // Предотвращаем десериализацию
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
```

```php
// Используйте во всех файлах:
require_once 'config.php';
require_once 'Database.php';

$pdo = Database::getInstance()->getConnection();
```

**Приоритет:** 🟠 ВЫСОКИЙ  
**Время на исправление:** 2 часа

---

### ❌ Проблема #7: HTML в JavaScript строках
**Файл:** `js/rating-manager.js:123-210` (90 строк HTML)

**Описание:**  
Огромные HTML шаблоны в template literals. Сложно поддерживать и изменять.

**Решение:**
```javascript
// Вариант 1: Используйте Web Components

// js/components/RatingModal.js
class RatingModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                /* Стили компонента */
            </style>
            <div class="rating-modal">
                <!-- Разметка -->
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // События
    }
}

customElements.define('rating-modal', RatingModal);

// Использование:
const modal = document.createElement('rating-modal');
modal.setAttribute('album-id', albumId);
document.body.appendChild(modal);
```

```javascript
// Вариант 2: Шаблон в HTML

<!-- Home.html -->
<template id="rating-modal-template">
    <div class="rating-modal">
        <div class="rating-modal__overlay"></div>
        <div class="rating-modal__content">
            <!-- Разметка -->
        </div>
    </div>
</template>

// js/rating-manager.js
showRatingModal(albumData, existingRating) {
    const template = document.getElementById('rating-modal-template');
    const clone = template.content.cloneNode(true);
    
    // Заполните данные
    clone.querySelector('.album-name').textContent = albumData.album_name;
    // ...
    
    document.body.appendChild(clone);
}
```

```javascript
// Вариант 3: Используйте простой шаблонизатор Mustache

// npm install mustache
import Mustache from 'mustache';

const template = `
<div class="rating-modal">
    <h3>{{title}}</h3>
    <img src="{{coverUrl}}" alt="{{albumName}}">
    <p>{{artist}}</p>
</div>
`;

const html = Mustache.render(template, {
    title: isEdit ? 'Edit Review' : 'Review',
    coverUrl: albumData.coverUrl,
    albumName: albumData.album_name,
    artist: albumData.artist
});
```

**Приоритет:** 🟠 ВЫСОКИЙ  
**Время на исправление:** 6 часов

---

### ❌ Проблема #8: Отсутствие обработки ошибок
**Файл:** `js/main.js:422`, `js/data-service.js:78`

**Описание:**  
Пустые catch блоки или просто console.error. Пользователь не видит ошибок.

**Решение:**
```javascript
// js/utils/ErrorHandler.js
export class ErrorHandler {
    static showError(message, error = null) {
        // Логируем для разработки
        if (error) {
            console.error('Error details:', error);
        }
        
        // Показываем пользователю
        this.showNotification({
            type: 'error',
            message: message,
            duration: 5000
        });
    }
    
    static showSuccess(message) {
        this.showNotification({
            type: 'success',
            message: message,
            duration: 3000
        });
    }
    
    static showNotification({ type, message, duration }) {
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span class="notification__icon">${type === 'error' ? '⚠️' : '✓'}</span>
            <span class="notification__message">${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('notification--visible');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('notification--visible');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    static async handleApiError(error) {
        if (error.response) {
            // Ошибка от сервера
            const status = error.response.status;
            const data = await error.response.json();
            
            switch (status) {
                case 400:
                    this.showError('Некорректные данные: ' + (data.message || ''));
                    break;
                case 401:
                    this.showError('Требуется авторизация');
                    window.location.href = '/login.html';
                    break;
                case 403:
                    this.showError('Доступ запрещен');
                    break;
                case 404:
                    this.showError('Ресурс не найден');
                    break;
                case 500:
                    this.showError('Ошибка сервера. Попробуйте позже.');
                    break;
                default:
                    this.showError('Произошла ошибка');
            }
        } else if (error.request) {
            // Нет ответа от сервера
            this.showError('Нет связи с сервером. Проверьте подключение.');
        } else {
            // Другая ошибка
            this.showError('Произошла ошибка: ' + error.message);
        }
    }
}

// Используйте в коде:
import { ErrorHandler } from './utils/ErrorHandler.js';

try {
    await this.dataService.loadData();
} catch (error) {
    ErrorHandler.handleApiError(error);
}
```

```css
/* Добавьте стили для уведомлений */
.notification {
    position: fixed;
    top: 20px;
    right: -400px;
    max-width: 400px;
    padding: 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    transition: right 0.3s ease;
    z-index: 10000;
}

.notification--visible {
    right: 20px;
}

.notification--error {
    border-left: 4px solid #ff4444;
}

.notification--success {
    border-left: 4px solid #44ff44;
}
```

**Приоритет:** 🟠 ВЫСОКИЙ  
**Время на исправление:** 4 часа

---

## ⚠️ ВАЖНЫЕ ПРОБЛЕМЫ

### ❌ Проблема #9: Глобальные переменные
**Файл:** `js/main.js:506-520`

**Описание:**  
Три глобальных переменных загрязняют namespace.

**Решение:**
```javascript
// Используйте паттерн Module или EventBus

// js/utils/EventBus.js
export class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

// Создайте один экземпляр
export const eventBus = new EventBus();

// Используйте вместо глобальных переменных:
import { eventBus } from './utils/EventBus.js';

// Вместо window.musicboardApp.switchUser()
eventBus.emit('user:switch', { userId: 123 });

// Подписка на события
eventBus.on('user:switch', (data) => {
    console.log('Switching to user', data.userId);
});
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 3 часа

---

### ❌ Проблема #10: Магические числа и хардкод
**Файлы:** `js/data-service.js:3`, `js/main.js:29`

**Описание:**  
Захардкоженные значения без объяснения.

**Решение:**
```javascript
// js/config/constants.js
export const CONFIG = {
    API: {
        BASE_URL: 'https://ms2/php',
        ENDPOINTS: {
            MAIN: '/api.php',
            AUTH: '/auth-api.php',
            RATINGS: '/ratings-api.php',
        },
        TIMEOUT: 30000, // 30 секунд
    },
    
    CACHE: {
        LIFETIME: 60 * 60 * 1000, // 1 час в миллисекундах
        KEYS: {
            RECENT_ACTIVITY: 'recentActivity',
            LISTEN_LATER: 'listenLater',
            ALBUMS: 'albums',
        }
    },
    
    DEFAULTS: {
        USER_ID: 1, // Гостевой пользователь
        ITEMS_PER_PAGE: 20,
    },
    
    UI: {
        SEARCH_DEBOUNCE: 300, // мс
        NOTIFICATION_DURATION: 5000, // мс
        ANIMATION_DURATION: 300, // мс
    }
};

// Используйте:
import { CONFIG } from './config/constants.js';

this.viewingUserId = this.getUserIdFromUrl() || 
                     this.currentUser?.id || 
                     CONFIG.DEFAULTS.USER_ID;

cacheLifetime: CONFIG.CACHE.LIFETIME;
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 2 часа

---

### ❌ Проблема #11: Inline стили и onclick
**Файлы:** `login.html:8-102`, `Home.html:92`

**Описание:**  
Стили в HTML и inline event handlers.

**Решение:**
```html
<!-- БЫЛО: -->
<style>
    .auth-container {
        display: flex;
        /* ... 95 строк */
    }
</style>

<!-- СТАЛО: -->
<link rel="stylesheet" href="css/pages/login.css">
```

```scss
// css/pages/login.scss
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: var(--color-dark);
}

.auth-form {
    background: var(--color-dark-alt);
    padding: 2rem;
    border-radius: var(--border-radius);
    border: var(--border);
    width: 100%;
    max-width: 400px;
}
```

```html
<!-- БЫЛО: -->
<button onclick="musicboardApp.logout()">Выйти</button>

<!-- СТАЛО: -->
<button class="navigation__logout-btn" data-action="logout">Выйти</button>
```

```javascript
// В navigation.js или main.js:
document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('[data-action="logout"]');
    if (logoutBtn) {
        e.preventDefault();
        this.handleLogout();
    }
});
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 2 часа

---

### ❌ Проблема #12: Race conditions с setTimeout
**Файлы:** `js/main.js:179`, `js/auth.js:24`

**Описание:**  
Произвольные задержки могут вызвать race conditions.

**Решение:**
```javascript
// Вместо setTimeout используйте Promise и async/await

// БЫЛО:
setTimeout(() => {
    this.checkCurrentUser();
}, 100);

// СТАЛО:
async init() {
    await this.checkCurrentUser();
    // Продолжаем после проверки
}

// БЫЛО:
setTimeout(() => {
    this.initAlbumMenus();
}, 1000);

// СТАЛО:
async loadData() {
    await this.dataService.loadData(true);
    
    if (this.recentlyGrid) this.recentlyGrid.render();
    if (this.listenLaterGrid) this.listenLaterGrid.render();
    
    // Ждем следующего кадра анимации
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    this.initAlbumMenus();
}

// Если нужно дождаться DOM:
async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

// Использование:
const albumMenu = await this.waitForElement('.album-menu');
this.initAlbumMenus();
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 3 часа

---

### ❌ Проблема #13: Клонирование DOM элементов
**Файл:** `js/main.js:191`

**Описание:**  
Клонирование вместо правильного управления событиями.

**Решение:**
```javascript
// БЫЛО:
const newMenu = menu.cloneNode(true);
menu.parentNode.replaceChild(newMenu, menu);

// СТАЛО - используйте Event Delegation:

class AlbumMenuManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Один обработчик на весь документ
        document.addEventListener('click', this.handleClick.bind(this));
    }
    
    handleClick(e) {
        // Обработка клика на триггер меню
        const trigger = e.target.closest('.album-menu__trigger');
        if (trigger) {
            e.stopPropagation();
            this.toggleMenu(trigger);
            return;
        }
        
        // Обработка клика на пункт меню
        const menuItem = e.target.closest('.album-menu__item');
        if (menuItem) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = menuItem.dataset.action;
            const albumElement = menuItem.closest('[data-album-id]');
            
            this.handleMenuAction(action, albumElement);
            this.closeAllMenus();
            return;
        }
        
        // Закрываем меню при клике вне его
        this.closeAllMenus();
    }
    
    toggleMenu(trigger) {
        const menu = trigger.closest('.album-menu');
        const dropdown = menu.querySelector('.album-menu__dropdown');
        const isOpen = dropdown.classList.contains('album-menu__dropdown--open');
        
        // Закрываем все другие меню
        this.closeAllMenus();
        
        // Открываем/закрываем текущее
        if (!isOpen) {
            dropdown.classList.add('album-menu__dropdown--open');
        }
    }
    
    closeAllMenus() {
        document.querySelectorAll('.album-menu__dropdown--open')
            .forEach(dropdown => {
                dropdown.classList.remove('album-menu__dropdown--open');
            });
    }
    
    handleMenuAction(action, albumElement) {
        const albumId = parseInt(albumElement.dataset.albumId);
        
        switch (action) {
            case 'write-review':
                this.handleWriteReview(albumId, albumElement);
                break;
            case 'remove-listen-later':
                this.handleRemove(albumId, albumElement);
                break;
            case 'go-to-album':
                this.handleGoToAlbum(albumElement);
                break;
        }
    }
    
    // ... остальные методы
}

// Создайте один экземпляр:
const albumMenuManager = new AlbumMenuManager();
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 4 часа

---

### ❌ Проблема #14: Тестовые данные в схеме БД
**Файл:** `musicboard.sql` (2700+ строк)

**Описание:**  
Схема БД смешана с тестовыми данными. 512 альбомов и 855 рейтингов в dump файле.

**Решение:**
```sql
-- Разделите на два файла:

-- 1. schema.sql (только структура):
CREATE TABLE `albums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `artist` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `album_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `genre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spotify_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `artist` (`artist`,`album_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `album_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `listened_date` date DEFAULT NULL,
  `favorite_song` text COLLATE utf8mb4_unicode_ci,
  `least_favorite_song` text COLLATE utf8mb4_unicode_ci,
  `must_listen` tinyint(1) DEFAULT NULL,
  `would_relisten` tinyint(1) DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `review` text COLLATE utf8mb4_unicode_ci,
  `sheet_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `album_id` (`album_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`),
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. seeds.sql (тестовые данные):
INSERT INTO `users` (`id`, `username`, `display_name`, `password`, `role`) VALUES
(1, 'testuser1', 'Test User 1', '$argon2id$...', 'user'),
(2, 'testuser2', 'Test User 2', '$argon2id$...', 'user'),
(3, 'admin', 'Admin', '$argon2id$...', 'admin');

-- Минимальный набор тестовых альбомов
INSERT INTO `albums` (`artist`, `album_name`, `genre`, `spotify_link`) VALUES
('The Beatles', 'Abbey Road', 'rock', 'https://open.spotify.com/album/...'),
('Pink Floyd', 'The Dark Side of the Moon', 'rock', 'https://open.spotify.com/album/...');

-- 3. Создайте скрипты миграции:
-- migrations/001_create_tables.sql
-- migrations/002_add_cache_table.sql
-- и т.д.
```

```php
// Создайте простой миграционный скрипт:
// migrations/migrate.php

<?php
require_once '../php/config.php';
require_once '../php/Database.php';

$db = Database::getInstance()->getConnection();

$migrationsDir = __DIR__;
$migrations = glob($migrationsDir . '/*.sql');
sort($migrations);

foreach ($migrations as $migration) {
    echo "Running migration: " . basename($migration) . "\n";
    $sql = file_get_contents($migration);
    $db->exec($sql);
    echo "✓ Completed\n";
}

echo "\nAll migrations completed successfully!\n";
```

**Приоритет:** 🟡 СРЕДНИЙ  
**Время на исправление:** 2 часа

---

## 💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ

### ✅ Улучшение #1: Добавьте TypeScript
**Текущая ситуация:** Чистый JavaScript без типизации

**Решение:**
```bash
# Установите TypeScript
npm init -y
npm install --save-dev typescript @types/node

# Создайте tsconfig.json:
npx tsc --init
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

```typescript
// Переименуйте файлы .js в .ts и добавьте типы:

// src/types/index.ts
export interface User {
    id: number;
    username: string;
    display_name: string;
    role: 'user' | 'admin';
}

export interface Album {
    id: number;
    artist: string;
    album_name: string;
    genre?: string;
    spotify_link?: string;
    coverUrl?: string;
}

export interface Rating {
    id?: number;
    album_id: number;
    user_id: number;
    rating: number;
    listened_date?: string;
    favorite_song?: string;
    least_favorite_song?: string;
    must_listen?: boolean;
    would_relisten?: boolean;
    review?: string;
}

// src/services/AuthService.ts
import { User } from '../types';

export class AuthService {
    private currentUser: User | null = null;
    private isLoggedIn: boolean = false;
    
    async login(username: string, password: string): Promise<User> {
        // ...
    }
    
    getCurrentUser(): User | null {
        return this.currentUser;
    }
}
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 12 часов

---

### ✅ Улучшение #2: Используйте фреймворк
**Текущая ситуация:** Vanilla JS с ручным управлением DOM

**Решение:**
```bash
# Вариант 1: Vue.js (легче всего интегрировать)
npm install vue@3

# Вариант 2: React (более популярный)
npx create-react-app musicboard-app --template typescript

# Вариант 3: Svelte (самый легковесный)
npm create vite@latest musicboard-app -- --template svelte-ts
```

```vue
<!-- Пример с Vue.js -->
<!-- components/AlbumCard.vue -->
<template>
  <li class="album-card" :data-album-id="album.id">
    <img 
      :src="album.coverUrl" 
      :alt="album.album_name"
      class="album-card__cover"
      @error="handleImageError"
    />
    <div class="album-card__info">
      <h3>{{ album.album_name }}</h3>
      <p>{{ album.artist }}</p>
      <div class="album-card__rating">
        <StarRating :rating="album.rating" />
      </div>
    </div>
    <AlbumMenu 
      :album="album" 
      @write-review="$emit('write-review', album)"
      @remove="$emit('remove', album.id)"
    />
  </li>
</template>

<script setup lang="ts">
import { Album } from '@/types';
import StarRating from './StarRating.vue';
import AlbumMenu from './AlbumMenu.vue';

interface Props {
  album: Album;
}

const props = defineProps<Props>();

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = 'https://via.placeholder.com/150x150/333/666?text=No+Image';
};
</script>
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 40+ часов (полный рефакторинг)

---

### ✅ Улучшение #3: Добавьте тесты
**Текущая ситуация:** Нет тестов

**Решение:**
```bash
# Установите Jest для тестов
npm install --save-dev jest @types/jest ts-jest

# Создайте конфигурацию:
npx ts-jest config:init
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};
```

```typescript
// tests/services/AuthService.test.ts
import { AuthService } from '../../src/services/AuthService';

describe('AuthService', () => {
    let authService: AuthService;
    
    beforeEach(() => {
        authService = new AuthService();
        localStorage.clear();
    });
    
    describe('checkAuth', () => {
        it('should set isLoggedIn to true if valid user data exists', () => {
            const userData = {
                id: 1,
                username: 'testuser',
                display_name: 'Test User',
                role: 'user'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userData));
            authService.checkAuth();
            
            expect(authService.isLoggedIn).toBe(true);
            expect(authService.getCurrentUser()).toEqual(userData);
        });
        
        it('should logout if user data is invalid JSON', () => {
            localStorage.setItem('currentUser', 'invalid json');
            authService.checkAuth();
            
            expect(authService.isLoggedIn).toBe(false);
            expect(localStorage.getItem('currentUser')).toBeNull();
        });
    });
    
    describe('isAdmin', () => {
        it('should return true for admin users', () => {
            authService.currentUser = {
                id: 1,
                username: 'admin',
                display_name: 'Admin',
                role: 'admin'
            };
            
            expect(authService.isAdmin()).toBe(true);
        });
        
        it('should return false for regular users', () => {
            authService.currentUser = {
                id: 2,
                username: 'user',
                display_name: 'User',
                role: 'user'
            };
            
            expect(authService.isAdmin()).toBe(false);
        });
    });
});
```

```php
// Для PHP используйте PHPUnit
// composer require --dev phpunit/phpunit

// tests/DatabaseTest.php
<?php
use PHPUnit\Framework\TestCase;

class DatabaseTest extends TestCase {
    private $db;
    
    protected function setUp(): void {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function testCanConnectToDatabase() {
        $this->assertNotNull($this->db);
        $this->assertInstanceOf(PDO::class, $this->db);
    }
    
    public function testCanQueryUsers() {
        $stmt = $this->db->query("SELECT COUNT(*) FROM users");
        $count = $stmt->fetchColumn();
        
        $this->assertGreaterThan(0, $count);
    }
}
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 20+ часов

---

### ✅ Улучшение #4: API Versioning
**Текущая ситуация:** Нет версионирования API

**Решение:**
```php
// Реорганизуйте структуру:
// php/
//   v1/
//     api.php
//     auth.php
//     ratings.php
//   v2/  (для будущих версий)
//   Router.php

// php/Router.php
<?php
class Router {
    private $routes = [];
    
    public function addRoute($method, $path, $handler) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                call_user_func($route['handler']);
                return;
            }
        }
        
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
    }
    
    private function matchPath($pattern, $path) {
        return preg_match('#^' . $pattern . '$#', $path);
    }
}

// php/v1/index.php
<?php
require_once '../Router.php';
require_once '../Database.php';
require_once 'controllers/AlbumsController.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/RatingsController.php';

$router = new Router();

// API v1 routes
$router->addRoute('GET', '/api/v1/albums', function() {
    $controller = new AlbumsController();
    $controller->index();
});

$router->addRoute('GET', '/api/v1/albums/(\d+)', function($id) {
    $controller = new AlbumsController();
    $controller->show($id);
});

$router->addRoute('POST', '/api/v1/auth/login', function() {
    $controller = new AuthController();
    $controller->login();
});

$router->addRoute('POST', '/api/v1/ratings', function() {
    $controller = new RatingsController();
    $controller->create();
});

$router->handleRequest();
```

```javascript
// js/config/api.js
export const API_VERSION = 'v1';
export const API_BASE = `https://ms2/api/${API_VERSION}`;

export const ENDPOINTS = {
    ALBUMS: `${API_BASE}/albums`,
    AUTH: `${API_BASE}/auth`,
    RATINGS: `${API_BASE}/ratings`,
};
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 8 часов

---

### ✅ Улучшение #5: Настройте линтеры
**Текущая ситуация:** Нет проверки кода

**Решение:**
```bash
# ESLint для JavaScript/TypeScript
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Prettier для форматирования
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

# PHP CS Fixer для PHP
composer require --dev friendsofphp/php-cs-fixer
```

```json
// .eslintrc.json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

```php
// .php-cs-fixer.php
<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/php')
    ->name('*.php');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        'array_syntax' => ['syntax' => 'short'],
        'no_unused_imports' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
    ])
    ->setFinder($finder);
```

```json
// package.json - добавьте scripts:
{
  "scripts": {
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{ts,js,json}\"",
    "php-cs-fix": "php-cs-fixer fix"
  }
}
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 3 часа

---

### ✅ Улучшение #6: CI/CD Pipeline
**Текущая ситуация:** Ручной деплой

**Решение:**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
  php-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.1'
        
    - name: Install Composer dependencies
      run: composer install
      
    - name: Run PHP CS Fixer
      run: composer run-script php-cs-fix -- --dry-run
      
    - name: Run PHPUnit tests
      run: vendor/bin/phpunit
```

**Приоритет:** 🔵 ЖЕЛАТЕЛЬНО  
**Время на исправление:** 4 часа

---

## 📋 ЧЕКЛИСТ ИСПРАВЛЕНИЙ

### 🔴 Критические (Сделать немедленно):
- [ ] Хешировать пароли (bcrypt/Argon2)
- [ ] Настроить HTTPS
- [ ] Добавить валидацию входных данных
- [ ] Установить пароль для БД
- [ ] Исправить обработку ошибок

### 🟠 Высокие (На этой неделе):
- [ ] Разбить main.js на модули
- [ ] Создать единый Database.php
- [ ] Вынести HTML из JavaScript
- [ ] Убрать глобальные переменные
- [ ] Убрать магические числа

### 🟡 Средние (В течение месяца):
- [ ] Убрать inline стили и onclick
- [ ] Исправить race conditions
- [ ] Использовать Event Delegation
- [ ] Разделить схему БД и данные
- [ ] Унифицировать язык ошибок

### 🔵 Желательные (Когда будет время):
- [ ] Добавить TypeScript
- [ ] Внедрить фреймворк (Vue/React)
- [ ] Написать тесты
- [ ] Настроить API versioning
- [ ] Настроить линтеры
- [ ] Создать CI/CD pipeline

---

## 📊 ОЦЕНКА ВРЕМЕНИ

| Приоритет | Задач | Примерное время |
|-----------|-------|-----------------|
| 🔴 Критические | 5 | 8-12 часов |
| 🟠 Высокие | 5 | 20-25 часов |
| 🟡 Средние | 5 | 15-20 часов |
| 🔵 Желательные | 6 | 80+ часов |
| **ИТОГО** | **21** | **123-137+ часов** |

---

## 🎯 РЕКОМЕНДУЕМЫЙ ПОРЯДОК ДЕЙСТВИЙ

### Неделя 1: Безопасность
1. День 1: Хеширование паролей
2. День 2: HTTPS + валидация
3. День 3: Пароль БД + обработка ошибок

### Неделя 2: Архитектура
4. День 1-2: Разбить main.js на модули
5. День 3: Единый Database.php
6. День 4: Вынести HTML из JS

### Неделя 3-4: Улучшения
7. Убрать глобальные переменные
8. Исправить race conditions
9. Event Delegation
10. Константы вместо магических чисел

### Месяц 2+: Модернизация
11. TypeScript
12. Фреймворк
13. Тесты
14. CI/CD

---

## 💡 ПОЛЕЗНЫЕ РЕСУРСЫ

### Безопасность:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PHP Password Hashing](https://www.php.net/manual/en/function.password-hash.php)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)

### Архитектура:
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [PHP: The Right Way](https://phptherightway.com/)
- [Design Patterns](https://refactoring.guru/design-patterns)

### TypeScript:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Тестирование:
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)

---

## 🤝 ЗАКЛЮЧЕНИЕ

Проект имеет **серьезные проблемы с безопасностью** и архитектурой, но он **работает** и имеет **потенциал**.

**Главные выводы:**
1. ✅ Есть базовая функциональность
2. ✅ Используются современные технологии (ES6, SCSS)
3. ❌ Критические дыры в безопасности
4. ❌ Плохая архитектура кода
5. ❌ Отсутствие тестов и автоматизации

**Следующий шаг:** Начните с критических исправлений (безопасность), затем постепенно улучшайте архитектуру.

**Удачи в рефакторинге! 🚀**

---

*Документ создан: 2025-06-17*  
*Последнее обновление: 2025-06-17*
