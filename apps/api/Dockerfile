# Install stage for the API application using Node.js
FROM node:20-alpine AS build-api

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG SOCKET_SERVER
ENV SOCKET_SERVER=$SOCKET_SERVER

ARG CDN_PATH
ENV CDN_PATH=$CDN_PATH

# Install pnpm
RUN corepack enable pnpm

# Set working directory to workspace root
WORKDIR /workspace

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all packages (shared dependencies)
COPY packages/ ./packages/

# Copy API application
COPY apps/api/ ./apps/api/

# Install all dependencies (including shared packages)
RUN pnpm install

# Build shared packages first
RUN pnpm run --filter="db" build
RUN pnpm run --filter="fastify-oauth" build
RUN pnpm run --filter="types" build

# Generate Prisma client for the Linux platform
WORKDIR /workspace/packages/database
RUN pnpm exec prisma generate

# Set working directory to API app
WORKDIR /workspace/apps/api

# Build the API application
RUN pnpm run build

# # Production stage
FROM node:20-alpine AS production-api

ARG CORS_URL
ENV CORS_URL=$CORS_URL

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

ARG CDN_PATH
ENV CDN_PATH=$CDN_PATH

ARG ADMIN_API_KEY
ENV ADMIN_API_KEY=$ADMIN_API_KEY

ARG GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

ARG GOOGLE_CLIENT_SECRET
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

ARG FORTYTWO_CLIENT_ID
ENV FORTYTWO_CLIENT_ID=$FORTYTWO_CLIENT_ID

ARG FORTYTWO_CLIENT_SECRET
ENV FORTYTWO_CLIENT_SECRET=$FORTYTWO_CLIENT_SECRET

ARG GITHUB_CLIENT_ID
ENV GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID

ARG GITHUB_CLIENT_SECRET
ENV GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET

ARG REDIRECT_URL
ENV REDIRECT_URL=$REDIRECT_URL

ARG JWT_SECRET
ENV JWT_SECRET=$JWT_SECRET





# # Install pnpm
RUN corepack enable pnpm

# # Set working directory
WORKDIR /app

# # Copy package files
COPY --from=build-api /workspace/package.json /workspace/pnpm-workspace.yaml /workspace/pnpm-lock.yaml ./
COPY --from=build-api /workspace/packages/ ./packages/
COPY --from=build-api /workspace/apps/api/package.json ./apps/api/

# # Install production dependencies only  
RUN pnpm install --prod

# # Ensure Prisma client is generated for the correct platform
WORKDIR /app/packages/database
RUN pnpm exec prisma generate

# # Copy schema.prisma and generated client from build stage
COPY --from=build-api /workspace/packages/database/schema.prisma ./packages/database/
COPY --from=build-api /workspace/packages/database/generated/ ./packages/database/generated/

# # Set working directory to API app
WORKDIR /app/apps/api

# # Copy built application
COPY --from=build-api /workspace/apps/api/dist/ ./dist/

# # Expose the port (adjust if needed)
EXPOSE 3000

# # Start the application
CMD ["node", "dist/app.js"]
