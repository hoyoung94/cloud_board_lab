#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/var/www/cloud_board_lab}"
APP_NAME="cloud-board-lab"

cd "$PROJECT_ROOT"

if [ ! -f ".env" ]; then
  echo ".env file not found in $PROJECT_ROOT"
  exit 1
fi

echo "[1/6] Installing dependencies"
npm ci

echo "[2/6] Generating Prisma client"
npm run prisma:generate

echo "[3/6] Applying production migrations"
npx prisma migrate deploy

echo "[4/6] Building Next.js app"
npm run build

echo "[5/6] Starting PM2 process"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" --update-env
else
  pm2 start ecosystem.config.cjs --env production
fi

echo "[6/6] Saving PM2 process list"
pm2 save

echo "First deploy complete"
echo "Run 'pm2 startup' once if boot persistence is not configured yet."
