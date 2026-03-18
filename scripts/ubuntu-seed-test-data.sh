#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/var/www/cloud_board_lab"

cd "$PROJECT_ROOT"

echo "Seeding 20 test posts with attachments"
npm run seed:test-posts
