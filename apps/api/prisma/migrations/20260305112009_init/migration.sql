-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "SemanticDoc" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'glossary',
    "metadata" JSONB,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SemanticDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryRecipe" (
    "id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "sqlQuery" TEXT NOT NULL,
    "prismaQuery" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QueryRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemaSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topology" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemaSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "queryHash" TEXT NOT NULL,
    "sqlQuery" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'anonymous',
    "runtimeMs" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "queryLogId" TEXT,
    "recipeId" TEXT,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SemanticDoc_term_key" ON "SemanticDoc"("term");

-- CreateIndex
CREATE UNIQUE INDEX "SchemaSnapshot_name_key" ON "SchemaSnapshot"("name");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_queryLogId_fkey" FOREIGN KEY ("queryLogId") REFERENCES "QueryLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "QueryRecipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
