# Install stage for the web application using Node.js
FROM node:20-alpine AS build-web

# Set working directory
WORKDIR /builder

# Copy package files and install dependencies
COPY ./package.json .
RUN npm install

# Copy the rest of the application source code (include root static files Vite needs)
COPY ./vite.config.ts .
COPY ./tsconfig.json .
COPY ./src/ ./src

# Build the web application
RUN npm run build

# Copy built files to volume mount point
ENTRYPOINT [ "cp", "-rvp", "/builder/dist/.", "/www" ]
