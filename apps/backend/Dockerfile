# ==============================================================================
# Multi-stage Dockerfile for NestJS Backend
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configs
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies (including dev)
RUN npm install

# Copy source code and prisma
COPY apps/backend ./apps/backend

WORKDIR /app/apps/backend

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build

# ==============================================================================
# Production Runner
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app/apps/backend

ENV NODE_ENV=production

# Copy built artifacts and dependencies from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 3001

# Entrypoint: deploy migrations -> seed if SEED=true -> start:prod
CMD sh -c "npx prisma migrate deploy && if [ \"$SEED\" = \"true\" ]; then npx ts-node prisma/seed.ts; fi && node dist/main.js"
