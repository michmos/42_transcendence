# GitHub Issues Breakdown for 42 Transcendence (v4 - Team Division)

This document organizes the remaining GitHub issues for the 42 Transcendence project based on feature areas suitable for a 5-person team. Each team member can own a specific feature area while collaborating on dependencies.

**Development Approach:** Keep monorepo structure for initial development, migrate to Docker services in later phases.

## Current Implementation Status

### ✅ Already Implemented:

- **Database Foundation**: Prisma schema with User, Group, oAuthProvider models
- **Basic API Server**: Fastify with auto-loading, CORS, user endpoints
- **Frontend Foundation**: Vite build, TypeScript SPA router, API client
- **WebSocket Infrastructure**: Basic WebSocket server and client classes
- **Project Structure**: Monorepo with TurboRepo, TypeScript configuration
- **Security**: Fixed getAllUsers violation, added secure access patterns

### ❌ Missing Critical Components:

- **OAuth authentication implementation** (only schema exists)
- **Pong game** (core requirement)
- **Tournament system** (core requirement)
- **Tailwind CSS integration**
- **CLI interface**

### 🔄 Deferred for Later Phases:

- **Docker containerization** (mandatory but can be implemented after core features)
- **Microservices architecture** (can evolve from monorepo)

## Team Feature Assignments

### 👤 **Team Member 1: Authentication & Security** => Jens

**Expertise:** Backend security, OAuth, authentication flows
**Primary Responsibility:** User authentication, security hardening, 2FA

### 🎮 **Team Member 2: Game Engine & Physics** => Michel, (Wouter)

**Expertise:** Game logic, WebSocket, real-time systems
**Primary Responsibility:** Pong game engine, multiplayer, game mechanics

### 🏆 **Team Member 3: Tournament System** => Micha

**Expertise:** Database design, complex logic, algorithms
**Primary Responsibility:** Tournament logic, matchmaking, brackets

### 🎨 **Team Member 4: Frontend & UI/UX** => Paul

**Expertise:** Frontend development, design, user experience
**Primary Responsibility:** User interfaces, styling, responsive design

### 👥 **Team Member 5: User Management & Social** => Wouter, (Micha)

**Expertise:** User features, social systems, data management
**Primary Responsibility:** Profiles, friends, match history, statistics

---

## Feature Area 1: Authentication & Security 🔐

**Owner:** Team Member 1

### Issue #1: Implement OAuth 2.0 authentication

**Description:**
Implement OAuth authentication using the existing schema. Support 42 OAuth provider as required, with proper token management and user profile creation.

**Acceptance Criteria:**

- [ ] OAuth 2.0 flow implementation for 42 provider
- [ ] Token storage and refresh logic using existing oAuthProvider model
- [ ] User registration/login via OAuth
- [ ] Session management with secure cookies
- [ ] Profile creation and updates
- [ ] Authentication middleware for protected routes

**Dependencies:** None (can start immediately)

### Issue #2: Two-factor authentication (2FA)

**Description:**
Implement 2FA using the existing schema fields (twoFactorEnabled, twoFactorSecret) to meet security requirements.

**Acceptance Criteria:**

- [ ] TOTP 2FA implementation using existing schema
- [ ] QR code generation for 2FA setup
- [ ] 2FA verification during login
- [ ] 2FA backup codes
- [ ] 2FA disable/enable functionality

**Dependencies:** Issue #1 (OAuth must be implemented first)

### Issue #3: Security hardening

**Description:**
Implement comprehensive security measures as required by the subject (HTTPS can be handled via reverse proxy in production).

**Acceptance Criteria:**

- [ ] SQL injection prevention (prepared statements)
- [ ] XSS protection and CSP headers
- [ ] CSRF protection
- [ ] Rate limiting and DDoS protection
- [ ] Security headers configuration
- [ ] Input validation and sanitization
- [ ] Secure session management

**Dependencies:** Issue #1 (authentication system)

---

## Feature Area 2: Game Engine & Physics 🎮

**Owner:** Team Member 2

### Issue #4: Server-side Pong game engine

**Description:**
Implement the core Pong game with server-side logic as specified in the Server-Side Logic module. Replace any client-side game logic with authoritative server implementation.

**Acceptance Criteria:**

- [ ] Server-side game state management
- [ ] Physics engine for ball and paddle movement
- [ ] Collision detection and scoring
- [ ] Game loop with fixed timestep
- [ ] Anti-cheat measures with server authority
- [ ] Game state synchronization via WebSocket

**Dependencies:** None (can start immediately using existing WebSocket infrastructure)

### Issue #5: Real-time multiplayer via WebSocket

**Description:**
Extend the existing WebSocket infrastructure to support real-time Pong gameplay between remote players as required by the Remote Players module.

**Acceptance Criteria:**

- [ ] Real-time player input handling
- [ ] Game state broadcasting to all players
- [ ] Lag compensation and prediction
- [ ] Disconnect handling and reconnection
- [ ] Spectator mode support
- [ ] Game session management

**Dependencies:** Issue #4 (game engine must exist first)

### Issue #6: Command-line interface for Pong

**Description:**
Implement CLI interface as specified in the CLI Integration module to allow command-line players to compete against web users.

**Acceptance Criteria:**

- [ ] CLI client for Pong game
- [ ] Network connectivity to game server
- [ ] Text-based game interface
- [ ] Command-line controls
- [ ] Match result display
- [ ] Authentication via CLI

**Dependencies:** Issue #5 (multiplayer system), Issue #1 (authentication)

---

## Feature Area 3: Tournament System 🏆

**Owner:** Team Member 3

### Issue #7: Tournament system backend

**Description:**
Implement the tournament system with knockout rounds and live matchmaking as required by the subject.

**Acceptance Criteria:**

- [ ] Tournament creation and registration
- [ ] Bracket generation for knockout format
- [ ] Automatic matchmaking between rounds
- [ ] Live tournament progress tracking
- [ ] Tournament results and leaderboards
- [ ] Database models for tournaments and matches

**Dependencies:** Issue #4 (game engine), Issue #1 (authentication for registration)

### Issue #8: Match history and statistics

**Description:**
Track and display match history using the existing database models.

**Acceptance Criteria:**

- [ ] Match result recording
- [ ] Personal statistics dashboard
- [ ] Match replay system (basic)
- [ ] Performance analytics
- [ ] Ranking system
- [ ] Achievement system

**Dependencies:** Issue #4 (game results), Issue #7 (tournament results)

---

## Feature Area 4: Frontend & UI/UX 🎨

**Owner:** Team Member 4

### Issue #9: Integrate Tailwind CSS and design system

**Description:**
Add Tailwind CSS to the existing Vite build system as specified in the Frontend Framework module.

**Acceptance Criteria:**

- [ ] Tailwind CSS installed and configured with Vite
- [ ] PostCSS configuration for Tailwind
- [ ] Base styles and utilities available
- [ ] Component styling with Tailwind classes
- [ ] Responsive design system
- [ ] Dark/light theme support

**Dependencies:** None (can start immediately)

### Issue #10: Game interface and controls

**Description:**
Create the Pong game interface using the existing router system and Tailwind CSS for responsive gameplay.

**Acceptance Criteria:**

- [ ] Responsive game canvas/viewport
- [ ] Keyboard controls for paddle movement
- [ ] Touch controls for mobile devices
- [ ] Game HUD (score, timer, player names)
- [ ] Game lobby and waiting room
- [ ] In-game chat interface

**Dependencies:** Issue #9 (Tailwind CSS), Issue #4 (game engine)

### Issue #11: Tournament and matchmaking UI

**Description:**
Build tournament interfaces using the existing SPA router to support the tournament system.

**Acceptance Criteria:**

- [ ] Tournament creation and join forms
- [ ] Live tournament bracket display
- [ ] Match scheduling and notifications
- [ ] Tournament leaderboards
- [ ] Match history and statistics
- [ ] Real-time updates via WebSocket

**Dependencies:** Issue #9 (Tailwind CSS), Issue #7 (tournament backend)

### Issue #12: Authentication UI components

**Description:**
Create UI components for OAuth authentication flow required by Remote Authentication module.

**Acceptance Criteria:**

- [ ] OAuth login buttons for 42 provider
- [ ] User profile dropdown with session info
- [ ] Login/logout flow components
- [ ] Authentication loading states and error handling
- [ ] Session expiration detection and handling
- [ ] Responsive design for all screen sizes

**Dependencies:** Issue #9 (Tailwind CSS), Issue #1 (OAuth backend)

---

## Feature Area 5: User Management & Social 👥

**Owner:** Team Member 5

### Issue #13: User profiles and friends system

**Description:**
Implement user profile management and friends system using existing User and Group models as specified in Standard User Management module.

**Acceptance Criteria:**

- [ ] User profile pages with avatar upload
- [ ] Friend requests and management
- [ ] User search and discovery
- [ ] Privacy settings and blocking
- [ ] Activity status and presence
- [ ] Profile statistics and achievements

**Dependencies:** Issue #1 (authentication), Issue #8 (statistics from Team Member 3)

### Issue #14: Social features and presence

**Description:**
Extend user management with social features and real-time presence indicators.

**Acceptance Criteria:**

- [ ] Online/offline status indicators
- [ ] Friend activity feeds
- [ ] User blocking and privacy controls
- [ ] Social notifications system
- [ ] Friend recommendations
- [ ] Social leaderboards

**Dependencies:** Issue #13 (user profiles), Issue #5 (WebSocket for presence)

---

## Shared Infrastructure (All Team Members)

### Issue #15: Docker containerization

**Description:** Migrate the monorepo to Docker containers for production deployment.
**Owner:** To be assigned in Phase 4
**Dependencies:** All core features complete

### Issue #16: Microservices architecture migration

**Description:** Evolve from monorepo to microservices.
**Owner:** To be assigned in Phase 4
**Dependencies:** Issue #15 (Docker containers)

### Issue #17: Monitoring and production readiness

**Description:** Add comprehensive monitoring and logging.
**Owner:** To be assigned in Phase 4
**Dependencies:** Issue #16 (microservices)

---

## Implementation Timeline

### Phase 1: Core MVP (4-6 weeks)

**Parallel Development:**

- **Week 1-2:** Team Members 1, 2, 4 start (Authentication, Game Engine, Tailwind CSS)
- **Week 3-4:** Team Members 3, 5 join (Tournament System, User Profiles)
- **Week 5-6:** Integration and testing

**Critical Path:** Authentication → Game Engine → Tournament System

### Phase 2: Feature Integration (3-4 weeks)

**Focus:** UI implementation and social features

- All teams work on their frontend components
- Integration between game engine and tournament system
- User management and social features

### Phase 3: Polish & Advanced Features (3-4 weeks)

**Focus:** 2FA, CLI, advanced UI features

- Security hardening
- CLI interface
- Advanced UI components and animations
- Performance optimization

### Phase 4: Production Deployment (2-3 weeks)

**Focus:** Infrastructure and deployment

- Docker containerization
- Microservices migration
- Monitoring and production readiness

## Team Collaboration Guidelines

### Cross-Team Dependencies

1. **Authentication (Team 1) → Everyone:** Must be completed first
2. **Game Engine (Team 2) → Tournament (Team 3):** Game logic needed for tournaments
3. **Game Engine (Team 2) → Frontend (Team 4):** Game interface needs game logic
4. **Tournament Backend (Team 3) → Frontend (Team 4):** UI needs backend APIs
5. **Statistics (Team 3) → User Management (Team 5):** Profile stats need match data

### Communication Protocols

- **Daily standups** with dependency updates
- **Weekly integration meetings** for cross-team features
- **Shared API documentation** updated by backend teams
- **Feature branch strategy** with team-specific prefixes
- **Integration testing** before merging major features

### Shared Responsibilities

- **Database schema changes:** Coordinate with all teams
- **API design:** Backend teams collaborate on consistent patterns
- **TypeScript types:** Export from backend, import in frontend
- **Testing:** Each team writes tests for their features
- **Documentation:** Each team documents their APIs and components

This structure allows each team member to own a specific domain while maintaining clear collaboration points and dependencies.
