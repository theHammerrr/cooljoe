-- AlterTable
ALTER TABLE "DraftJob" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DraftJobAttempt" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DraftJobEvent" ALTER COLUMN "id" DROP DEFAULT;
