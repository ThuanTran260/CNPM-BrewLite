# ==============================================================================
# Multi-Stage Dockerfile for NestJS Backend
# ==============================================================================

# Stage 1: Build & compile application inside container
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy root manifests and workspace package manifests
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies for all workspaces
RUN npm ci

# Copy backend source code and prisma schema
COPY apps/backend ./apps/backend

# Generate Prisma Client & Compile NestJS app
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app/apps/backend

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001

# Copy root node_modules and built backend artifacts
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
