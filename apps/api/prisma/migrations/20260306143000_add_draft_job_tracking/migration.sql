CREATE TABLE "DraftJob" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "preferredMode" TEXT NOT NULL,
    "constraints" TEXT,
    "stage" TEXT NOT NULL,
    "attempt" INTEGER,
    "detail" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DraftJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DraftJob_requestId_key" ON "DraftJob"("requestId");
CREATE INDEX "DraftJob_updatedAt_idx" ON "DraftJob"("updatedAt");

CREATE TABLE "DraftJobEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "attempt" INTEGER,
    "detail" TEXT,
    "error" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DraftJobEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DraftJobEvent_requestId_occurredAt_idx" ON "DraftJobEvent"("requestId", "occurredAt");

CREATE TABLE "DraftJobAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL,
    "sql" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "issues" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DraftJobAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DraftJobAttempt_requestId_attempt_idx" ON "DraftJobAttempt"("requestId", "attempt");
