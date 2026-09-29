# JOV3

JOV3 personal website, built with Nuxt 4, PostgreSQL, and Prisma.

## Requirements

- Node.js 24.14.0
- pnpm 11.15.1
- Docker Desktop or another Docker Compose-compatible runtime

## Setup

```bash
corepack enable
corepack prepare pnpm@11.15.1 --activate
pnpm install
cp .env.example .env
pnpm db:up
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

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
