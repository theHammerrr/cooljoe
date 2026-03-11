ALTER TABLE "DraftJob"
ADD COLUMN "leaseOwner" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
