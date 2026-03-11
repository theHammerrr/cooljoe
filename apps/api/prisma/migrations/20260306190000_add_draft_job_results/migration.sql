ALTER TABLE "DraftJob"
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN "resultStatus" INTEGER,
ADD COLUMN "resultPayload" JSONB,
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

UPDATE "DraftJob"
SET
    "status" = CASE
        WHEN "done" = TRUE AND "error" IS NOT NULL THEN 'failed'
        WHEN "done" = TRUE THEN 'completed'
        ELSE 'running'
    END,
    "startedAt" = COALESCE("startedAt", "createdAt"),
    "completedAt" = CASE
        WHEN "done" = TRUE THEN COALESCE("completedAt", "updatedAt")
        ELSE NULL
    END;
