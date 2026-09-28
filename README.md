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
