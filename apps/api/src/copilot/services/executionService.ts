import { Pool } from 'pg';

let pool: Pool | null = null;

function getProjectDatabaseUrl(): string | undefined {
    return process.env.PROJECT_DATABASE_URL || process.env.TARGET_DATABASE_URL;
}

interface ExplainTargetQueryResult {
    skipped: boolean;
    runtimeMs?: number;
}

/**
 * Ensures the Target Database pool is instantiated lazily
 */
function getTargetPool(): Pool {
    if (!pool) {
        const connectionString = getProjectDatabaseUrl();

        if (!connectionString) {
            throw new Error("PROJECT_DATABASE_URL is not configured.");
        }

        pool = new Pool({
            connectionString,
            // Configure hard limits inside the pool itself to protect against runaways
            query_timeout: 30000,
            statement_timeout: 30000,
        });
    }

    return pool;
}

export const executeTargetQuery = async (safeSql: string) => {
    const targetPool = getTargetPool();
    const startTime = Date.now();

    // Execute exclusively on the target PG pool, bypassing Prisma App DB
    const result = await targetPool.query(safeSql);
    const runtimeMs = Date.now() - startTime;

    return {
        rows: result.rows,
        runtimeMs,
        rowCount: result.rowCount || 0
    };
};

export const explainTargetQuery = async (safeSql: string): Promise<ExplainTargetQueryResult> => {
    if (!getProjectDatabaseUrl()) {
        return { skipped: true };
    }

    const targetPool = getTargetPool();
    const startTime = Date.now();

    await targetPool.query(`EXPLAIN ${safeSql}`);

    return {
        skipped: false,
        runtimeMs: Date.now() - startTime
    };
};
