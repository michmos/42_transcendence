# Install stage for the web application using Node.js
FROM node:20-alpine AS build-web

# Install pnpm
RUN corepack enable pnpm

# Set working directory to workspace root
WORKDIR /workspace

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json ./

# Copy all packages (shared dependencies)
COPY packages/ ./packages/

# Copy application
COPY ./apps/web/ ./apps/web/

# Install all dependencies (including shared packages)
RUN pnpm install

# Generate Prisma client for the Linux platform (must be done before building db package)
WORKDIR /workspace/packages/database
RUN pnpm exec prisma generate

# Build shared packages
WORKDIR /workspace
RUN pnpm run --filter="db" build
RUN pnpm run --filter="fastify-oauth" build
RUN pnpm run --filter="types" build

# Set working directory to application
WORKDIR /workspace/apps/web

# Build the application
RUN pnpm run build

# Copy built files to volume mount point
ENTRYPOINT [ "cp", "-rvp", "/workspace/apps/web/dist/.", "/www" ]
