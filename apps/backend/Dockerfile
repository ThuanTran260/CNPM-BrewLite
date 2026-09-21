# ==============================================================================
# Production Dockerfile for NestJS Backend (Fast Host Pre-built)
# ==============================================================================

FROM node:20-alpine AS runner

WORKDIR /app/apps/backend

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy dependencies and pre-built artifacts
COPY node_modules /app/node_modules
COPY apps/backend/dist ./dist
COPY apps/backend/package*.json ./
COPY apps/backend/prisma ./prisma

EXPOSE 3001

# Entrypoint: start NestJS application directly
CMD ["node", "dist/main.js"]
