# 🎵 Гибридная система кэширования обложек - ГОТОВО ✅

## Что было сделано

✅ **CoverService.php** - Основной класс с гибридной логикой  
✅ **covers-api.php** - API для админа (upload, delete, refresh)  
✅ **api.php** - Обновлён для использования CoverService  
✅ **БД** - Добавлена колонка `source`  
✅ **Last.fm API Key** - Настроен и работает

---

## 🚀 Как это работает

### Приоритет источников обложек:

```
1️⃣ MANUAL (загружено админом) → БЕЗ TTL, приоритет максимальный
2️⃣ SPOTIFY (из Spotify API)   → 6 часов кэш
3️⃣ LASTFM (из Last.fm API)    → 6 часов кэш
4️⃣ PLACEHOLDER (если ничего)  → via.placeholder.com
```

---

## 📋 Быстрый старт

### Last.fm уже настроен ✅

API Key добавлен в `php/config.php`

Система автоматически получит обложки для альбомов без Spotify ссылок!

---

## 🔌 API для админа - ПОДРОБНАЯ ИНСТРУКЦИЯ

### 1️⃣ ЗАГРУЗИТЬ СВОЮ ОБЛОЖКУ

#### Способ A: Через HTML форму (простой)

Создайте HTML форму в админ-панели:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Загрузка обложки</title>
    <style>
        .upload-form {
            max-width: 500px;
            margin: 50px auto;
            padding: 30px;
            border: 2px solid #ccc;
            border-radius: 10px;
            background: #f9f9f9;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"],
        input[type="file"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            background: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #45a049;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="upload-form">
        <h2>🎵 Загрузка обложки альбома</h2>
        
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="album_id">ID альбома:</label>
                <input type="text" id="album_id" name="album_id" required 
                       placeholder="Например: 72">
                <small>Найдите ID альбома в БД или в URL сайта</small>
            </div>
            
            <div class="form-group">
                <label for="cover">Выберите изображение:</label>
                <input type="file" id="cover" name="cover" required 
                       accept="image/jpeg,image/png,image/webp">
                <small>Форматы: JPG, PNG, WebP. Максимум: 5MB</small>
            </div>
            
            <button type="submit">📤 Загрузить обложку</button>
        </form>
        
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('action', 'upload');
            formData.append('album_id', document.getElementById('album_id').value);
            formData.append('cover', document.getElementById('cover').files[0]);
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '⏳ Загрузка...';
            
            try {
                const response = await fetch('http://ms2/php/covers-api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        ✅ ${result.message}<br>
                        📁 Путь: ${result.cover_url}<br>
                        <small>Обновите страницу сайта чтобы увидеть обложку</small>
                    `;
                    document.getElementById('uploadForm').reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `❌ Ошибка: ${result.error}`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Ошибка сети: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

**Как использовать:**
1. Сохраните этот HTML как `upload-cover.html` в корне сайта
2. Откройте `http://ms2/upload-cover.html`
3. Введите ID альбома (например: 72)
4. Выберите изображение
5. Нажмите "Загрузить обложку"
6. Обновите главную страницу - обложка появится! ✨

---

#### Способ B: Через cURL (командная строка)

```bash
# Загрузить обложку для альбома ID=72
curl -X POST http://ms2/php/covers-api.php \
  -F "action=upload" \
  -F "album_id=72" \
  -F "cover=@/path/to/harvest_cover.jpg"
```

**Где взять изображение:**
1. Google Images → "Neil Young Harvest album cover"
2. Скачайте изображение (ПКМ → Сохранить как)
3. Укажите путь в команде выше

---

#### Способ C: Через Postman

1. Откройте Postman
2. Создайте новый запрос:
   - **Method:** POST
   - **URL:** `http://ms2/php/covers-api.php`
3. В разделе **Body** выберите `form-data`
4. Добавьте поля:
   - `action` = `upload` (Text)
   - `album_id` = `72` (Text)
   - `cover` = выберите файл (File)
5. Нажмите **Send**

**Ответ:**
```json
{
  "success": true,
  "cover_url": "uploads/covers/album_72_1730489234.jpg",
  "message": "Обложка загружена"
}
```

---

### 2️⃣ УДАЛИТЬ ОБЛОЖКУ

#### Способ A: Через HTML форму

```html
<!DOCTYPE html>
<html>
<head>
    <title>Удаление обложки</title>
    <style>
        .delete-form {
            max-width: 500px;
            margin: 50px auto;
            padding: 30px;
            border: 2px solid #dc3545;
            border-radius: 10px;
            background: #fff5f5;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            background: #dc3545;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #c82333;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            padding: 10px;
            margin-bottom: 15px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="delete-form">
        <h2>🗑️ Удаление обложки альбома</h2>
        
        <div class="warning">
            ⚠️ <strong>Внимание!</strong> Это удалит обложку из БД и файл с сервера (если загружена вручную).
        </div>
        
        <form id="deleteForm">
            <div class="form-group">
                <label for="album_id">ID альбома:</label>
                <input type="text" id="album_id" name="album_id" required 
                       placeholder="Например: 72">
                <small>Обложка из Spotify/Last.fm будет загружена заново</small>
            </div>
            
            <button type="submit">🗑️ Удалить обложку</button>
        </form>
        
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('deleteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const albumId = document.getElementById('album_id').value;
            
            if (!confirm(`Вы уверены, что хотите удалить обложку для альбома ID ${albumId}?`)) {
                return;
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '⏳ Удаление...';
            
            try {
                const response = await fetch('http://ms2/php/covers-api.php', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ album_id: parseInt(albumId) })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        ✅ ${result.message}<br>
                        <small>Обновите страницу. Если у альбома есть Spotify ссылка, 
                        обложка загрузится автоматически.</small>
                    `;
                    document.getElementById('deleteForm').reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `❌ Ошибка: ${result.error}`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Ошибка сети: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

**Как использовать:**
1. Сохраните как `delete-cover.html`
2. Откройте `http://ms2/delete-cover.html`
3. Введите ID альбома
4. Подтвердите удаление
5. Готово! Обложка удалена

---

#### Способ B: Через cURL

```bash
# Удалить обложку для альбома ID=72
curl -X DELETE http://ms2/php/covers-api.php \
  -H "Content-Type: application/json" \
  -d '{"album_id": 72}'
```

---

#### Способ C: Через JavaScript консоль браузера

```javascript
// Откройте DevTools (F12) → Console
// Вставьте и выполните:

fetch('http://ms2/php/covers-api.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ album_id: 72 })
})
.then(res => res.json())
.then(data => console.log(data));
```

---

### 3️⃣ ОЧИСТИТЬ КЭШ

#### Что делает очистка кэша:
- ❌ Удаляет обложки из **Spotify** и **Last.fm** (они перезагрузятся)
- ✅ **НЕ** удаляет ваши загруженные обложки (source=manual)

#### Способ A: Через HTML форму

```html
<!DOCTYPE html>
<html>
<head>
    <title>Очистка кэша</title>
    <style>
        .cache-form {
            max-width: 600px;
            margin: 50px auto;
            padding: 30px;
            border: 2px solid #ffc107;
            border-radius: 10px;
            background: #fffbf0;
        }
        .option {
            background: white;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .option h3 {
            margin-top: 0;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        button {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
        }
        .btn-single {
            background: #ffc107;
            color: #333;
        }
        .btn-single:hover {
            background: #ffb300;
        }
        .btn-all {
            background: #dc3545;
            color: white;
        }
        .btn-all:hover {
            background: #c82333;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            border-radius: 5px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="cache-form">
        <h2>🔄 Очистка кэша обложек</h2>
        
        <div class="info">
            ℹ️ <strong>Важно:</strong> Очистка кэша НЕ удалит обложки, 
            которые вы загрузили вручную. Удаляются только обложки из Spotify и Last.fm.
        </div>
        
        <!-- Вариант 1: Очистить для одного альбома -->
        <div class="option">
            <h3>1️⃣ Очистить для одного альбома</h3>
            <p>Удалит кэш для конкретного альбома. Обложка перезагрузится из Spotify/Last.fm.</p>
            
            <form id="singleForm">
                <div class="form-group">
                    <label for="album_id">ID альбома:</label>
                    <input type="text" id="album_id" name="album_id" required 
                           placeholder="Например: 72">
                </div>
                <button type="submit" class="btn-single">🔄 Очистить кэш альбома</button>
            </form>
        </div>
        
        <!-- Вариант 2: Очистить весь кэш -->
        <div class="option">
            <h3>2️⃣ Очистить весь кэш</h3>
            <p><strong>⚠️ Внимание!</strong> Удалит кэш для ВСЕХ альбомов (кроме загруженных вручную).</p>
            
            <form id="allForm">
                <button type="submit" class="btn-all">🗑️ Очистить весь кэш</button>
            </form>
        </div>
        
        <div id="result"></div>
    </div>

    <script>
        // Очистить для одного альбома
        document.getElementById('singleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const albumId = document.getElementById('album_id').value;
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '⏳ Очистка кэша...';
            
            try {
                const formData = new FormData();
                formData.append('action', 'refresh_cache');
                formData.append('album_id', albumId);
                
                const response = await fetch('http://ms2/php/covers-api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        ✅ ${result.message}<br>
                        <small>Обновите страницу. Обложка перезагрузится из Spotify/Last.fm.</small>
                    `;
                    document.getElementById('singleForm').reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `❌ Ошибка: ${result.error}`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Ошибка сети: ${error.message}`;
            }
        });
        
        // Очистить весь кэш
        document.getElementById('allForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!confirm('⚠️ Вы уверены? Это очистит кэш для ВСЕХ альбомов!')) {
                return;
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '⏳ Очистка всего кэша...';
            
            try {
                const formData = new FormData();
                formData.append('action', 'refresh_cache');
                
                const response = await fetch('http://ms2/php/covers-api.php', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = `
                        ✅ ${result.message}<br>
                        <small>Обновите страницу. Все обложки перезагрузятся.</small>
                    `;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = `❌ Ошибка: ${result.error}`;
                }
            } catch (error) {
                resultDiv.className = 'result error';
                resultDiv.innerHTML = `❌ Ошибка сети: ${error.message}`;
            }
        });
    </script>
</body>
</html>
```

**Как использовать:**
1. Сохраните как `refresh-cache.html`
2. Откройте `http://ms2/refresh-cache.html`
3. Выберите вариант:
   - **Один альбом** - введите ID
   - **Весь кэш** - подтвердите действие
4. Готово!

---

#### Способ B: Через cURL

```bash
# Очистить кэш для одного альбома
curl -X POST http://ms2/php/covers-api.php \
  -d "action=refresh_cache&album_id=72"

# Очистить весь кэш
curl -X POST http://ms2/php/covers-api.php \
  -d "action=refresh_cache"
```

---

## 📊 Структура БД

```sql
album_covers_cache:
├── id (PK)
├── album_id (FK → albums.id, UNIQUE)
├── spotify_id (VARCHAR 100)
├── cover_url (TEXT)
├── source ('manual', 'spotify', 'lastfm')  ← показывает откуда обложка
└── updated_at (DATETIME AUTO_UPDATE)
```

**source показывает откуда обложка:**
- `manual` = вы загрузили (НЕ удаляется при refresh_cache)
- `spotify` = из Spotify API (TTL 6 часов)
- `lastfm` = из Last.fm API (TTL 6 часов)

---

## 💻 Использование в коде

### В PHP:

```php
require_once 'CoverService.php';

$coverService = new CoverService($pdo);

// Получить обложку
$coverUrl = $coverService->getCoverUrl($albumId, [
    'spotify_link' => $album['spotify_link'],
    'artist' => $album['artist'],
    'album_name' => $album['album_name']
]);

// Загрузить свою обложку
$result = $coverService->uploadCustomCover($albumId, $_FILES['cover']);

// Удалить обложку
$coverService->deleteCover($albumId);

// Очистить кэш
$coverService->refreshCache($albumId); // конкретный альбом
$coverService->refreshCache();          // весь кэш
```

---

## 🎯 Для 3 альбомов без Spotify

Система автоматически получает обложки из Last.fm:

```
ID: 72  - Neil Young - Harvest
ID: 90  - Neil Young - After the Gold Rush
ID: 136 - Joanna Newsom - Ys
```

**Проверить:**
```sql
SELECT * FROM albums WHERE spotify_link IS NULL;
```

---

## 🔐 Безопасность

✅ **Admin-only** - Только админ может загружать/удалять  
✅ **Валидация** - Проверка MIME типа и размера  
✅ **SQL Injection** - Prepared statements  
✅ **Path Traversal** - Безопасное сохранение файлов  
✅ **.htaccess** - Блокирует выполнение PHP в /uploads/covers

---

## 📈 Для портфолио

**Что демонстрирует:**
- ✅ Multi-level caching strategy
- ✅ Graceful degradation (fallback)
- ✅ Clean architecture (SRP, DRY)
- ✅ Error handling
- ✅ Security (admin-only, validation)
- ✅ Scalability (ready for Redis/CDN)

---

## ✨ Готово к использованию!

1. ✅ Структура БД обновлена
2. ✅ CoverService создан
3. ✅ API интегрирован
4. ✅ Admin endpoints готовы
5. ✅ Last.fm API key настроен

**Сохраните HTML формы и используйте их для управления обложками!**

---

## 📞 Вопросы?

- `CoverService.php` - главная логика (300 строк, полностью задокументирована)
- `covers-api.php` - admin API (150 строк)
- `api.php` - интеграция (обновлено 3 места)

**Система готова к production! 🚀**
