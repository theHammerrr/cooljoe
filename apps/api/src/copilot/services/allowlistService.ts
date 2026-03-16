class AllowlistService {
    private readonly allowedTables: Set<string>;
    private readonly allowlistEnabled: boolean;

    constructor(env: NodeJS.ProcessEnv = process.env) {
        this.allowedTables = new Set<string>();
        this.allowlistEnabled = !isTruthyEnv(env.IGNORE_ALLOW_TABLE_LIST);
        this.loadFromEnv(env.TABLE_ALLOWLIST);
    }

    public isEnabled(): boolean {
        return this.allowlistEnabled;
    }

    public isAllowed(table: string): boolean {
        return !this.allowlistEnabled || this.allowedTables.has(table.toLowerCase());
    }

    public allowTable(table: string) {
        if (!this.allowlistEnabled) {
            return;
        }

        this.allowedTables.add(table.toLowerCase());
    }

    public removeTable(table: string) {
        if (!this.allowlistEnabled) {
            return;
        }

        this.allowedTables.delete(table.toLowerCase());
    }

    public getAllowedTables(): string[] {
        return this.allowlistEnabled ? Array.from(this.allowedTables) : [];
    }

    private loadFromEnv(rawAllowlist: string | undefined) {
        const envList = rawAllowlist || 'users,orders,products,glossary,e2e_test_users';

        envList.split(',').forEach((entry) => {
            const table = entry.trim().toLowerCase();

            if (table) {
                this.allowedTables.add(table);
            }
        });
    }
}

function isTruthyEnv(value: string | undefined): boolean {
    return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export const allowlistService = new AllowlistService();
export { AllowlistService, isTruthyEnv };
