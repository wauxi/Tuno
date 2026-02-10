================================================================================
🎵 Tuno
================================================================================
A full-stack music library and rating platform for tracking, organizing, and
sharing your music collection. Built with vanilla JavaScript, PHP, and MySQL
in a fully dockerized development environment.

Vanilla JS | PHP 8.2 | MySQL 5.7 | Vite | SCSS | Docker

🌐 Repository: https://github.com/wauxi/Tuno

================================================================================
✨ FEATURES
================================================================================

🎧 Core Functionality
────────────────────────────────────────────────────────────────────────────
  • Album Management: Create, edit, and organize your music collection
  • Rating System: Rate albums and tracks with interactive UI
  • User Profiles: Personalized profiles with avatars and activity tracking
  • Favorite Albums: Curate your favorite albums collection
  • Listen Later Queue: Save albums to listen to later
  • Recently Activity: Track your recent ratings and additions
  • Search System: Fast and intuitive album/artist search
  • Multi-user Support: Multiple user accounts with individual collections

🎨 User Interface
────────────────────────────────────────────────────────────────────────────
  • Modern, responsive design with custom SCSS styling
  • Album grid layouts with hover effects
  • Interactive rating modals
  • Context menus for album actions
  • User dropdown menus
  • Dynamic header includes with Vite plugin
  • Real-time UI updates via event bus system

👤 User Management
────────────────────────────────────────────────────────────────────────────
  • Authentication system with login/logout
  • User service with caching
  • Profile avatars and customization
  • Settings page for user preferences
  • URL-based user viewing (view other users' profiles)

🔧 Admin Features
────────────────────────────────────────────────────────────────────────────
  • Admin cover management interface
  • Upload and organize album artwork
  • Database initialization scripts
  • SQL dump for easy deployment

================================================================================
🚀 QUICK START
================================================================================

Prerequisites
────────────────────────────────────────────────────────────────────────────
  • Docker & Docker Compose
  • Modern web browser (Chrome, Firefox, Safari, Edge)

Installation
────────────────────────────────────────────────────────────────────────────
1. Clone the repository:
  git clone https://github.com/wauxi/Tuno.git
  cd Tuno

2. Copy the environment template:
   cp env.example .env

3. (Optional) Edit .env to customize ports and database credentials

4. Start the Docker environment:
   docker compose up --build

5. Open in your browser:
   • Frontend: http://localhost:5173
   • API: http://localhost:8080/src/php

What's Running
────────────────────────────────────────────────────────────────────────────
  • frontend: Vite dev server with hot-reload (Node 20)
  • php: Apache + PHP 8.2 backend API
  • mysql: MySQL 5.7 database with auto-initialization

All source code is mounted into containers for instant updates. Press Ctrl+C
or run 'docker compose down' to stop.

================================================================================
📁 PROJECT STRUCTURE
================================================================================

musicboard_2/
├── index.html                    # Main application entry point
├── package.json                  # Node dependencies and scripts
├── vite.config.cjs              # Vite configuration with header plugin
├── docker-compose.yml           # Multi-container orchestration
├── musicboard.sql               # Database schema and initial data
├── env.example                  # Environment variables template
│
├── docker/                      # Docker configurations
│   └── php/
│       └── Dockerfile           # PHP Apache container setup
│
├── src/                         # Source code
│   ├── js/                      # Frontend JavaScript (ES6 modules)
│   │   ├── main.js             # Application entry point & initialization
│   │   │
│   │   ├── config/             # Configuration constants
│   │   │   └── constants.js    # App-wide constants (routes, defaults, UI)
│   │   │
│   │   ├── features/           # Feature modules
│   │   │   ├── albums/         # Album management
│   │   │   │   ├── AlbumGrid.js           # Album grid rendering
│   │   │   │   └── AlbumMenuManager.js    # Album context menus
│   │   │   ├── auth/           # Authentication
│   │   │   │   ├── AuthService.js         # Login/logout logic
│   │   │   │   └── authUtils.js           # Auth helper functions
│   │   │   ├── ratings/        # Rating system
│   │   │   │   ├── RatingManager.js       # Rating interactions
│   │   │   │   └── RatingModalComponent.js # Rating modal UI
│   │   │   ├── search/         # Search functionality
│   │   │   │   └── SearchManager.js       # Search logic
│   │   │   └── settings/       # User settings
│   │   │       └── SettingsManager.js     # Settings page logic
│   │   │
│   │   └── shared/             # Shared utilities and services
│   │       ├── components/     # Reusable UI components
│   │       │   ├── UIManager.js           # Main UI controller
│   │       │   ├── UserMenuManager.js     # User dropdown menu
│   │       │   └── include-header.js      # Static header builder
│   │       ├── services/       # Data services
│   │       │   ├── DataService.js         # API data fetching
│   │       │   └── UserService.js         # User data management
│   │       └── utils/          # Utilities
│   │           ├── EventBus.js            # Event system
│   │           ├── Logger.js              # Logging utility
│   │           └── Navigation.js          # Routing helper
│   │
│   ├── php/                    # Backend PHP API
│   │   ├── index.php          # API entry point
│   │   ├── api/               # API endpoints
│   │   ├── core/              # Core PHP classes
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # PHP utilities
│   │   └── validators/        # Input validation
│   │
│   ├── scss/                   # Styles (SCSS)
│   │   └── styles.scss        # Main stylesheet
│   │
│   └── partials/               # HTML partials
│       └── header.html        # Shared header component
│
├── public/                     # Static assets
│   ├── pages/                 # Additional HTML pages
│   │   ├── login.html         # Login page
│   │   ├── settings.html      # Settings page
│   │   └── admin-covers.html  # Admin cover management
│   ├── fonts/                 # Web fonts
│   ├── img/                   # Images and icons
│   └── uploads/               # User-uploaded content
│
├── dist/                       # Build output
│   └── css/                   # Compiled CSS
│
├── docs/                       # Documentation
└── scripts/                    # Build and utility scripts

================================================================================
🛠️ TECHNOLOGIES USED
================================================================================

Frontend Stack
────────────────────────────────────────────────────────────────────────────
  • Vanilla JavaScript (ES6 Modules) - Modern modular architecture
  • HTML5 & CSS3 - Semantic markup and modern styles
  • SCSS - Advanced styling with variables and mixins
  • Vite 7.2 - Lightning-fast dev server and build tool
  • Custom Vite Plugin - Header include system for templates

Backend Stack
────────────────────────────────────────────────────────────────────────────
  • PHP 8.2 - Server-side logic and API endpoints
  • Apache HTTP Server - Web server in Docker container
  • MySQL 5.7 - Relational database for data persistence
  • RESTful API - Clean API architecture

DevOps & Tools
────────────────────────────────────────────────────────────────────────────
  • Docker & Docker Compose - Containerized development environment
  • Node.js 20 - Frontend tooling and build process
  • npm - Package management
  • Git - Version control

Key Architecture Patterns
────────────────────────────────────────────────────────────────────────────
  • ES6 Module System - Organized, maintainable code
  • Event Bus Pattern - Decoupled component communication
  • Service Layer Architecture - Separation of concerns
  • Factory Pattern - Object creation and management
  • Observer Pattern - Reactive UI updates
  • MVC-inspired Structure - Model-View-Controller concepts
  • RESTful API Design - Standard HTTP methods and endpoints
  • Environment Variables - Configuration management

================================================================================
🎨 DESIGN HIGHLIGHTS
================================================================================

Modular JavaScript Architecture
────────────────────────────────────────────────────────────────────────────
The application is built with a clean modular structure:

  • Feature Modules: Self-contained features (albums, ratings, search, auth)
  • Shared Services: Reusable services (DataService, UserService, AuthService)
  • Component System: UI components with clear responsibilities
  • Event-Driven Communication: Components communicate via EventBus
  • Constants Management: Centralized configuration in constants.js

Event Bus System
────────────────────────────────────────────────────────────────────────────
Custom event bus for decoupled component communication:

  • Album updates trigger UI refreshes
  • Rating changes propagate to all listening components
  • User state changes update navigation and profile displays
  • Search results trigger grid updates
  • No tight coupling between modules

Smart Service Layer
────────────────────────────────────────────────────────────────────────────
  • DataService: Centralized API communication with caching
  • UserService: User data management with localStorage caching
  • AuthService: Authentication state management
  • Singleton pattern for global service access

Vite Header Include Plugin
────────────────────────────────────────────────────────────────────────────
Custom Vite plugin for template includes:

  • Replace <!-- @@header --> markers with header.html content
  • Works in both dev and production builds
  • Middleware for serving HTML files from public directory
  • Cross-platform path handling for Windows/Unix

Docker Development Environment
────────────────────────────────────────────────────────────────────────────
Three-container architecture:

  1. Frontend: Node 20 running Vite dev server with hot-reload
  2. Backend: Apache + PHP 8.2 serving REST API
  3. Database: MySQL 5.7 with automatic initialization

  • Source code mounted as volumes for instant updates
  • Environment variables for configuration
  • Persistent MySQL data volume
  • Network isolation between containers

================================================================================
⚙️ CONFIGURATION
================================================================================

Environment Variables (.env)
────────────────────────────────────────────────────────────────────────────
Create a .env file from env.example and customize:

  # Database Configuration
  MYSQL_ROOT_PASSWORD=rootpassword
  MYSQL_DATABASE=musicboard
  MYSQL_USER=musicboard_user
  MYSQL_PASSWORD=userpassword
  DB_PORT=3306

  # PHP Configuration
  PHP_PORT=8080
  PHP_DISPLAY_ERRORS=1

  # Frontend Configuration
  VITE_DEV_SERVER_PORT=5173
  API_BASE_URL=http://localhost:8080/src/php

NPM Scripts
────────────────────────────────────────────────────────────────────────────
  npm run dev           # Start Vite dev server
  npm run build         # Production build with Vite
  npm run preview       # Preview production build
  npm run build:css     # Compile SCSS to CSS
  npm run build:static  # Generate static includes
  npm run build:prod    # Full production build

Docker Commands
────────────────────────────────────────────────────────────────────────────
  docker compose up --build      # Start all services
  docker compose down            # Stop all services
  docker compose logs -f         # View logs
  docker compose ps              # View running containers
  docker compose restart         # Restart services

Application Constants (src/js/config/constants.js)
────────────────────────────────────────────────────────────────────────────
Customize application behavior:

  • API endpoints and base URLs
  • Default user IDs
  • UI element selectors
  • Route definitions
  • Timeout values
  • Feature flags

================================================================================
🎯 FEATURE-SPECIFIC NOTES
================================================================================

Album Management
────────────────────────────────────────────────────────────────────────────
  • Grid-based layout with responsive design
  • Context menu for quick actions (favorite, listen later, delete)
  • Drag-and-drop support for album covers
  • Lazy loading for performance
  • Image optimization and caching

Rating System
────────────────────────────────────────────────────────────────────────────
  • Interactive rating modal with star selection
  • Real-time rating calculations
  • User-specific ratings
  • Rating history tracking
  • Average rating display

Authentication
────────────────────────────────────────────────────────────────────────────
  • Session-based authentication
  • localStorage for persistent login
  • Automatic token refresh
  • Protected routes
  • Login/logout flow

Search
────────────────────────────────────────────────────────────────────────────
  • Real-time search as you type
  • Album and artist filtering
  • Search result highlighting
  • Debounced input for performance

User Profiles
────────────────────────────────────────────────────────────────────────────
  • View other users' profiles via URL parameters (?user=123)
  • Avatar upload and management
  • Activity tracking and display
  • Privacy settings

Database Schema
────────────────────────────────────────────────────────────────────────────
The musicboard.sql file includes:

  • Users table with authentication
  • Albums table with metadata
  • Ratings table for user ratings
  • Favorites table for favorite albums
  • Listen_later table for queued albums
  • Activity tracking tables

================================================================================
🔒 SECURITY CONSIDERATIONS
================================================================================

  • Environment variables for sensitive data
  • SQL injection prevention with prepared statements
  • XSS protection with input sanitization
  • CORS configuration for API security
  • Password hashing for user authentication
  • File upload validation and sanitization

================================================================================
🤝 CONTRIBUTING
================================================================================

Contributions, issues, and feature requests are welcome!

Development Workflow:
────────────────────────────────────────────────────────────────────────────
1. Fork the repository
2. Create a feature branch: git checkout -b feature/amazing-feature
3. Make your changes with proper commit messages
4. Ensure Docker environment works: docker compose up --build
5. Test your changes thoroughly
6. Push to your branch: git push origin feature/amazing-feature
7. Open a Pull Request with detailed description

Code Style Guidelines:
────────────────────────────────────────────────────────────────────────────
  • Use ES6+ JavaScript features (const/let, arrow functions, modules)
  • Follow consistent naming conventions (camelCase for JS, kebab-case for CSS)
  • Add comments for complex logic
  • Keep functions small and focused
  • Use meaningful variable and function names
  • Follow existing project structure

================================================================================
📜 LICENSE
================================================================================

This project is open source and available under the ISC License.

================================================================================
🙏 ACKNOWLEDGMENTS
================================================================================

Built with modern web technologies and best practices for music enthusiasts
who want to track and share their listening experiences.

Special thanks to:
  • The Vite team for the amazing build tool
  • Docker community for containerization standards
  • Open source contributors

================================================================================
📞 SUPPORT & ISSUES
================================================================================

Issues: https://github.com/wauxi/Tuno/issues
Repository: https://github.com/wauxi/Tuno

For questions or support, please open an issue on GitHub.

================================================================================
🎵 Happy Music Tracking!
================================================================================

Version: 1.0.0
Last Updated: 2026
Author: wauxi
Repository: https://github.com/wauxi/Tuno

================================================================================
