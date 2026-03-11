# Current Limitations

This project is intentionally built as a self-hosted side project, not a hosted multi-tenant product.

That means some tradeoffs are deliberate.

## Product boundaries

- `SQL` is the primary execution path
- `Prisma` is supported as a generated/editor-oriented output, but not a complete first-class execution backend yet
- the app assumes the operator controls the environment and the connected database

## Draft quality

- draft generation still uses heuristics in a few places
- semantic matching is improving, but not fully general yet
- some prompts may still need clarification or more explicit wording

## Safety model

- the app tries to keep SQL execution read-only
- this is not a substitute for database-level permissions
- using a read-only database user for `PROJECT_DATABASE_URL` is strongly recommended

## Self-hosted expectations

- environment configuration is part of the product contract
- database connectivity is configured through env vars
- there is no strong multi-tenant security boundary because that is not the target use case right now

## UI / UX

- the studio workflow is desktop-first
- some flows are still being stabilized through manual testing and iteration

## Non-goals for now

- enterprise auth and tenancy
- perfect natural-language understanding
- full Prisma execution parity with SQL
- zero-heuristic draft planning
