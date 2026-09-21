# ==============================================================================
# Production Dockerfile for Next.js Frontend (Standalone)
# ==============================================================================

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy pre-built standalone output and static assets
COPY apps/frontend/public ./public
COPY apps/frontend/public ./apps/frontend/public
COPY apps/frontend/.next/standalone ./
COPY apps/frontend/.next/static ./.next/static
COPY apps/frontend/.next/static ./apps/frontend/.next/static

EXPOSE 3000

CMD ["sh", "-c", "if [ -f apps/frontend/server.js ]; then node apps/frontend/server.js; else node server.js; fi"]
