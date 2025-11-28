## 42 Transcendence — Project Structure & Connections

### Monorepo overview

- **Workspace manager**: PNPM workspaces + Turborepo
- **Apps**:
  - `apps/web` — Vite SPA (browser)
  - `apps/api` — Fastify HTTP API (Node)
  - `apps/socket` — Fastify WebSocket server (Node)
- **Shared package**: `packages/prisma` — Prisma schema and generated client

### Root

- `package.json`
  - Scripts orchestrated by Turborepo: `db:generate`, `db:push`, `dev`, `build`, `preview`
- `turbo.json`
  - Wires dependencies between tasks (e.g., build depends on db:generate)
  - Exposes env vars to dev/preview tasks
- `pnpm-workspace.yaml`
  - Declares the workspace packages: `packages/prisma` and `apps/*`
- `README.md` and `docs/`
  - Local setup and module notes

### Shared database client — `packages/prisma`

- `schema.prisma`
  - Provider: SQLite
  - Models: `User`, `Group`, `oAuthProvider`, enum `userRole`
- Generated client
  - Output: `packages/prisma/generated/client`
  - Consumed by apps via the path dependency named `db`
- Scripts
  - `db:generate` → `prisma generate`
  - `db:push` → `prisma db push`
  - `db:studio` → `prisma studio`
- Environment
  - Requires `DATABASE_URL` (e.g., `file:./dev.db` when run from `packages/prisma`)
  - `packages/prisma/dev.db` is gitignored

### HTTP API — `apps/api`

- Purpose
  - Serve HTTP endpoints and access the shared Prisma client
- Main files
  - `src/app.ts` — Starts Fastify, auto-loads plugins and routes with `@fastify/autoload`
    - Plugins dir: `src/plugins`
    - API routes dir: `src/api`
  - `src/env.ts` — Validates env with `@t3-oss/env-core` (`API_URL`, `API_PORT`, `DATABASE_URL`)
  - `src/plugins/Database.ts` — Creates a Prisma client from the shared `db` package and exposes helpers: `getAllUsers`, `addUser`, `removeUser`
  - `src/plugins/cors.ts` — Basic permissive CORS headers
  - `src/api/user/index.ts` — User routes:
    - `GET /user` → list users
    - `POST /user` → create sample user
    - `DELETE /user` → delete user by hardcoded email (demo)
- Network
  - Binds to `0.0.0.0:${API_PORT}`
  - Requests from the SPA are proxied by Vite (`/api/*`)

### WebSocket server — `apps/socket`

- Purpose
  - WebSocket endpoint for realtime features
- Main files
  - `src/app.ts` — Starts Fastify, auto-loads plugins
  - `src/env.ts` — Validates `SOCKET_URL`, `SOCKET_PORT`, `DATABASE_URL`
  - `src/plugins/websocket.ts` — Registers `GET /websocket` via `@fastify/websocket`, logs messages, sends periodic pings
  - `src/plugins/Database.ts` — Same Prisma wrapper pattern as API
- Network
  - Binds to `0.0.0.0:${SOCKET_PORT}`
  - SPA connects via `/websocket` (proxied by Vite)

### Frontend SPA — `apps/web`

- Purpose
  - Single Page Application with dynamic, file-based routing
- Main files
  - `vite.config.ts`
    - Dev proxies:
      - `^/api(/.*)?$` → API server (rewrites `/api` prefix)
      - `/websocket` → Socket server (WS proxy)
    - Build:
      - Outputs to `out/`
      - Copies `src/routes/**` into `out/src/routes/**` for runtime HTML/CSS lookup
      - Custom plugin `createSpaRoutes()` duplicates the built `index.html` into route subfolders for deep-linking on static hosting
  - `index.html` — SPA entry
  - `src/app.ts` — Loads plugins:
    - `plugins/routes` — SPA router + dynamic loader
    - `plugins/fetch` — Exposes `getUsers`, `makeUser`, `deleteUser` on `window`
    - `plugins/socket` — Connects to `/websocket`
  - Routing system
    - `plugins/routes/router.ts` — Minimal history API router
    - `plugins/routes/index.ts` — Fallback that decides static vs dynamic route
    - `plugins/routes/dynamic.ts` — Loads route `index.html`, optional `index.css`, optional `index.ts` via `import.meta.glob`
    - `plugins/routes/utils.ts` — Render helpers
  - Route files under `src/routes/` (file-based)
    - Static routes: `index.*`, `about/index.*`, `settings/index.html`
    - Dynamic routes: `user[id]/*`, `info[id]/*`, `product[slug]/index.html`
    - Optional `index.ts` per route exports `initRoute(params?)` that runs after HTML/CSS load

### How folders connect

- Shared DB client

  - `apps/api` and `apps/socket` import Prisma types and client from the `db` path dependency → `packages/prisma/generated/client`

- SPA → API (HTTP)

  - Browser code calls `fetch('/api/...')`
  - Vite dev server proxies `/api/*` to the API server (port from env)
  - API uses Prisma client to read/write SQLite

- SPA → Socket (WebSocket)

  - Browser opens `ws://<host>/websocket`
  - Vite dev server proxies the WebSocket to the socket server

- Dynamic routing (SPA)
  - URL like `/info/123` is detected as dynamic → loader looks for `src/routes/info[id]/index.html|css|ts`
  - If `index.ts` exists, it calls `initRoute({ id: '123' })`

### Typical dev flows

```text
Users list (HTTP)
apps/web → fetch('/api/user') → Vite proxy → apps/api → Prisma → SQLite

Realtime ping (WS)
apps/web → new WebSocket('/websocket') → Vite WS proxy → apps/socket

Page load (routing)
apps/web/router → dynamic loader → fetch route HTML/CSS → optional initRoute()
```

### Environment variables

- Prisma requires `DATABASE_URL` at generation/push time
  - Preferred: place a real `.env` next to `packages/prisma/schema.prisma` with `DATABASE_URL="file:./dev.db"`
  - Alternative: inject env via script runner (e.g., dotenv-cli) so Turbo child processes inherit it
- Vite dev server uses `API_PORT`, `SOCKET_PORT`, `VITE_PORT` (defaults defined in code)

### Key takeaways

- Monorepo houses three processes (SPA, API, Socket) plus a shared Prisma client
- SPA talks to backend services only via HTTP/WS with Vite proxy in dev
- Both servers share types and DB access through `packages/prisma`
- Routes on the SPA are discovered by folder structure and loaded on demand
