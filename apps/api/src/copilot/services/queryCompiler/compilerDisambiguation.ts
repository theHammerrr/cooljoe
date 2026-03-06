import { TableRefPlan } from './compilerRefs';

function selectRefByRole(refs: string[], role?: string): string | null {
    const lowered = (role || '').toLowerCase();

    if (lowered.includes('boss') || lowered.includes('manager') || lowered.includes('supervisor')) return refs[refs.length - 1] || refs[0];

    if (lowered.includes('employee') || lowered.includes('staff') || lowered.includes('person') || lowered.includes('base')) return refs[0];

    return null;
}

function selectRefByHint(refs: string[], alias?: string): string | null {
    const lowered = (alias || '').toLowerCase();

    if (lowered.includes('boss') || lowered.includes('manager') || lowered.includes('supervisor')) return refs[refs.length - 1] || refs[0];

    if (lowered.includes('employee') || lowered.includes('staff') || lowered.includes('person')) return refs[0];

    return null;
}

export function resolveTableRef(
    table: string,
    plan: TableRefPlan,
    explicitTableRef?: string,
    roleHint?: string,
    aliasHint?: string
): string {
    const refs = plan.refsByTable.get(table) || [table];

    if (explicitTableRef && refs.includes(explicitTableRef)) return explicitTableRef;

    if (refs.length === 1) return refs[0];
    const roleMatch = selectRefByRole(refs, roleHint);

    if (roleMatch) return roleMatch;
    const hinted = selectRefByHint(refs, aliasHint);

    if (hinted) return hinted;
    throw new Error(`Ambiguous repeated table reference "${table}". Provide tableRef (${refs.join(' or ')}).`);
}
