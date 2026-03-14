import type { QueryAnalysisPlanNode } from './types';

export function normalizePlanNode(value: unknown): QueryAnalysisPlanNode {
    const source = typeof value === 'object' && value !== null ? value : {};
    const plans = Reflect.get(source, 'Plans');
    const sortKey = Reflect.get(source, 'Sort Key');

    return {
        nodeType: getString(source, 'Node Type') || 'Unknown',
        relationName: getString(source, 'Relation Name'),
        schema: getString(source, 'Schema'),
        alias: getString(source, 'Alias'),
        startupCost: getNumber(source, 'Startup Cost'),
        totalCost: getNumber(source, 'Total Cost'),
        planRows: getNumber(source, 'Plan Rows'),
        planWidth: getNumber(source, 'Plan Width'),
        actualStartupTime: getNumber(source, 'Actual Startup Time'),
        actualTotalTime: getNumber(source, 'Actual Total Time'),
        actualRows: getNumber(source, 'Actual Rows'),
        actualLoops: getNumber(source, 'Actual Loops'),
        filter: getString(source, 'Filter'),
        indexName: getString(source, 'Index Name'),
        indexCond: getString(source, 'Index Cond'),
        recheckCond: getString(source, 'Recheck Cond'),
        hashCond: getString(source, 'Hash Cond'),
        mergeCond: getString(source, 'Merge Cond'),
        joinFilter: getString(source, 'Join Filter'),
        joinType: getString(source, 'Join Type'),
        sortKey: Array.isArray(sortKey) ? sortKey.filter((item): item is string => typeof item === 'string') : undefined,
        buffers: normalizePlanBuffers(source),
        plans: Array.isArray(plans) ? plans.map((entry) => normalizePlanNode(entry)) : []
    };
}

function normalizePlanBuffers(value: object): QueryAnalysisPlanNode['buffers'] {
    const sharedHitBlocks = getNumber(value, 'Shared Hit Blocks');
    const sharedReadBlocks = getNumber(value, 'Shared Read Blocks');
    const tempReadBlocks = getNumber(value, 'Temp Read Blocks');
    const tempWrittenBlocks = getNumber(value, 'Temp Written Blocks');

    if (
        sharedHitBlocks === undefined
        && sharedReadBlocks === undefined
        && tempReadBlocks === undefined
        && tempWrittenBlocks === undefined
    ) {
        return undefined;
    }

    return {
        sharedHitBlocks,
        sharedReadBlocks,
        tempReadBlocks,
        tempWrittenBlocks
    };
}

function getString(value: object, key: string): string | undefined {
    const candidate = Reflect.get(value, key);

    return typeof candidate === 'string' ? candidate : undefined;
}

function getNumber(value: object, key: string): number | undefined {
    const candidate = Reflect.get(value, key);

    return typeof candidate === 'number' ? candidate : undefined;
}
