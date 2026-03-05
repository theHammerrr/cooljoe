class AllowlistService {
    private allowedTables: Set<string>;

    constructor() {
        this.allowedTables = new Set<string>();
        this.loadFromEnv();
    }

    private loadFromEnv() {
        // Defaults if nothing provided
        const envList = process.env.TABLE_ALLOWLIST || 'users,orders,products,glossary,e2e_test_users';
        envList.split(',').forEach(t => {
            const table = t.trim().toLowerCase();
            if (table) {
                this.allowedTables.add(table);
            }
        });
    }

    public isAllowed(table: string): boolean {
        return this.allowedTables.has(table.toLowerCase());
    }

    public allowTable(table: string) {
        this.allowedTables.add(table.toLowerCase());
    }

    public getAllowedTables(): string[] {
        return Array.from(this.allowedTables);
    }
}

// Singleton instance
export const allowlistService = new AllowlistService();
