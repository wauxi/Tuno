# 📐 АРХИТЕКТУРА MUSICBOARD 2.0

**Версия:** 2.1 (С гибридной системой обложек)  
**Дата:** 2025-11-01

---

## 🏗️ СТРУКТУРА

```
js/                     # Frontend
├── main.js             # Entry point
├── components/         # UI (Grid, Modal, Menu, UIManager)
├── managers/           # Logic (Rating, Search)
├── services/           # Data (Auth, Data, User)
├── utils/              # Helpers (EventBus, Rating, Storage)
└── config/             # Constants

php/                    # Backend
├── api.php             # Main API
├── auth-api.php        # Login/Register/Logout
├── ratings-api.php     # CRUD рейтингов
├── covers-api.php      # ✨ Admin covers (NEW)
├── CoverService.php    # ✨ Hybrid covers (NEW)
├── Database.php        # Singleton DB
├── InputValidator.php  # Валидация
└── Logger.php          # Логирование

admin-covers.html       # ✨ Admin panel (NEW)
```

---

## 🎯 АРХИТЕКТУРНЫЕ СЛОИ

**1. Presentation** → UI (Components)  
**2. Business Logic** → Managers  
**3. Data** → Services (API, Cache)  
**4. Utils** → EventBus, Helpers  
**5. Config** → Constants

---

## ✨ ГИБРИДНАЯ СИСТЕМА ОБЛОЖЕК (NEW)

```
getCoverUrl(albumId)
  ↓
1. Check Cache
   - manual? → Return (no TTL)
   - spotify/lastfm + TTL < 6h? → Return
  ↓
2. Try Spotify API
   ↓
3. Try Last.fm API
   ↓
4. Return NULL (placeholder)
```

**Приоритеты:**  
1️⃣ Manual (admin) - без TTL  
2️⃣ Spotify - 6h TTL  
3️⃣ Last.fm - 6h TTL  
4️⃣ Placeholder

**Admin функции:**
- Upload cover
- Delete cover
- Refresh cache

---

## 🔄 ОСНОВНОЙ ПОТОК

```
Init → Auth → LoadUsers → LoadData → Render
```

```
LoadData → For each album → CoverService.getCoverUrl()
```

---

## 🎨 DESIGN PATTERNS

- **Singleton** (Database)
- **Observer** (EventBus)
- **Service Layer** (Auth, Data, User)
- **Web Components** (<rating-modal>)
- **Facade** (RatingManager, SearchManager)
- **Strategy** (CoverService sources)

---

## 📊 СТАТИСТИКА

- JS: ~3000+ строк
- PHP: ~2000+ строк
- Модулей: 30+
- **Тестов: 0** ⚠️

---

## ✅ ПРЕИМУЩЕСТВА

- ✅ Модульная архитектура
- ✅ Слабая связанность (EventBus)
- ✅ SRP (Single Responsibility)
- ✅ DRY (No duplication)
- ✅ Web Components (modern)
- ✅ Гибридная система обложек

---

## 🔮 РЕКОМЕНДАЦИИ

1. **Тесты** (Jest + PHPUnit) ⚠️ КРИТИЧНО
2. TypeScript (опционально)
3. Vite/Webpack (бандлинг)
4. .env файл (конфиги)
5. Error Boundaries

---

