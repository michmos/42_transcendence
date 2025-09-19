# GitHub Issues Breakdown for 42 Transcendence (v3 - Current State)

This document outlines the remaining GitHub issues for the 42 Transcendence project based on what's already implemented and what still needs to be done according to subject requirements and selected modules.

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

## Epic 1: Core Game Features (Priority 1)

### Issue #1: Server-side Pong game engine

**Description:**
Implement the core Pong game with server-side logic as specified in the Server-Side Logic module. Replace any client-side game logic with authoritative server implementation.

**Acceptance Criteria:**

- [ ] Server-side game state management
- [ ] Physics engine for ball and paddle movement
- [ ] Collision detection and scoring
- [ ] Game loop with fixed timestep
- [ ] Anti-cheat measures with server authority
- [ ] Game state synchronization via WebSocket

### Issue #2: Real-time multiplayer via WebSocket

**Description:**
Extend the existing WebSocket infrastructure to support real-time Pong gameplay between remote players as required by the Remote Players module.

**Acceptance Criteria:**

- [ ] Real-time player input handling
- [ ] Game state broadcasting to all players
- [ ] Lag compensation and prediction
- [ ] Disconnect handling and reconnection
- [ ] Spectator mode support
- [ ] Game session management

### Issue #3: Tournament system

**Description:**
Implement the tournament system with knockout rounds and live matchmaking as required by the subject.

**Acceptance Criteria:**

- [ ] Tournament creation and registration
- [ ] Bracket generation for knockout format
- [ ] Automatic matchmaking between rounds
- [ ] Live tournament progress tracking
- [ ] Tournament results and leaderboards
- [ ] Database models for tournaments and matches

## Epic 2: Authentication & User Management (Priority 2)

### Issue #4: Implement OAuth 2.0 authentication

**Description:**
Implement OAuth authentication using the existing schema. Support 42 OAuth provider as required, with proper token management and user profile creation.

**Acceptance Criteria:**

- [ ] OAuth 2.0 flow implementation for 42 provider
- [ ] Token storage and refresh logic using existing oAuthProvider model
- [ ] User registration/login via OAuth
- [ ] Session management with secure cookies
- [ ] Profile creation and updates
- [ ] Authentication middleware for protected routes

### Issue #5: User profiles and friends system

**Description:**
Implement user profile management and friends system using existing User and Group models as specified in Standard User Management module.

**Acceptance Criteria:**

- [ ] User profile pages with avatar upload
- [ ] Friend requests and management
- [ ] User search and discovery
- [ ] Privacy settings and blocking
- [ ] Activity status and presence
- [ ] Profile statistics and achievements

### Issue #6: Match history and statistics

**Description:**
Track and display match history using the existing database models.

**Acceptance Criteria:**

- [ ] Match result recording
- [ ] Personal statistics dashboard
- [ ] Match replay system (basic)
- [ ] Performance analytics
- [ ] Ranking system
- [ ] Achievement system

## Epic 3: Frontend Polish (Priority 3)

### Issue #7: Integrate Tailwind CSS

**Description:**
Add Tailwind CSS to the existing Vite build system as specified in the Frontend Framework module.

**Acceptance Criteria:**

- [ ] Tailwind CSS installed and configured with Vite
- [ ] PostCSS configuration for Tailwind
- [ ] Base styles and utilities available
- [ ] Component styling with Tailwind classes
- [ ] Responsive design system
- [ ] Dark/light theme support

### Issue #8: Game interface and controls

**Description:**
Create the Pong game interface using the existing router system and Tailwind CSS for responsive gameplay.

**Acceptance Criteria:**

- [ ] Responsive game canvas/viewport
- [ ] Keyboard controls for paddle movement
- [ ] Touch controls for mobile devices
- [ ] Game HUD (score, timer, player names)
- [ ] Game lobby and waiting room
- [ ] In-game chat interface

### Issue #9: Tournament and matchmaking UI

**Description:**
Build tournament interfaces using the existing SPA router to support the tournament system.

**Acceptance Criteria:**

- [ ] Tournament creation and join forms
- [ ] Live tournament bracket display
- [ ] Match scheduling and notifications
- [ ] Tournament leaderboards
- [ ] Match history and statistics
- [ ] Real-time updates via WebSocket

## Epic 4: Advanced Features (Priority 4)

### Issue #10: Two-factor authentication (2FA)

**Description:**
Implement 2FA using the existing schema fields (twoFactorEnabled, twoFactorSecret) to meet security requirements.

**Acceptance Criteria:**

- [ ] TOTP 2FA implementation using existing schema
- [ ] QR code generation for 2FA setup
- [ ] 2FA verification during login
- [ ] 2FA backup codes
- [ ] 2FA disable/enable functionality

### Issue #11: Command-line interface for Pong

**Description:**
Implement CLI interface as specified in the CLI Integration module to allow command-line players to compete against web users.

**Acceptance Criteria:**

- [ ] CLI client for Pong game
- [ ] Network connectivity to game server
- [ ] Text-based game interface
- [ ] Command-line controls
- [ ] Match result display
- [ ] Authentication via CLI

### Issue #12: Security hardening

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

## Epic 5: Production & Containerization (Future Phases)

### Issue #13: Docker containerization

**Description:**
Migrate the monorepo to Docker containers for production deployment as mandated by the subject.

**Acceptance Criteria:**

- [ ] Dockerfile for API server
- [ ] Dockerfile for socket server
- [ ] Dockerfile for web application
- [ ] Docker Compose configuration for development
- [ ] Docker Compose configuration for production
- [ ] All services communicate properly in containers
- [ ] Environment variables properly configured
- [ ] Database persistence configured

### Issue #14: Microservices architecture migration

**Description:**
Evolve from monorepo to microservices as specified in the Microservices Architecture module.

**Acceptance Criteria:**

- [ ] Extract authentication service
- [ ] Extract game logic service
- [ ] Extract user management service
- [ ] API gateway for service coordination
- [ ] Service discovery and health checks
- [ ] Inter-service communication protocols

### Issue #15: Monitoring and production readiness

**Description:**
Add comprehensive monitoring and logging for production deployment.

**Acceptance Criteria:**

- [ ] Centralized logging system
- [ ] Error tracking and alerting
- [ ] Performance monitoring
- [ ] Health check endpoints
- [ ] Metrics collection and dashboards
- [ ] Log rotation and retention

## Implementation Roadmap

### Phase 1: Core MVP (Minimum Viable Product)

**Goal:** Playable Pong with tournaments

1. Issue #1 - Server-side Pong game engine
2. Issue #2 - Real-time multiplayer
3. Issue #3 - Tournament system
4. Issue #4 - OAuth authentication

**Timeline:** 4-6 weeks | **Critical Path:** Game engine → Multiplayer → Tournaments

### Phase 2: User Experience

**Goal:** Polished user interface and profiles 5. Issue #7 - Tailwind CSS integration 6. Issue #8 - Game interface 7. Issue #5 - User profiles and friends 8. Issue #9 - Tournament UI

**Timeline:** 3-4 weeks | **Depends on:** Phase 1 completion

### Phase 3: Enhanced Features

**Goal:** Security and advanced functionality 9. Issue #6 - Match history 10. Issue #10 - Two-factor authentication 11. Issue #11 - CLI interface 12. Issue #12 - Security hardening

**Timeline:** 3-4 weeks | **Can be done in parallel:** CLI, 2FA, Match history

### Phase 4: Production Deployment

**Goal:** Containerized, scalable deployment 13. Issue #13 - Docker containerization 14. Issue #14 - Microservices migration 15. Issue #15 - Monitoring

**Timeline:** 2-3 weeks | **Prerequisite:** Core features complete

## Development Notes

- **Keep monorepo structure** during Phases 1-3 for faster development
- **Use existing infrastructure** (Fastify, Prisma, WebSocket) as foundation
- **Prioritize game functionality** over infrastructure concerns initially
- **Docker migration** happens after core features are stable
- **Microservices split** only when services become too complex

This approach allows rapid development of core features while maintaining the eventual goal of proper containerization and service architecture.
