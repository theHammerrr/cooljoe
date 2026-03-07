export function applyInjectedQuery(
    sql: string,
    prisma: string | undefined,
    setInjectedSql: (value: string) => void,
    setInjectedPrisma: (value: string) => void,
    setActiveWorkspaceTab: (tab: 'sql' | 'prisma') => void
) {
    if (prisma?.trim()) {
        setInjectedSql('');
        setInjectedPrisma(prisma);
        setActiveWorkspaceTab('prisma');

        return;
    }

    setInjectedPrisma('');
    setInjectedSql(sql);
    setActiveWorkspaceTab('sql');
}
