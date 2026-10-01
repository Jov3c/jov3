# JOV3

JOV3 personal website, built with Nuxt 4, PostgreSQL, and Prisma.

Public pages reproduce the checked-in HTML prototypes. Foundation, Home/Projects,
prototype-layout, and admin styles are kept in separate bundles. Home and Projects
load their route styles directly; prototype and admin styles load through their
respective layouts.

## Requirements

- Node.js 24.14.0
- pnpm 11.15.1
- PostgreSQL 16

Docker Compose is optional. Local development can use any compatible
PostgreSQL instance configured through `DATABASE_URL`.

## Setup

```bash
corepack enable
corepack prepare pnpm@11.15.1 --activate
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm admin:bootstrap
pnpm site:init
```

If Docker is available, `pnpm db:up` can be used before the migration step;
the application does not seed or rewrite site content during startup.

On Windows PowerShell, replace the environment copy command with:

```powershell
Copy-Item .env.example .env
```

## Development

```bash
pnpm dev
```

Media uploads are kept outside the repository and build output. When
`MEDIA_STORAGE_ROOT` is not set, local development uses `.data/uploads/`; the
production value is `/srv/jov3/data/uploads/`, which should be supplied as a
persistent host bind mount by the deployment configuration.

SMTP is provider-agnostic. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`,
optional credentials, sender fields, and `PUBLIC_SITE_URL` before enabling
visitor email verification flows.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

## Database

```bash
pnpm prisma:migrate:dev
pnpm prisma:studio
pnpm db:logs
pnpm db:down
```
