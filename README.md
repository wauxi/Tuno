# 🎵 Tuno
A full-stack music library and rating platform for tracking, organizing, and sharing your music collection. Built with vanilla JavaScript, PHP, and MySQL in a fully dockerized environment.

**Vanilla JS** | **PHP 8.2** | **MySQL 5.7** | **Vite** | **SCSS** | **Docker**

🌐 **Repository**: [github.com/wauxi/Tuno](https://github.com/wauxi/Tuno)

---

## ✨ Features

### 🎧 Core Functionality
- **Album Management**: Create, edit, and organize your music collection with 500+ tracks
- **Rating System**: Rate albums and tracks with interactive UI
- **User Profiles**: Personalized profiles with avatars and activity tracking
- **Favorite Albums**: Curate your favorite albums collection
- **Listen Later Queue**: Save albums to listen to later
- **Recently Activity**: Track your recent ratings and additions
- **Search System**: Fast and intuitive album/artist search
- **Multi-user Support**: Multiple user accounts with individual collections

### 🎨 User Interface
- Modern, responsive design with custom SCSS styling
- Album grid layouts with hover effects
- Interactive rating modals
- Context menus for album actions
- User dropdown menus
- Dynamic header includes with Vite plugin
- Real-time UI updates via event bus system

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Modern web browser

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/wauxi/music_library.git
cd musicboard_2

# 2. Copy environment template
cp env.example .env

# 3. Start Docker environment
docker compose up --build

# 4. Open in browser
# Frontend: http://localhost:5173
# API: http://localhost:8080/src/php
```

### What's Running

- **frontend** – Vite dev server with hot-reload (Node 20)
- **php** – Apache + PHP 8.2 backend API
- **mysql** – MySQL 5.7 with auto-initialization

All source code is mounted for instant updates. Press `Ctrl+C` or run `docker compose down` to stop.

## 🛠️ Technologies Used

### Core Technologies
- **Vanilla JavaScript (ES6 Modules)** - Modern modular architecture
- **HTML5 & CSS3** - Semantic markup and modern styles
- **SCSS** - Advanced styling with variables and mixins
- **Vite 7.2** - Lightning-fast dev server and build tool

### Backend Stack
- **PHP 8.2** - Server-side logic and API endpoints
- **Apache HTTP Server** - Web server in Docker container
- **MySQL 5.7** - Relational database for data persistence
- **RESTful API** - Clean API architecture

### DevOps & Tools
- **Docker & Docker Compose** - Containerized development environment
- **Node.js 20** - Frontend tooling and build process
- **npm** - Package management
- **Git** - Version control

### Key Architecture Patterns
- ES6 Module System - Organized, maintainable code
- Event Bus Pattern - Decoupled component communication
- Service Layer Architecture - Separation of concerns
- MVC-inspired Structure - Model-View-Controller concepts
- RESTful API Design - Standard HTTP methods and endpoints

## 📁 Project Structure

```
musicboard_2/
├── src/
│   ├── js/                 # Frontend JavaScript (ES6 modules)
│   │   ├── main.js        # Application entry point
│   │   ├── config/        # Configuration constants
│   │   ├── features/      # Feature modules (albums, auth, ratings, search)
│   │   └── shared/        # Shared utilities and services
│   ├── php/               # Backend PHP API
│   ├── scss/              # Styles
│   └── partials/          # HTML partials
├── public/                # Static assets
├── docker/                # Docker configurations
├── musicboard.sql         # Database schema
└── vite.config.cjs        # Vite configuration
```

## 🎨 Design Highlights

### Modular JavaScript Architecture
The application is built with a clean modular structure:
- **Feature Modules**: Self-contained features (albums, ratings, search, auth)
- **Shared Services**: Reusable services (DataService, UserService, AuthService)
- **Component System**: UI components with clear responsibilities
- **Event-Driven Communication**: Components communicate via EventBus
- **Constants Management**: Centralized configuration in constants.js

### Event Bus System
Custom event bus for decoupled component communication:
- Album updates trigger UI refreshes
- Rating changes propagate to all listening components
- User state changes update navigation and profile displays
- Search results trigger grid updates
- No tight coupling between modules

### Smart Service Layer
- **DataService**: Centralized API communication with caching
- **UserService**: User data management with localStorage caching
- **AuthService**: Authentication state management
- Singleton pattern for global service access

### Docker Development Environment
Three-container architecture:
1. **Frontend**: Node 20 running Vite dev server with hot-reload
2. **Backend**: Apache + PHP 8.2 serving REST API
3. **Database**: MySQL 5.7 with automatic initialization

- Source code mounted as volumes for instant updates
- Environment variables for configuration
- Persistent MySQL data volume
- Network isolation between containers

## ⚙️ Configuration

### Environment Variables

Edit `.env` to customize ports and credentials:

```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=musicboard
MYSQL_USER=musicboard_user
MYSQL_PASSWORD=userpassword
DB_PORT=3306
PHP_PORT=8080
VITE_DEV_SERVER_PORT=5173
```

### NPM Scripts

```bash
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build
```

## 📚 Documentation

For detailed documentation including architecture, design patterns, and API reference, see [DOCUMENTATION.md](./DOCUMENTATION.md).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/wauxi/music_library/issues).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is open source and available under the ISC License.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for music enthusiasts who want to track and share their listening experiences.

Special thanks to:
- The Vite team for the amazing build tool
- Docker community for containerization standards
- Open source contributors

---

**Built with ❤️ for music enthusiasts** | Version 1.0.0 | 2026

