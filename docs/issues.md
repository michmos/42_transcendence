# GitHub Issues Breakdown for 42 Transcendence

This document outlines all the GitHub issues for the 42 Transcendence project, organized by epics and broken down into manageable, focused tasks.

## Epic 1: Database Foundation

<!-- ### Issue #1: Set up Prisma schema and configuration -->
<!---->
<!-- **Description:** -->
<!-- Initialize the Prisma ORM for the database package. This includes setting up the basic project structure, creating the initial schema file based on the requirements, and configuring the database connection. The schema should include basic models for Users, Games, Groups, and authentication data. Configure environment variables for database location and establish the foundation for the Prisma workflow. -->
<!---->
<!-- **Acceptance Criteria:** -->
<!---->
<!-- - [ ] Prisma is installed and configured in the database package -->
<!-- - [ ] Basic schema.prisma file created with User, Game, Group, and Auth models -->
<!-- - [ ] Database connection configured with environment variables -->
<!-- - [ ] `pnpm db:generate` command works and generates client -->
<!-- - [ ] `pnpm db:push` command successfully creates database tables -->
<!-- - [ ] Documentation for database setup added to README -->

### Issue #2: Implement user data access layer

**Description:**
Create secure database getter functions for user-related operations. This includes implementing GetUser[id] with proper authentication checks to ensure users can only access their own data or data they're authorized to view. Also implement GetUserGroups[id] to retrieve groups a user belongs to. All functions must include proper error handling and security validation to prevent unauthorized access.

**Acceptance Criteria:**

- [ ] `GetUser[id]` function implemented with authentication checks
- [ ] `GetUserGroups[id]` function implemented
- [ ] Functions return proper error messages for unauthorized access
- [ ] TypeScript types exported for frontend use
- [ ] Unit tests written for all getter functions
- [ ] No `GetAllUsers` function exists (security requirement)

### Issue #3: Implement game data access layer

**Description:**
Create database functions for game-related operations. Implement GetGames[id] function that uses group-based access control to ensure users can only see games they're authorized to view. This function should return game history, statistics, and match details. Include proper filtering and pagination for performance.

**Acceptance Criteria:**

- [ ] `GetGames[id]` function implemented with group-based access control
- [ ] Function returns game history with timestamps, opponents, scores, duration
- [ ] Pagination implemented for large game lists
- [ ] Proper error handling for invalid game IDs
- [ ] TypeScript types exported for all game data structures
- [ ] Function optimized for performance with database indexes

### Issue #4: Create database setter functions

**Description:**
Implement secure database setter functions for modifying user and game data. This includes functions for updating user profiles, adding users to groups, creating new games, and updating game results. All setter functions must include comprehensive input validation, authentication checks, and proper error handling. Implement transaction support where multiple database operations need to be atomic.

**Acceptance Criteria:**

- [ ] User profile update functions implemented with validation
- [ ] `AddUserToGroup[id]` function with proper authorization
- [ ] Game creation and result update functions implemented
- [ ] All inputs validated and sanitized
- [ ] Transaction support for multi-step operations
- [ ] Comprehensive error handling and logging
- [ ] Authentication checks on all write operations

### Issue #5: Generate dummy data for development

**Description:**
Create a comprehensive seed script that generates realistic test data for development and testing purposes. This should include diverse user profiles, friend relationships, game histories, and group memberships. Use AI assistance to generate varied and realistic usernames, game scenarios, and statistical distributions. The seed script should be idempotent and configurable for different testing scenarios.

**Acceptance Criteria:**

- [ ] Seed script creates diverse user profiles with realistic data
- [ ] Generated friend relationships and group memberships
- [ ] Varied game history data with realistic timestamps and scores
- [ ] Script is idempotent (can run multiple times safely)
- [ ] Configurable data volume for different testing needs
- [ ] Seed script integrated into development workflow
- [ ] Documentation for running and customizing seed data

## Epic 2: Basic Infrastructure

<!-- ### Issue #6: Set up Docker development environment  -->
<!---->
<!-- **Description:** -->
<!-- Create Docker configuration for all microservices in the project. This includes creating individual Dockerfiles for the API server, socket server, web frontend, and database. Set up docker-compose.yml for local development that orchestrates all services with proper networking, volume mounting for development, and environment variable management. Ensure hot reloading works for development workflow. -->
<!---->
<!-- **Acceptance Criteria:** -->
<!---->
<!-- - [ ] Dockerfiles created for all services (API, socket, web, database) -->
<!-- - [ ] docker-compose.yml for complete development environment -->
<!-- - [ ] Hot reloading configured for TypeScript services -->
<!-- - [ ] Environment variables properly managed across containers -->
<!-- - [ ] Database persistence configured with volumes -->
<!-- - [ ] Documentation for Docker development workflow -->
<!-- - [ ] All services start with single `docker-compose up` command -->

### Issue #7: Initialize Fastify API server structure

**Description:**
Set up the basic Fastify server structure with plugin system, route auto-loading, and proper TypeScript configuration. Configure logging, error handling, CORS, and basic middleware. Establish the foundation for API endpoints with proper request/response validation using Fastify's built-in schema system. Set up development and production configurations.

**Acceptance Criteria:**

- [ ] Fastify server configured with TypeScript
- [ ] Plugin auto-loading system implemented
- [ ] Route auto-loading from routes directory
- [ ] Logging configured with appropriate levels
- [ ] CORS configured for frontend communication
- [ ] Error handling middleware implemented
- [ ] Request/response validation schemas set up
- [ ] Development and production environment configs

### Issue #8: Implement basic API endpoints

**Description:**
Create the initial set of API endpoints for user and game operations. This includes basic CRUD operations for user profiles, authentication status endpoints, and initial game data endpoints. Implement proper HTTP status codes, error responses, and request validation. Set up the foundation for more complex endpoints to be built later.

**Acceptance Criteria:**

- [ ] User profile endpoints (GET, PUT /api/users/:id)
- [ ] Authentication status endpoint (GET /api/auth/status)
- [ ] Basic game endpoints (GET /api/games/:id)
- [ ] Proper HTTP status codes and error responses
- [ ] Request validation using Fastify schemas
- [ ] Response formatting consistent across endpoints
- [ ] OpenAPI/Swagger documentation generated
- [ ] Integration with database package functions

## Epic 3: Authentication System

### Issue #9: Set up OAuth provider configurations

**Description:**
Configure OAuth applications with Google, GitHub, and 42 School. Set up the necessary API keys, redirect URLs, and permissions for each provider. Create environment variable structure for managing OAuth credentials securely. Document the setup process for each provider and create development vs production configurations.

**Acceptance Criteria:**

- [ ] Google OAuth application configured with correct scopes
- [ ] GitHub OAuth application configured
- [ ] 42 School OAuth application configured
- [ ] Environment variables documented for all providers
- [ ] Redirect URLs configured for development and production
- [ ] OAuth application logos and branding set up
- [ ] Documentation for OAuth provider setup process

### Issue #10: Implement OAuth flow backend

**Description:**
Build the complete OAuth authentication flow on the backend. This includes handling OAuth callbacks from all providers, exchanging authorization codes for access tokens, retrieving user information from provider APIs, and creating or linking user accounts based on email addresses. Implement JWT token generation for session management and proper error handling for OAuth failures.

**Acceptance Criteria:**

- [ ] OAuth callback handlers for all three providers
- [ ] Token exchange and user info retrieval implemented
- [ ] User account creation/linking based on email matching
- [ ] JWT token generation and signing
- [ ] Proper error handling for OAuth failures
- [ ] Secure token storage and refresh logic
- [ ] Rate limiting for authentication endpoints

### Issue #11: Create authentication middleware

**Description:**
Implement middleware to protect API routes and manage user sessions. This includes JWT token validation, route protection based on authentication status, session management, and user context injection into requests. Create different authentication levels (public, authenticated, admin) and implement proper error responses for authentication failures.

**Acceptance Criteria:**

- [ ] JWT token validation middleware implemented
- [ ] Route protection decorators/middleware created
- [ ] User context injected into authenticated requests
- [ ] Different authentication levels supported
- [ ] Proper error responses for auth failures
- [ ] Session management and token refresh handling
- [ ] Middleware integrated with Fastify plugin system

## Epic 4: User Management

### Issue #12: Create user profile API endpoints

**Description:**
Build comprehensive API endpoints for user profile management. This includes endpoints for retrieving user profiles, updating nicknames and profile pictures, and managing user preferences. Implement proper file upload handling for profile pictures with validation, resizing, and secure storage. Add validation for nickname uniqueness and content filtering.

**Acceptance Criteria:**

- [ ] GET /api/users/:id endpoint with privacy controls
- [ ] PUT /api/users/:id endpoint for profile updates
- [ ] Profile picture upload with file validation
- [ ] Image resizing and optimization implemented
- [ ] Nickname uniqueness validation
- [ ] Content filtering for inappropriate names/images
- [ ] Proper authorization checks for profile modifications

### Issue #13: Implement friends system

**Description:**
Create a comprehensive friends system with friend requests, approvals, and management. This includes sending friend requests, accepting/declining requests, listing friends, and removing friends. Implement proper privacy controls and notification system for friend activities. Add search functionality for finding users to befriend.

**Acceptance Criteria:**

- [ ] Send friend request endpoint implemented
- [ ] Accept/decline friend request endpoints
- [ ] List friends endpoint with proper privacy
- [ ] Remove friend functionality
- [ ] User search endpoint for finding potential friends
- [ ] Friend request status tracking
- [ ] Privacy controls for friend visibility

### Issue #14: Build match history system

**Description:**
Implement comprehensive match history tracking and retrieval system. This includes storing detailed game results, calculating statistics, and providing various views of match history (recent games, head-to-head records, statistics). Add filtering and sorting options for match history display and implement privacy controls for viewing other users' match histories.

**Acceptance Criteria:**

- [ ] Match result storage with all required fields
- [ ] Match history retrieval with pagination
- [ ] Statistics calculation (win/loss ratio, average game time)
- [ ] Head-to-head match history between users
- [ ] Filtering options (date range, opponent, game type)
- [ ] Privacy controls for match history visibility
- [ ] Performance optimization for large match histories

## Epic 5: Frontend Foundation

### Issue #15: Set up Vite build system with dynamic routing

**Description:**
Configure the Vite build system to automatically discover and build routes based on folder structure. Implement a system that scans the routes directory at build time and generates the routing configuration dynamically. This should support nested routes, dynamic parameters, and automatic code splitting for each route component.

**Acceptance Criteria:**

- [ ] Vite configuration for TypeScript and dynamic imports
- [ ] Build-time route discovery system implemented
- [ ] Automatic code splitting for route components
- [ ] Support for nested routes and dynamic parameters
- [ ] Hot module replacement working for development
- [ ] Production build optimization configured
- [ ] Source maps configured for debugging

### Issue #16: Create base SPA structure

**Description:**
Build the foundational single-page application structure with main app component, navigation system, and TypeScript configuration. Implement client-side routing, layout components, and basic UI structure. Set up Tailwind CSS for styling and create reusable component architecture. Establish error boundaries and loading states for better user experience.

**Acceptance Criteria:**

- [ ] Main App component with routing logic implemented
- [ ] Navigation component with active state handling
- [ ] Base layout components (header, sidebar, footer)
- [ ] Tailwind CSS configured and working
- [ ] Error boundary components for error handling
- [ ] Loading state components and utilities
- [ ] Responsive design foundation established

### Issue #17: Implement API client utilities

**Description:**
Create a comprehensive API client system for communicating with the backend. This includes fetch wrappers with automatic error handling, request/response interceptors, authentication token management, and TypeScript type definitions. Implement retry logic, request caching, and proper error handling with user-friendly error messages.

**Acceptance Criteria:**

- [ ] API client class with all HTTP methods
- [ ] Automatic authentication token injection
- [ ] Request/response interceptors for common logic
- [ ] TypeScript types for all API responses
- [ ] Error handling with user-friendly messages
- [ ] Request retry logic for failed requests
- [ ] Response caching for GET requests
- [ ] Loading state management integrated

### Issue #18: Build authentication UI components

**Description:**
Create user interface components for the authentication system. This includes OAuth login buttons for all providers, user session display components, profile dropdown menus, and authentication flow handling. Implement proper loading states, error handling, and responsive design. Add logout functionality and session expiration handling.

**Acceptance Criteria:**

- [ ] OAuth login buttons for Google, GitHub, and 42
- [ ] User profile dropdown with session info
- [ ] Login/logout flow components
- [ ] Authentication loading states
- [ ] Error handling for auth failures
- [ ] Session expiration detection and handling
- [ ] Responsive design for all screen sizes
- [ ] Accessibility compliance for auth components

## Epic 6: Game Engine

### Issue #19: Set up WebSocket server

**Description:**
Implement a WebSocket server for real-time game communication. This includes setting up the socket server, implementing connection handling, user authentication for socket connections, and basic message routing. Add proper error handling, connection cleanup, and heartbeat/ping mechanisms to detect disconnected clients.

**Acceptance Criteria:**

- [ ] WebSocket server configured and running
- [ ] Socket authentication using JWT tokens
- [ ] Connection lifecycle management (connect/disconnect)
- [ ] Message routing system implemented
- [ ] Heartbeat/ping mechanism for connection health
- [ ] Error handling for socket errors
- [ ] Connection cleanup on server shutdown
- [ ] Socket middleware for authentication and logging

### Issue #20: Implement basic Pong game logic

**Description:**
Create the core Pong game engine with ball physics, paddle movement, collision detection, and scoring system. Implement the game loop, state management, and basic game rules. The game logic should be deterministic and suitable for multiplayer synchronization. Add configurable game parameters and proper boundary handling.

**Acceptance Criteria:**

- [ ] Ball physics with realistic movement and bouncing
- [ ] Paddle movement with smooth controls
- [ ] Collision detection between ball and paddles/walls
- [ ] Scoring system with win conditions
- [ ] Game state management (waiting, playing, ended)
- [ ] Configurable game parameters (speed, paddle size)
- [ ] Deterministic game logic for multiplayer sync
- [ ] Game loop with consistent timing

### Issue #21: Add multiplayer synchronization

**Description:**
Implement real-time multiplayer synchronization for the Pong game. This includes player state synchronization, lag compensation techniques, input prediction, and handling player disconnections gracefully. Add spectator support and ensure fair gameplay by implementing server-authoritative game state with client prediction.

**Acceptance Criteria:**

- [ ] Real-time player position synchronization
- [ ] Server-authoritative game state management
- [ ] Client-side prediction for responsive controls
- [ ] Lag compensation algorithms implemented
- [ ] Graceful handling of player disconnections
- [ ] Spectator mode for watching games
- [ ] Fair gameplay mechanics with cheat prevention
- [ ] Game state reconciliation for network issues

### Issue #22: Create anti-cheat validation

**Description:**
Implement server-side validation to prevent cheating in the Pong game. This includes validating player movements, ball positions, and game state changes to ensure they're within acceptable limits. Add detection for impossible movements, teleportation, and other cheating attempts. Implement logging and potential penalties for detected cheating.

**Acceptance Criteria:**

- [ ] Server-side validation of all player movements
- [ ] Ball position and velocity validation
- [ ] Detection of impossible game state changes
- [ ] Movement speed and distance validation
- [ ] Teleportation and position jump detection
- [ ] Logging system for suspicious activities
- [ ] Penalty system for detected cheating
- [ ] Performance optimization for real-time validation

## Epic 7: Tournament System

### Issue #23: Design tournament data models

**Description:**
Design and implement database schema for the tournament system. This includes models for tournaments, brackets, matches, and participant tracking. The schema should support different tournament formats (single elimination, double elimination), bracket generation, and proper state management for ongoing tournaments. Add support for tournament metadata and settings.

**Acceptance Criteria:**

- [ ] Tournament model with metadata and settings
- [ ] Bracket model supporting different tournament formats
- [ ] Match model with participant and result tracking
- [ ] Participant model linking users to tournaments
- [ ] Tournament state management (registration, active, completed)
- [ ] Database relationships properly configured
- [ ] Migration scripts for tournament tables
- [ ] TypeScript types exported for frontend use

### Issue #24: Implement matchmaking logic

**Description:**
Create intelligent matchmaking system for pairing players in tournaments and casual games. This includes skill-based matching, queue management, and preference handling. Implement different matching algorithms for tournaments vs casual play, and add support for manual pairing in tournaments. Include queue position tracking and estimated wait times.

**Acceptance Criteria:**

- [ ] Skill-based matching algorithm implemented
- [ ] Tournament bracket pairing logic
- [ ] Casual game queue management
- [ ] Player preference handling (game settings)
- [ ] Queue position and wait time estimation
- [ ] Manual pairing support for tournaments
- [ ] Matching fairness validation
- [ ] Database optimization for matchmaking queries

### Issue #25: Build tournament bracket system

**Description:**
Implement the complete tournament bracket system with knockout rounds, progression logic, and bracket visualization support. This includes automatic advancement of winners, handling of forfeits and no-shows, and proper tournament state management. Add support for different bracket sizes and seeding systems.

**Acceptance Criteria:**

- [ ] Knockout bracket generation and management
- [ ] Automatic winner advancement logic
- [ ] Forfeit and no-show handling
- [ ] Tournament progression tracking
- [ ] Seeding system for fair bracket placement
- [ ] Support for different bracket sizes (8, 16, 32 players)
- [ ] Bracket state persistence and recovery
- [ ] Tournament completion and winner determination

## Epic 8: Advanced Features & Polish

### Issue #26: Create CLI Pong client

**Description:**
Build a command-line interface for playing Pong that can connect to the web-based game servers. This includes ASCII graphics for game visualization, keyboard controls, and network communication with the WebSocket server. The CLI client should provide the same gameplay experience as the web version while working in a terminal environment.

**Acceptance Criteria:**

- [ ] ASCII art game visualization with smooth animation
- [ ] Keyboard controls for paddle movement
- [ ] WebSocket connection to game servers
- [ ] Same game logic as web version
- [ ] Terminal compatibility across different systems
- [ ] Proper error handling for network issues
- [ ] Command-line argument parsing for server connection
- [ ] Documentation for CLI installation and usage

### Issue #27: Set up CI/CD pipeline

**Description:**
Implement comprehensive continuous integration and deployment pipeline using GitHub Actions. This includes automated testing, linting, building, and deployment to staging and production environments. Add code quality checks, security scanning, and automated rollback capabilities. Configure different deployment strategies for different environments.

**Acceptance Criteria:**

- [ ] GitHub Actions workflow for CI/CD
- [ ] Automated testing on pull requests
- [ ] Code linting and formatting checks
- [ ] Security vulnerability scanning
- [ ] Automated deployment to staging environment
- [ ] Production deployment with manual approval
- [ ] Rollback capabilities for failed deployments
- [ ] Environment-specific configuration management

### Issue #28: Implement security hardening

**Description:**
Implement comprehensive security measures across the application. This includes HTTPS enforcement, input validation and sanitization, rate limiting, CSRF protection, and security headers. Add monitoring for security events, implement proper logging for audit trails, and conduct security testing. Ensure compliance with security best practices.

**Acceptance Criteria:**

- [ ] HTTPS enforcement across all services
- [ ] Comprehensive input validation and sanitization
- [ ] Rate limiting on all API endpoints
- [ ] CSRF protection for state-changing operations
- [ ] Security headers (CSP, HSTS, etc.) configured
- [ ] Security event monitoring and alerting
- [ ] Audit logging for sensitive operations
- [ ] Security testing and vulnerability assessment completed
