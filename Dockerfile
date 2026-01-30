# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20.11-alpine AS builder

# Install build dependencies (openssl for Prisma)
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies with BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_PROVIDER=prisma \
    NEXT_PUBLIC_AUTH_PROVIDER=nextauth

# Build the application
RUN npm run build

# ============================================
# Stage 2: Runner (Production)
# ============================================
FROM node:20.11-alpine AS runner

# OCI labels for image metadata
LABEL org.opencontainers.image.title="ACA Barcode Scanner" \
      org.opencontainers.image.description="Barcode scanning application for ACA" \
      org.opencontainers.image.vendor="ACA"

# Install runtime dependencies only
RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

# Set runtime environment variables
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Create non-root user for security (combined for fewer layers)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime migrations (with proper ownership)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check (simplified - node already exits with proper code)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Use entrypoint for migrations and startup
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
