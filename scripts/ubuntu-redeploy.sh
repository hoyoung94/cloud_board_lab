#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/var/www/cloud_board_lab"

cd "$PROJECT_ROOT"

echo "[1/5] Installing dependencies"
npm ci

echo "[2/5] Generating Prisma client"
npm run prisma:generate

echo "[3/5] Applying production migrations"
npx prisma migrate deploy

echo "[4/5] Building Next.js app"
npm run build

echo "[5/5] Reloading PM2 process"
pm2 startOrReload ecosystem.config.cjs --update-env

echo "Redeploy complete"
