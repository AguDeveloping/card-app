FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json .
COPY package-lock.json .
COPY tsconfig.json .

# Install ALL dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY /src ./src
COPY /types ./types

# Build TypeScript
RUN npm run build

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json .
COPY package-lock.json .

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist

# Install wget and fix permissions
RUN apk add --no-cache wget && \
  addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 && \
  chown -R nodejs:nodejs /app

# Switch to nodejs user
USER nodejs

# Railway automatically sets PORT environment variable
EXPOSE $PORT

# Temporarily disable health check to debug startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Simple command - Railway provides PORT automatically
CMD ["node", "dist/server.js"]