# 42 Transcendence - Selected Modules

## Mandatory Requirements
- Basic Pong game (single computer multiplayer)
- Tournament system with KO rounds and live matchmaking
- Single-page application with proper browser navigation
- Docker containerization
- TypeScript frontend (default requirement)
- Security compliance (HTTPS, input validation, password hashing)

## Selected Modules (7 Major + Minor equivalents required)

### Web Modules
- **Framework Backend** (Major) - Fastify with Node.js
- **Database** (Minor) - SQLite for all DB instances  
- **Frontend Framework** (Minor) - Tailwind CSS + TypeScript

### User Management
- **Standard User Management** (Major) - Authentication, profiles, friends, match history
- **Remote Authentication** (Major) - OAuth 2.0 implementation

### Gameplay & Experience  
- **Remote Players** (Major) - Network multiplayer with disconnect/lag handling

### DevOps
- **Microservices Architecture** (Major) - Backend as loosely-coupled services

### Server-Side Pong
- **Server-Side Logic** (Major) - Replace basic Pong with server-side implementation + API
- **CLI Integration** (Major) - Command-line interface for playing against web users

## Module Dependencies & Notes
- Database module is prerequisite for backend framework
- Remote players strongly recommended for multiplayer modules
- OAuth preferred over password management for security
- Microservices architecture supports scalability goals
- Server-side modules work together (API + CLI)
