# Install stage for the API application using Node.js
FROM node:20-alpine AS build-socket

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

# Install pnpm
RUN corepack enable pnpm

# Set working directory to workspace root
WORKDIR /workspace

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json ./

# Copy all packages (shared dependencies)
COPY packages/database ./packages/database
COPY packages/types ./packages/types

# Copy Socket application
COPY apps/socket/ ./apps/socket/

# Install all dependencies (including shared packages)
RUN pnpm install

# Build shared packages first
RUN pnpm run --filter="db" build
RUN pnpm run --filter="types" build

# Generate Prisma client for the Linux platform
WORKDIR /workspace/packages/database
RUN pnpm exec prisma generate

# Set working directory to Socket app
WORKDIR /workspace/apps/socket

# Build the Socket application
RUN pnpm run build

# # Production stage
FROM node:20-alpine AS production-socket

ARG DATABASE_URL
ARG API_SERVER
ARG ADMIN_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV API_SERVER=$API_SERVER
ENV ADMIN_API_KEY=$ADMIN_API_KEY


# # Install pnpm
RUN corepack enable pnpm

# # Set working directory
WORKDIR /app

# # Copy package files
COPY --from=build-socket /workspace/package.json /workspace/pnpm-workspace.yaml ./
COPY --from=build-socket /workspace/packages/ ./packages/
COPY --from=build-socket /workspace/apps/socket/package.json ./apps/socket/

# # Copy schema.prisma and generated client from build stage (before installing deps)
COPY --from=build-socket /workspace/packages/database/schema.prisma ./packages/database/
COPY --from=build-socket /workspace/packages/database/generated/ ./packages/database/generated/

# # Install production dependencies only  
RUN pnpm install --prod --no-frozen-lockfile

# # Set working directory to Socket app
WORKDIR /app/apps/socket

# # Copy built application
COPY --from=build-socket /workspace/apps/socket/dist/ ./dist/

# # Expose the port (adjust if needed)
EXPOSE 3000

# # Start the application
CMD ["node", "dist/app.js"]
