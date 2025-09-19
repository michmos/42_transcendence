# GitHub Issues Breakdown for 42 Transcendence (v2)

This document outlines GitHub issues for the 42 Transcendence project, strictly based on the subject requirements and selected modules. Only mandatory features and chosen modules are included.

## Mandatory Requirements Summary

- Basic Pong game (single computer multiplayer initially)
- Tournament system with KO rounds and live matchmaking
- Single-page application with proper browser navigation
- Docker containerization
- TypeScript frontend (mandatory)
- Security compliance (HTTPS, input validation, password hashing)

## Selected Modules (from docs/modules.md)

- **Framework Backend** (Major) - Fastify with Node.js
- **Database** (Minor) - SQLite for all DB instances
- **Frontend Framework** (Minor) - Tailwind CSS + TypeScript
- **Standard User Management** (Major) - Authentication, profiles, friends, match history
- **Remote Authentication** (Major) - OAuth 2.0 implementation
- **Remote Players** (Major) - Network multiplayer with disconnect/lag handling
- **Microservices Architecture** (Major) - Backend as loosely-coupled services
- **Server-Side Logic** (Major) - Replace basic Pong with server-side implementation + API
- **CLI Integration** (Major) - Command-line interface for playing against web users

## Epic 1: Database Foundation

### Issue #1: Set up Prisma schema and configuration

**Description:**
Initialize the Prisma ORM for the database package as required by the Database module. Create the basic schema file with models for Users, Games, Groups, and authentication data. Configure SQLite database connection with environment variables as specified in the subject requirements.

**Acceptance Criteria:**

- [ ] Prisma installed and configured in database package
- [ ] Schema.prisma file created with User, Game, Group, and Auth models
- [ ] SQLite database connection configured with environment variables
- [ ] `pnpm db:generate` command works and generates client
- [ ] `pnpm db:push` command successfully creates database tables
- [ ] Database package structure follows subject specifications

### Issue #2: Implement user data access layer

**Description:**
Create secure database getter functions as specified in modules.md. Implement GetUser[id] with proper authentication checks to ensure users can only access authorized data. Implement GetUserGroups[id] for group-based access control. Security requirement: no GetAllUsers function.

**Acceptance Criteria:**

- [ ] `GetUser[id]` function implemented with authentication checks
- [ ] `GetUserGroups[id]` function implemented
- [ ] Functions return proper error messages for unauthorized access
- [ ] TypeScript types exported for frontend use
- [ ] No `GetAllUsers` function exists (security requirement from subject)
- [ ] Functions follow authentication requirements from subject

### Issue #3: Implement game data access layer

**Description:**
Create GetGames[id] function using group-based access control as outlined in modules.md. Function should return game history with all fields required by the Standard User Management module: timestamps, opponents, scores, duration, win/lose status.

**Acceptance Criteria:**

- [ ] `GetGames[id]` function implemented with group-based access control
- [ ] Function returns game history with timestamps, opponents, scores, duration
- [ ] Win/lose status and game length tracking implemented
- [ ] Proper error handling for invalid game IDs
- [ ] TypeScript types exported for all game data structures
- [ ] Database performance optimized for game queries

### Issue #4: Create database setter functions

**Description:**
Implement secure database setter functions for all operations required by Standard User Management module. Include functions for updating user profiles, adding users to groups, creating new games, and updating game results. All setters must include authentication checks as required by subject security concerns.

**Acceptance Criteria:**

- [ ] User profile update functions with validation (nickname, picture changes)
- [ ] `AddUserToGroup[id]` function with proper authorization
- [ ] Game creation and result update functions
- [ ] All inputs validated and sanitized (subject security requirement)
- [ ] Transaction support for multi-step operations
- [ ] Authentication checks on all write operations (subject requirement)

### Issue #5: Generate dummy data for development

**Description:**
Create seed script that generates realistic test data for development as mentioned in modules.md. Include diverse user profiles, friend relationships, game histories, and group memberships to support all selected modules.

**Acceptance Criteria:**

- [ ] Seed script creates diverse user profiles with realistic data
- [ ] Generated friend relationships for Standard User Management testing
- [ ] Varied game history data with all required fields
- [ ] Script is idempotent (can run multiple times safely)
- [ ] Data supports OAuth provider testing scenarios
- [ ] Seed script integrated into development workflow

## Epic 2: Infrastructure & Framework

### Issue #6: Set up Docker containerization (Mandatory)

**Description:**
Create Docker configuration to meet the mandatory requirement: "You must use Docker to run your website. Everything must be launched with a single command line to run an autonomous container." Set up for microservices architecture as per selected module.

**Acceptance Criteria:**

- [ ] Docker configuration for microservices architecture
- [ ] Single command launches entire application (mandatory requirement)
- [ ] Autonomous container operation (mandatory requirement)
- [ ] Environment variables properly managed across containers
- [ ] Development and production configurations
- [ ] Meets mandatory Docker requirements from subject

### Issue #7: Initialize Fastify API server (Framework Backend Module)

**Description:**
Set up Fastify backend framework as required by the selected Framework Backend module: "Use a framework to build the backend... Fastify with Node.js". Configure according to subject specifications with plugin system, route auto-loading, and TypeScript.

**Acceptance Criteria:**

- [ ] Fastify server configured with TypeScript (subject requirement)
- [ ] Plugin auto-loading system implemented
- [ ] Route auto-loading from routes directory
- [ ] CORS configured for frontend communication
- [ ] Error handling middleware implemented
- [ ] Logging configured with appropriate levels
- [ ] Meets Framework Backend module requirements

### Issue #8: Implement basic API endpoints

**Description:**
Create initial API endpoints required for Standard User Management module and basic game operations. These endpoints will serve as foundation for all selected modules requiring backend communication.

**Acceptance Criteria:**

- [ ] User profile endpoints (GET, PUT /api/users/:id)
- [ ] Authentication status endpoint for OAuth flow
- [ ] Basic game endpoints (GET /api/games/:id)
- [ ] Proper HTTP status codes and error responses
- [ ] Request validation using Fastify schemas
- [ ] Integration with database package functions

## Epic 3: Authentication System (Required Modules)

### Issue #9: Set up OAuth provider configurations (Remote Authentication Module)

**Description:**
Configure OAuth applications as required by Remote Authentication module: "Implement a secure external authentication system using OAuth 2.0". Set up Google, GitHub, and 42 School as specified in modules.md.

**Acceptance Criteria:**

- [ ] Google OAuth application configured with correct scopes
- [ ] GitHub OAuth application configured
- [ ] 42 School OAuth application configured
- [ ] Environment variables documented for all providers
- [ ] Redirect URLs configured for development and production
- [ ] Meets OAuth 2.0 requirements from Remote Authentication module

### Issue #10: Implement OAuth flow backend (Remote Authentication Module)

**Description:**
Build complete OAuth authentication flow as specified in Remote Authentication module. Handle OAuth callbacks from all providers, use email as unique identifier as mentioned in modules.md: "Get Mail address somehow, this is our unique id for a user".

**Acceptance Criteria:**

- [ ] OAuth callback handlers for all three providers
- [ ] Token exchange and user info retrieval implemented
- [ ] User account creation/linking based on email matching (modules.md requirement)
- [ ] JWT token generation and signing
- [ ] Proper error handling for OAuth failures
- [ ] Meets Remote Authentication module specifications

### Issue #11: Create authentication middleware

**Description:**
Implement authentication middleware to protect API routes as required by subject security concerns. Support different authentication levels needed for Standard User Management and other selected modules.

**Acceptance Criteria:**

- [ ] JWT token validation middleware implemented
- [ ] Route protection for authenticated users
- [ ] User context injected into authenticated requests
- [ ] Proper error responses for auth failures
- [ ] Session management and token handling
- [ ] Middleware supports all selected modules' auth needs

## Epic 4: User Management (Standard User Management Module)

### Issue #12: Create user profile system (Standard User Management Module)

**Description:**
Implement user profile management as specified in Standard User Management module: "Users can update their information", "Users can upload an avatar", "Users can select a unique display name to participate in tournaments".

**Acceptance Criteria:**

- [ ] User profile endpoints with privacy controls
- [ ] Profile picture upload with file validation
- [ ] Nickname/display name management for tournaments
- [ ] Avatar upload with default option (module requirement)
- [ ] Profile picture resizing and optimization
- [ ] Nickname uniqueness validation for tournament participation

### Issue #13: Implement friends system (Standard User Management Module)

**Description:**
Create friends system as specified in Standard User Management module: "Users can add others as friends and view their online status". Implement all friend-related features required by the module.

**Acceptance Criteria:**

- [ ] Send friend request functionality
- [ ] Accept/decline friend request functionality
- [ ] List friends with online status (module requirement)
- [ ] Remove friend functionality
- [ ] User search for finding potential friends
- [ ] Friend request status tracking

### Issue #14: Build match history system (Standard User Management Module)

**Description:**
Implement match history as specified in Standard User Management module: "Each user has a Match History including 1v1 games, dates, and relevant details" and "User profiles display stats, such as wins and losses".

**Acceptance Criteria:**

- [ ] Match result storage with all required fields from module
- [ ] Match history retrieval with 1v1 games, dates, details
- [ ] Statistics calculation (wins, losses as specified in module)
- [ ] Match history accessible to logged-in users (module requirement)
- [ ] Head-to-head match history between users
- [ ] Performance optimization for match queries

## Epic 5: Frontend Foundation (Frontend Framework Module)

### Issue #15: Set up Vite with TypeScript (Mandatory + Frontend Module)

**Description:**
Configure frontend build system meeting mandatory requirement: "The frontend should be developed using Typescript as base code" and Frontend Framework module: "Tailwind CSS in addition of the Typescript, and nothing else".

**Acceptance Criteria:**

- [ ] TypeScript configuration (mandatory requirement)
- [ ] Tailwind CSS configuration (Frontend Framework module requirement)
- [ ] Build-time route discovery system for SPA
- [ ] Hot module replacement for development
- [ ] Production build optimization
- [ ] Meets mandatory frontend constraints

### Issue #16: Create SPA structure (Mandatory Requirement)

**Description:**
Build single-page application as required by mandatory part: "Your website must be a single-page application. The user should be able to use the Back and Forward buttons of the browser" and be compatible with latest Firefox.

**Acceptance Criteria:**

- [ ] Single-page application structure (mandatory requirement)
- [ ] Browser Back/Forward button support (mandatory requirement)
- [ ] Compatible with latest stable Firefox (mandatory requirement)
- [ ] Navigation component with proper routing
- [ ] Base layout components
- [ ] No unhandled errors or warnings (mandatory requirement)

### Issue #17: Implement API client utilities

**Description:**
Create API client system for communicating with Fastify backend. Support all authentication flows required by Remote Authentication module and data operations for Standard User Management module.

**Acceptance Criteria:**

- [ ] API client class with all HTTP methods
- [ ] Automatic JWT token injection for authenticated requests
- [ ] Request/response interceptors for OAuth flow
- [ ] TypeScript types for all API responses
- [ ] Error handling with user-friendly messages
- [ ] Support for all selected modules' API needs

### Issue #18: Build authentication UI components (Required Modules)

**Description:**
Create UI components for OAuth authentication flow required by Remote Authentication module. Include login/logout functionality and user session display for Standard User Management module.

**Acceptance Criteria:**

- [ ] OAuth login buttons for Google, GitHub, and 42 (module requirement)
- [ ] User profile dropdown with session info
- [ ] Login/logout flow components
- [ ] Authentication loading states and error handling
- [ ] Session expiration detection and handling
- [ ] Responsive design for all screen sizes

## Epic 6: Game Engine (Mandatory + Remote Players Module)

### Issue #19: Set up WebSocket server (Remote Players Module)

**Description:**
Implement WebSocket server for Remote Players module: "It should be possible for two players to play remotely. Each player is located on a separated computer, accessing the same website and playing the same Pong game."

**Acceptance Criteria:**

- [ ] WebSocket server for remote player communication
- [ ] Socket authentication using JWT tokens
- [ ] Connection handling for remote players on separate computers
- [ ] Message routing system for game events
- [ ] Network issue handling (disconnections, lag) as specified in module
- [ ] Connection cleanup and error handling

### Issue #20: Implement basic Pong game (Mandatory)

**Description:**
Create core Pong game meeting mandatory requirements: "Users must be able to participate in a live Pong game against another player directly on the website. Both players will use the same keyboard" and "All players must adhere to the same rules, including having identical paddle speed."

**Acceptance Criteria:**

- [ ] Basic Pong game for two players using same keyboard (mandatory)
- [ ] Ball physics with realistic movement and bouncing
- [ ] Paddle movement with identical speed for all players (mandatory requirement)
- [ ] Collision detection between ball and paddles/walls
- [ ] Scoring system with win conditions
- [ ] Game captures essence of original Pong (1972) (mandatory requirement)

### Issue #21: Add remote multiplayer (Remote Players Module)

**Description:**
Extend basic Pong to support Remote Players module requirements. Handle network issues and provide best user experience as specified: "Consider network issues, such as unexpected disconnections or lag. You must offer the best user experience possible."

**Acceptance Criteria:**

- [ ] Remote player support for players on separate computers
- [ ] Real-time player position synchronization
- [ ] Lag compensation for network delays
- [ ] Graceful handling of unexpected disconnections (module requirement)
- [ ] Best possible user experience during network issues
- [ ] Fair gameplay with consistent paddle speeds

### Issue #22: Create server-side validation (Server-Side Logic Module)

**Description:**
Implement server-side validation as part of Server-Side Logic module: "Replace basic Pong with server-side Pong". Add anti-cheat validation to ensure fair gameplay in remote multiplayer scenarios.

**Acceptance Criteria:**

- [ ] Server-side game logic replaces basic client-side version
- [ ] Server-side validation of all player movements
- [ ] Ball position and velocity validation
- [ ] Detection of impossible game state changes
- [ ] Movement speed validation for identical paddle speeds
- [ ] Logging system for suspicious activities

## Epic 7: Tournament System (Mandatory)

### Issue #23: Design tournament data models (Mandatory)

**Description:**
Design database schema for mandatory tournament system: "A tournament system should also be available. This tournament will consist of multiple players who can take turns playing against each other" and "it must clearly display who is playing against whom and the order of the play."

**Acceptance Criteria:**

- [ ] Tournament model supporting multiple players
- [ ] Match model with participant and result tracking
- [ ] Bracket structure showing play order (mandatory requirement)
- [ ] Tournament state management (registration, active, completed)
- [ ] Display of who plays against whom (mandatory requirement)
- [ ] Database relationships for tournament flow

### Issue #24: Implement registration system (Mandatory)

**Description:**
Create registration system meeting mandatory requirement: "A registration system is required: at the start of a tournament, each player must input their alias. The aliases will be reset when a new tournament begins." Enhanced by Standard User Management module for persistent accounts.

**Acceptance Criteria:**

- [ ] Tournament registration with alias input (mandatory)
- [ ] Alias reset when new tournament begins (mandatory requirement)
- [ ] Integration with Standard User Management for registered users
- [ ] Support for both manual aliases and registered account names
- [ ] Registration validation and duplicate handling

### Issue #25: Build matchmaking system (Mandatory)

**Description:**
Implement matchmaking as required: "There must be a matchmaking system: the tournament system should organize the matchmaking of the participants, and announce the next match." Create bracket system for tournament progression.

**Acceptance Criteria:**

- [ ] Matchmaking system organizing participants (mandatory requirement)
- [ ] Next match announcements (mandatory requirement)
- [ ] Knockout bracket generation and management
- [ ] Automatic winner advancement logic
- [ ] Tournament progression tracking
- [ ] Clear display of tournament bracket and order

## Epic 8: Server-Side Pong & CLI (Server-Side Modules)

### Issue #26: Implement server-side Pong API (Server-Side Logic Module)

**Description:**
Replace basic Pong with server-side implementation as required by Server-Side Logic module: "Replace basic Pong with server-side Pong and implement an API". Create API endpoints to support both web and CLI clients.

**Acceptance Criteria:**

- [ ] Server-side Pong logic replaces basic client-side version
- [ ] API endpoints for game initialization and controls
- [ ] Game state updates via API
- [ ] Integration with web application for seamless gameplay
- [ ] API supports both web interface and CLI usage
- [ ] Responsive server-side game experience

### Issue #27: Create CLI Pong client (CLI Integration Module)

**Description:**
Build command-line interface as specified in CLI Integration module: "Enabling Pong gameplay via CLI against web users with API integration". CLI users must be able to play against web users seamlessly.

**Acceptance Criteria:**

- [ ] CLI application replicating web Pong experience
- [ ] API integration for CLI-to-web communication
- [ ] User authentication within CLI
- [ ] Real-time synchronization between CLI and web users
- [ ] Cross-platform gameplay (CLI vs web users)
- [ ] ASCII graphics and keyboard controls for terminal

## Epic 9: Security & Deployment (Mandatory + Microservices)

### Issue #28: Implement security requirements (Mandatory)

**Description:**
Implement all mandatory security requirements: "Any password stored in your database, if applicable, must be hashed", "Your website must be protected against SQL injections/XSS attacks", "enable an HTTPS connection for all aspects", "implement validation mechanisms for forms and any user input".

**Acceptance Criteria:**

- [ ] Password hashing with strong algorithm (mandatory requirement)
- [ ] SQL injection protection (mandatory requirement)
- [ ] XSS attack protection (mandatory requirement)
- [ ] HTTPS enforcement across all services (mandatory requirement)
- [ ] Form validation and input sanitization (mandatory requirement)
- [ ] Environment variables in .env file, ignored by git (mandatory requirement)

### Issue #29: Set up microservices architecture (Microservices Module)

**Description:**
Design backend as microservices as specified in Microservices Architecture module: "Designing the backend as microservices". Divide backend into loosely-coupled services with clear boundaries.

**Acceptance Criteria:**

- [ ] Backend divided into loosely-coupled microservices
- [ ] Clear boundaries and interfaces between services
- [ ] Communication mechanisms (REST APIs) between services
- [ ] Each microservice responsible for single business capability
- [ ] Independent deployment and scaling capabilities
- [ ] Service discovery and coordination mechanisms

### Issue #30: Set up CI/CD and deployment (Microservices Module)

**Description:**
Implement CI/CD pipeline supporting microservices deployment. Include automated testing, linting, and deployment as mentioned in modules.md: "Production and Staging Branches", "Automatic CI/CD", "Linting", "Automatic Deployment to Cloud server".

**Acceptance Criteria:**

- [ ] GitHub Actions workflow for CI/CD
- [ ] Automated testing on pull requests
- [ ] Code linting and formatting checks
- [ ] Production and staging branch workflows
- [ ] Automated deployment to cloud server
- [ ] Microservices-compatible deployment strategy
