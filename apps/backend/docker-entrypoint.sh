#!/bin/sh
set -e

echo "🚀 [BrewLite Backend] Container starting up..."

# Run database migrations
echo "📦 [BrewLite Backend] Running Prisma database migrations..."
npx prisma migrate deploy

# Run seed if SEED is true
if [ "$SEED" = "true" ] || [ "$SEED" = "1" ]; then
  echo "🌱 [BrewLite Backend] SEED=true detected. Seeding sample database..."
  npx prisma db seed || echo "⚠️ Seed script completed with notices."
fi

echo "✨ [BrewLite Backend] Starting NestJS production server..."
exec node dist/main.js
