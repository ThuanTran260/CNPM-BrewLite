# ==============================================================================
# Multi-Stage Dockerfile for Next.js Frontend (Standalone)
# ==============================================================================

# Stage 1: Build & compile application inside container
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root manifests and workspace package manifests
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies for all workspaces
RUN npm ci

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Build Next.js with standalone output
WORKDIR /app/apps/frontend
ARG NEXT_PUBLIC_API_URL="http://localhost:3001/api"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pre-built standalone output and static assets
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000

CMD ["sh", "-c", "if [ -f apps/frontend/server.js ]; then node apps/frontend/server.js; else node server.js; fi"]
