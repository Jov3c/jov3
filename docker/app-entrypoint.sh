#!/usr/bin/env sh
set -eu

./node_modules/.bin/prisma migrate deploy --config prisma7.config.ts
./node_modules/.bin/tsx prisma/seed.ts
exec node .output/server/index.mjs
