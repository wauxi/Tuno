# Musicboard 2.0

## Быстрый старт (Docker)

1. Скопируйте шаблон переменных и при необходимости отредактируйте порты/пароли:
   ```bash
   cp env.example .env
   ```
2. Запустите окружение:
   ```bash
   docker compose up --build
   ```
3. Откройте:
   - фронтенд: http://localhost:5173
   - API: http://localhost:8080/src/php

### Что внутри
- `frontend` — Vite dev server (hot-reload), работает поверх Node 20.
- `php` — Apache + PHP 8.2, подключается к MySQL через переменные окружения. API доступно по `http://localhost:8080/index.php`.
- `mysql` — контейнер `mysql:5.7`, данные инициализируются дампом `musicboard.sql` при первом старте.

Исходники примонтированы в контейнеры, изменения в коде подхватываются сразу. Для остановки окружения используйте `Ctrl+C` или `docker compose down`.

