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
  - Database Package
    - Create Scheme from prisma.scheme and use the prisma workflow to create the table and database
    - ENV for where the file (or server) is located
    - Create DB getters (no get All Users!!! because of security)
      - GetUser[id] (make sure for authentication)
      - GetUserGroups[id]
      - AddUserToGroup[id]
      - GetGames[id] (use group for this)
      - Same for Setters
      - Create dummy data (with AI :)


    - Create DB setters
    - Create Package kind of implementation to use this in Backend (and Frontend for Types)
    - Authentication, is user allowed to do this?
    - Optional: DB cleaner
  - API Server
    - (Dynamic?) DB calls and JSON serving
    - Optional: Static JSON when no new updates for common calls
  
- **Frontend Framework** (Minor) - Tailwind CSS + TypeScript
  - Clientside
    - Fetching from API
    - SPA
  - Packing
    - Dynamic Routing (finding folders during build time)
      - Folder with html, ts and css to include in main APP.
    - Dyanmic Components
  

### User Management
- **Standard User Management** (Major) - Authentication, profiles, friends, match history
  - Profile page
    - Change Nickname / Change Picture
      - User changes and this gets updated in DB
      - Frontend API GET to load user then POST to change details
    - See Friends (from DB)
    - See Match History (from DB)
      - List with matches
        - Timestamp
        - Opponent
        - Score
        - Win/Lose
        - How long it was
    - Optional delete your data > deleted user
- **Remote Authentication** (Major) - OAuth 2.0 implementation
  - Store Auth provider JWT (backend or frontend?) for every providers are okay if mail matches
  - Get Mail adres somehow, this is our uniqe id for a user
  - Authenticon Flow with Google and Github and 42
  - API keys in .env

### Gameplay & Experience  
- **Remote Players** (Major) - Network multiplayer with disconnect/lag handling
  - Socket server
    - Socket Authentication
  - Game Logic
    - Ball position
    - Paddle position
    - Score
    - Serverside game check against cheat is in limits
    - Synth

### DevOps
- **Microservices Architecture** (Major) - Backend as loosely-coupled services
  - Lot of docker containers
  - Production and Staging Branches
  - Automomatic CI/CI
  - Linting
  - Automatic Deployment to Cloud server

### Server-Side Pong
- **Server-Side Logic** (Major) - Replace basic Pong with server-side implementation + API
  - See above
- **CLI Integration** (Major) - Command-line interface for playing against web users
  - Pong in Terminal NodeJS TS
  - Same thing as frontend but with ASCII Output

## Module Dependencies & Notes
- Database module is prerequisite for backend framework
- Remote players strongly recommended for multiplayer modules
- OAuth preferred over password management for security
- Microservices architecture supports scalability goals
- Server-side modules work together (API + CLI)
