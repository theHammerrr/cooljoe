# cooljoe

Self-hosted AI database copilot for exploring a project schema, chatting about data, generating SQL drafts, and exporting query results.

This is a side project, not a hosted SaaS product. The intended model is:
- you run it for your own project
- you point it at your own database
- you decide how much you trust the generated output

## What it does

- schema explorer for connected databases
- AI chat with streamed responses
- SQL draft generation with validation and retry flow
- Prisma draft generation for editor/export use
- query execution and result export
- local persistence for chat/draft recovery

## Current product contract

- `SQL` is the real execution path today.
- `Prisma` is supported as a generated output and workspace mode, but it is not a full first-class execution backend yet.
- the app is optimized for self-hosted use against a database you control

## Monorepo layout

- `apps/api`: Express + Prisma backend
- `apps/web`: React + Vite frontend

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example env file you want to use:

- root: [.env.example](/F:/GitRepos/cooljoe/.env.example)
- API-only: [apps/api/.env.example](/F:/GitRepos/cooljoe/apps/api/.env.example)

Important variables:

- `DATABASE_URL`: database used by the app itself for local state, analytics, schema snapshots, and draft jobs
- `PROJECT_DATABASE_URL`: database the workspace actually explores and queries
- `AI_PROVIDER`: `openai` or `ollama`
- `OPENAI_API_KEY`: required when using OpenAI
- `OLLAMA_HOST`: optional when using Ollama

Notes:

- `PROJECT_DATABASE_URL` is the preferred name
- legacy `TARGET_DATABASE_URL` is still supported as a fallback
- using a read-only database user for `PROJECT_DATABASE_URL` is strongly recommended

### 3. Run the app

```bash
pnpm dev
```

Typical local URLs:

- web: `http://localhost:5173` or the Vite port shown in the terminal
- api: `http://localhost:3001`

## Docker

There is a repo-level [docker-compose.yml](/F:/GitRepos/cooljoe/docker-compose.yml) for a local all-in-one setup.

There is also a dedicated [docker-compose.query-analysis.yml](/F:/GitRepos/cooljoe/docker-compose.query-analysis.yml) for query-analysis validation against a seeded large-data target database with intentionally problematic access patterns.

Before using it, set:

- `PROJECT_DATABASE_URL`
- `OPENAI_API_KEY` if using OpenAI
- or ensure Ollama is reachable from the container

Choose the compose file based on what you are trying to do:

- `docker-compose.yml`: regular local app setup
- `docker-compose.query-analysis.yml`: seeded query-analysis lab for validating recommendations

## Limitations

- Prisma execution is not first-class yet
- draft quality still depends on heuristics plus schema quality
- this is not built as a multi-tenant secure hosted product
- generated queries should be reviewed before being trusted in important workflows

## Why the security model is light

This repo is meant to be run by a developer on their own project. Because of that:

- auth and tenant isolation are intentionally light
- the connected project database is configured through environment variables
- the app assumes the operator controls the environment

That said, SQL execution is still treated conservatively:

- read-only validation
- single-statement enforcement
- schema-aware validation

## Suggested setup

For the best experience:

1. use a dedicated app database for `DATABASE_URL`
2. use a read-only user for `PROJECT_DATABASE_URL`
3. keep OpenAI/Ollama credentials local
4. treat generated SQL and Prisma as developer assistance, not guaranteed truth

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```
