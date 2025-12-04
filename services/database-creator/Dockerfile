# Install stage for the API application using Node.js
FROM node:20-alpine AS build-api

ARG DATABASE_URL

ENV DATABASE_URL=$DATABASE_URL

# Install pnpm
RUN corepack enable pnpm

# Set working directory to workspace root
WORKDIR /database-creator

# Copy all packages (shared dependencies)
COPY packages/database/package.json .
COPY packages/database/schema.prisma .
COPY services/database-creator/scripts ./scripts

# Install all dependencies 
RUN pnpm install

CMD ["sh", "./scripts/create-database.sh"]
