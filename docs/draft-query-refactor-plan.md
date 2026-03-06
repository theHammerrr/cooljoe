# Draft Query Refactor Plan (DDD + Event-Driven)

## Current problem
The draft-query path mixes transport concerns, orchestration, policy decisions, and heuristics in controller-level code. Retries and safeguards were layered incrementally, which makes behavior hard to reason about and hard to evolve safely.

## Target architecture

### Bounded contexts
- Drafting
  - Input validation, context assembly, plan generation, validation, retry policy.
- Execution
  - SQL safety checks, allowlist policy, query execution.
- Knowledge
  - Schema snapshot retrieval, glossary/recipe retrieval, embeddings.
- Conversation
  - Chat intent routing, suggested actions.

### Domain model (Drafting context)
- Aggregate: `DraftJob`
  - Identity: `draftJobId`
  - Fields: question, mode, constraints, requiredSchema, attemptCount, stage, result, failureReason.
  - Invariants:
    - question must be non-empty and bounded.
    - terminal states (`completed`, `failed`) are immutable.
    - retry count is bounded by policy.

### Domain events
- `draft.started`
- `draft.context_collected`
- `draft.attempt_started`
- `draft.attempt_failed`
- `draft.validation_failed`
- `draft.completed`
- `draft.failed`

Events are immutable facts and become the source for:
- user-facing status updates,
- observability/metrics,
- troubleshooting and replay.

## Implementation phases

### Phase 1 (done in this change set)
- Add strict draft command schema and fail fast on invalid requests.
- Introduce Draft domain primitives and event bus.
- Route stage tracking through domain events (instead of direct mutable writes).
- Fix reliability gaps:
  - balanced compile/validate timers,
  - non-overlapping status polling,
  - unique chat error IDs,
  - include schema in draft context payload,
  - fix name-intent regex boundary bug.

### Phase 2 (implemented)
- Introduce `DraftJob` application service:
  - single orchestration entrypoint (`runDraftJob`),
  - policy object for deterministic-vs-LLM arbitration,
  - retry strategy interface (`shouldRetry`, `nextConstraints`).
- Persist draft attempts and events (DB table or append-only log).
- Replace ad-hoc `requestId` with server-generated `draftJobId` + scoped status token.

Implemented artifacts:
- `apps/api/src/copilot/application/draftQueryApplicationService.ts`
- `apps/api/src/copilot/application/draftJobStore.ts`
- `apps/api/src/copilot/domain/draftQueryToken.ts`
- `POST /api/copilot/draft-query-token`
- token-protected `POST /api/copilot/draft-query` and `GET /api/copilot/draft-query-status/:requestId`
- migration `20260306143000_add_draft_job_tracking`

### Phase 3
- Move validation to a policy pipeline with explicit gates:
  - schema validity,
  - semantic intent fulfillment,
  - ambiguity checks.
- Add idempotency key support for repeated draft submissions.
- Emit metrics from events: p95 draft latency, retry rate, schema-failure rate, semantic-failure rate.

### Phase 4
- Split API transport from application orchestration:
  - thin controllers,
  - use-cases in application layer,
  - repositories/adapters for retrieval and LLM providers.
- Add contract tests for each bounded context boundary.

## Required follow-up fixes from audit
- Enforce operator/value consistency for filters (`IN` requires array).
- Reject ambiguous unqualified columns in schema validator.
- Migrate status endpoint to server-owned opaque IDs (no externally guessable tracker keys).
