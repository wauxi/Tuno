## 📐 АРХИТЕКТУРА MUSICBOARD 2.0 (обновлено 2025-11-07)

Ниже — актуальная, прагматичная структура проекта и рекомендации по развитию: CI, тесты, спецификации API и безопасному развертыванию.

musicboard_2/
├── docs/                             # проектная документация
│   ├── ARCHITECTURE.md               # этот файл
│   └── openapi.yaml                   # (предлагается) контракт API
├── src/                              # фронтенд (пакуется сборщиком)
│   ├── js/
│   │   ├── features/                  # feature-oriented папки
│   │   │   ├── albums/
│   │   │   │   ├── AlbumGrid.js
│   │   │   │   ├── AlbumCard.js
│   │   │   │   └── AlbumMenu.js
│   │   │   ├── auth/
│   │   │   │   ├── AuthForm.js
│   │   │   │   └── AuthService.js
│   │   │   ├── ratings/
│   │   │   │   ├── RatingModal.js
│   │   │   │   └── RatingManager.js
│   │   │   └── search/
│   │   │       └── SearchManager.js
│   │   ├── shared/                    # переиспользуемые компоненты и сервисы
│   │   │   ├── components/
│   │   │   │   ├── UIManager.js
│   │   │   │   └── UserMenuManager.js
│   │   │   ├── services/
│   │   │   │   ├── HttpClient.js      # централизованная обёртка fetch/timeout/retry
│   │   │   │   └── CacheService.js
│   │   │   └── utils/
│   │   │       ├── EventBus.js
│   │   │       └── Logger.js
│   │   └── config/
│   │       ├── constants.js
│   │       └── environment.js         # mapping окружений
│   ├── scss/                          # стили (можно мигрировать на css-modules / tailwind)
│   └── index.html
├── public/                            # необрабатываемые статические файлы
│   ├── fonts/
│   ├── img/
│   └── pages/
├── php/                               # backend API и сервисы
│   ├── api/                           # endpoint-ы (следует привести к RESTful / OpenAPI)
│   │   ├── albums.php
│   │   ├── ratings.php
│   │   └── auth.php
│   ├── core/                          # инфраструктурный код
│   │   ├── Database.php
│   │   ├── Router.php
│   │   └── Request.php
│   ├── services/                      # бизнес-логика
│   │   ├── AlbumService.php
│   │   └── CoverService.php
│   └── utils/
│       └── Logger.php
├── scripts/                           # миграции и вспомогательные утилиты
│   └── migrate_passwords.php
├── infra/                             # инфраструктурные конфигурации (Docker, k8s, terraform)
│   ├── Dockerfile
│   └── docker-compose.yml
├── tests/
│   ├── js/                            # Jest/Playwright
│   └── php/                           # PHPUnit
├── .github/workflows/                 # CI (GitHub Actions)
├── dist/                              # артефакты сборки
├── .env.example
├── package.json
├── composer.json                      # (если появится внешняя зависимость для PHP)
└── README.md

## Ключевые принципы и контракты

- Разделение ответственности: фронтенд (src/) полностью отделён от серверной логики (php/).
- API должен иметь формализованный контракт — OpenAPI (`docs/openapi.yaml`). Это позволит:
	- генерировать HTTP-клиенты для фронтенда (при миграции на TS ускорит разработку);
	- тестировать согласованность (contract tests);
	- создавать документацию для внешних интеграций.
- Централизация сетевых вызовов: `shared/services/HttpClient.js` управляет таймаутами, retries и обработкой ошибок.
- Конфигурации извне: все секреты и настройки через `.env` (и `.env.example` в репозитории), в проде — под управлением секретного хранилища.

## Качества (non-functional)

- Безопасность: валидация входных данных в `php/validators/`. Хранение паролей только в хешированном виде (bcrypt/argon2).
- Надёжность: кеширование (CDN + server-side HTTP cache) для статичных ресурсов и часто запрашиваемых списков.
- Наблюдаемость: логирование (в `php/utils/Logger.php`) + метрики (endpoint для health/readiness), ошибки централизованно отправлять в лог-систему.
- Производительность: lazy-load изображений, критический CSS inline, минимизация сетевых запросов.

## Рекомендации по технологиям и инструментам (пошагово)

1) Быстрый выигрыш
	- Добавить CI workflow: линтинг (ESLint, PHPCS), unit tests (Jest, PHPUnit) и сборку фронтенда.
	- Написать минимальный OpenAPI (поддержка ручного и автоматического тестирования).
2) Короткая миграция
	- Внедрить Jest для JS unit-тестов и 1–2 интеграционных теста Playwright для критичных пользовательских сценариев.
	- Добавить pre-commit hooks (husky) и format-on-commit (prettier).
3) Среднесрочная модернизация
	- Рассмотреть миграцию на TypeScript (начать с типов для `shared/` и `config/`).
	- Вынести общие PHP сервисы в namespace и покрыть PHPUnit тестами.
4) Долгосрочно
	- Контейнеризация (Docker) + CD в тест/стейдж/прод через GitHub Actions.
	- OpenAPI-driven development: генерировать клиентские обёртки и использовать contract tests.

## Минимальный контракт (2–4 пункта)

- Вход: HTTP запросы к эндпоинтам в `php/api/` (JSON body, заголовки авторизации JWT/session cookie).
- Выход: JSON (стандартная обёртка { success: boolean, data: ..., error?: { code, message } }).
- Ошибки: 4xx — ошибки клиента, 5xx — ошибки сервера; логировать детальную причину на сервере, не отдавать внутренние стеки клиенту.

## Типичные edge-cases

- Пустые/невалидные входные данные — возврат 400 с объяснением.
- Большие/медленные ответы от внешних сервисов — таймауты и fallback (кеш/placeholder).
- Одновременные обновления сущности (race conditions) — использовать транзакции/Optimistic Locking где необходимо.

## Quality gates

- Build: `npm run build` для фронтенда — PASS/FAIL в CI.
- Lint: ESLint & PHP_CodeSniffer — включить в PR checks.
- Tests: Jest + PHPUnit — покрытие минимально 60% для критичных модулей, прогресс повышать со временем.

## План действий / Next steps

1. Создать `docs/openapi.yaml` с базовыми эндпоинтами (`/albums`, `/ratings`, `/auth`).
2. Добавить `.github/workflows/ci.yml` с задачами: install, lint, test, build.
3. Добавить skeleton тестов в `tests/js` (Jest) и `tests/php` (PHPUnit).
4. Поэтапная миграция на TypeScript: начать с `shared/` и `config/`.

Если хотите, могу сразу:
- создать `docs/openapi.yaml` с минимальной схемой;
- добавить пример workflow для GitHub Actions;
- сгенерировать skeleton для Jest/PhpUnit.

---

Дата обновления: 2025-11-07


