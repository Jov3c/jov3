FROM node:24-bookworm-slim AS build

WORKDIR /app
ARG DATABASE_URL=postgresql://jov3:build-only@postgres:5432/jov3?schema=public
ENV DATABASE_URL=${DATABASE_URL}
RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@11.15.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm exec nuxt prepare && pnpm prisma:generate && pnpm build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --system --uid 10001 --create-home jov3 \
  && mkdir -p /srv/jov3/data/uploads /srv/jov3/data/geo \
  && chown -R jov3:jov3 /srv/jov3

COPY --chown=jov3:jov3 --from=build /app/node_modules ./node_modules
COPY --chown=jov3:jov3 --from=build /app/package.json ./package.json
COPY --chown=jov3:jov3 --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=jov3:jov3 --from=build /app/prisma7.config.ts ./prisma7.config.ts
COPY --chown=jov3:jov3 --from=build /app/prisma ./prisma
COPY --chown=jov3:jov3 --from=build /app/server/generated ./server/generated
COPY --chown=jov3:jov3 --from=build /app/server/services ./server/services
COPY --chown=jov3:jov3 --from=build /app/server/utils ./server/utils
COPY --chown=jov3:jov3 --from=build /app/shared ./shared
COPY --chown=jov3:jov3 --from=build /app/scripts/remove-footprint-media.mjs ./scripts/remove-footprint-media.mjs
COPY --chown=jov3:jov3 --from=build /app/.output ./.output
COPY --chmod=755 docker/app-entrypoint.sh /usr/local/bin/jov3-entrypoint

USER jov3
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/jov3-entrypoint"]
