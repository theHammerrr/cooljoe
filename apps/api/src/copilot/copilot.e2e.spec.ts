import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { Pool } from 'pg';

const describeE2E = process.env.RUN_E2E === 'true' ? describe : describe.skip;

describeE2E('Copilot E2E Tests', () => {
    let pool: Pool;

    beforeAll(async () => {
        // Use PROJECT_DATABASE_URL, legacy TARGET_DATABASE_URL, or default
        const connectionString =
            process.env.PROJECT_DATABASE_URL ||
            process.env.TARGET_DATABASE_URL ||
            "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
        pool = new Pool({ connectionString });

        // Seed the target DB with a 'e2e_test_users' table since it's in the hardcoded allowlist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS e2e_test_users (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL
            );
        `);

        // Clear old data then insert fresh test data
        await pool.query(`TRUNCATE TABLE e2e_test_users RESTART IDENTITY CASCADE;`);
        await pool.query(`
            INSERT INTO e2e_test_users (name, email) VALUES 
            ('Alice', 'alice@example.com'),
            ('Bob', 'bob@example.com');
        `);
    });

    afterAll(async () => {
        // Clean up test data
        await pool.query(`DROP TABLE IF EXISTS e2e_test_users;`);
        await pool.end();
    });

    it('should successfully run a SELECT query and fetch data', async () => {
        const response = await request(app)
            .post('/api/copilot/run-query')
            .send({
                query: 'SELECT * FROM e2e_test_users;',
                mode: 'sql'
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.rows.length).toBe(2);
        expect(response.body.rows[0]).toHaveProperty('name', 'Alice');
        expect(response.body.rows[1]).toHaveProperty('name', 'Bob');
    });

    it('should firmly block a DELETE query from executing on the target db', async () => {
        const response = await request(app)
            .post('/api/copilot/run-query')
            .send({
                query: "DELETE FROM e2e_test_users WHERE name = 'Alice';",
                mode: 'sql'
            });

        // The queryValidator throws an error which the controller catches and returns as 400
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/Only SELECT statements are allowed/i);
    });

    it('should block queries against tables not in the allowlist', async () => {
        const response = await request(app)
            .post('/api/copilot/run-query')
            .send({
                query: 'SELECT * FROM secret_admin_table;',
                mode: 'sql'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toMatch(/not in allowlist/i);
    });
});
