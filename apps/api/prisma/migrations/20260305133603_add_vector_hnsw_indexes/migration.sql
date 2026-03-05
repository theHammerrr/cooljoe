-- Add ANN indexes for pgvector cosine similarity lookups used by retrievalService
CREATE INDEX IF NOT EXISTS "QueryRecipe_embedding_hnsw_idx"
ON "QueryRecipe"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "SemanticDoc_embedding_hnsw_idx"
ON "SemanticDoc"
USING hnsw ("embedding" vector_cosine_ops)
WHERE "embedding" IS NOT NULL;