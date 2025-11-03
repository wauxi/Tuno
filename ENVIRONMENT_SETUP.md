# Musicboard 2.0 — настройка окружения

## Конфигурация

### Переменные окружения

Приложение автоматически определяет окружение по имени хоста:

- **Development**: `localhost`, `127.0.0.1`, `ms2`
- **Production**: любой другой хост

### Настройка URL API

Отредактируйте `js/config/environment.js`, чтобы задать URL API для разных окружений:

```javascript
const environmentConfig = {
    [ENV.DEVELOPMENT]: {
        API_BASE_URL: 'http://ms2/php',  // поменяйте для локальной разработки
        DEBUG_MODE: true,
        ENABLE_LOGGING: true,
    },
    [ENV.PRODUCTION]: {
        API_BASE_URL: '/php',  // URL для production
        DEBUG_MODE: false,
        ENABLE_LOGGING: false,
    }
};
```

### Конфигурация PHP

1. Скопируйте `php/config.example.php` в `php/config.php`
2. Обновите данные для подключения к базе данных:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'musicboard');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

3. При необходимости задайте ключ Last.fm (опционально, для обложек альбомов):

```bash
export LASTFM_API_KEY='your_lastfm_api_key'
```

## Константы и общие настройки

Все таймауты, время жизни кэша и «магические» числа вынесены в конфигурацию:

- `js/config/environment.js` — настройки, зависящие от окружения
- `js/config/constants.js` — общие константы приложения
- `js/config/stringConstants.js` — строковые константы

### Пример: изменение таймаутов

```javascript
// js/config/environment.js
export const TIMEOUTS = {
    API_REQUEST: 30000,      // 30 секунд
    ELEMENT_WAIT: 10000,     // 10 секунд
    SEARCH_DEBOUNCE: 300,    // 300 мс
};
```

### Пример: изменение TTL кэша

```javascript
export const CACHE_CONSTANTS = {
    USER_DATA_TTL: 3600000,    // 1 час
    COVER_TTL: 2592000000,     // 30 дней
};
```

## Фичи

- ✅ Конфигурация, основанная на окружении
- ✅ Централизованная обработка ошибок с логикой повторных попыток
- ✅ Корректные HTTP-коды ответов
- ✅ Магические числа заменены константами
- ✅ DRY-принцип для шаблонов
- ✅ Единообразное использование async/await
- ✅ Фолбэк на устаревший кэш при ошибках

## Разработка

```bash
# Запустить локальный PHP-сервер
php -S localhost:8000

# Или используйте XAMPP/WAMP с виртуальным хостом
```

## Деплой в продакшен

1. Обновите production URL в `environment.js`
2. Убедитесь, что `DEBUG_MODE: false` в продакшене
3. Правильно выставьте права на папку `uploads`
4. Настройте логирование ошибок PHP
