# Contributing

Thanks for taking a look at `cooljoe`.

This project is a self-hosted side project. The goal is to keep it useful, understandable, and fun to work on rather than over-engineered.

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment:

- copy [.env.example](/F:/GitRepos/cooljoe/.env.example)
- or use [apps/api/.env.example](/F:/GitRepos/cooljoe/apps/api/.env.example) if you are only working on the API

3. Start the repo:

```bash
pnpm dev
```

## Useful commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Targeted commands:

```bash
pnpm --filter @cooljoe/api typecheck
pnpm --filter @cooljoe/web typecheck
pnpm vitest run
```

## Project assumptions

- this is intended to run against a database the user controls
- `SQL` is the primary execution path today
- `Prisma` is currently a generated/export-oriented mode, not a complete first-class execution backend

## Contribution style

- keep changes focused
- prefer small modules over large files
- do not loosen lint rules to get around a structural issue
- if behavior changes, add or update tests where practical

## Bug reports

When opening an issue, include:

- what you expected
- what happened instead
- the prompt/query used
- screenshots if the problem is UI-related
- environment details if it is setup-related

## Pull requests

A good PR usually includes:

- a short explanation of the problem
- the concrete fix
- any tradeoffs or limitations
- validation steps you ran
