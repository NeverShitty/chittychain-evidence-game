# ChittyChain Evidence Game - Production Docker Container
FROM node:18-alpine

# Install system dependencies for ChittyChain
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs temp backups generated_documents

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3101
ENV MCP_PORT=3100

# Expose ports
EXPOSE 3101 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3101/api/chain/status || exit 1

# Start game server
CMD ["node", "chittychain-game-server.js"]