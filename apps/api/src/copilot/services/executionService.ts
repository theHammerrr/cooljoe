import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Ensures the Target Database pool is instantiated lazily
 */
function getTargetPool(): Pool {
    if (!pool) {
        if (!process.env.TARGET_DATABASE_URL) {
            throw new Error("TARGET_DATABASE_URL is not configured.");
        }

        pool = new Pool({
            connectionString: process.env.TARGET_DATABASE_URL,
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
