#!/usr/bin/env sh
set -eu

node scripts/remove-footprint-media.mjs
./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts
exec node .output/server/index.mjs
