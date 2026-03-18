import type { QueryAnalysisPlanNode } from '../api/copilot/queryAnalysisTypes';

export type PlanPressure = 'high' | 'medium' | 'low';

export function getPlanPressure(node: QueryAnalysisPlanNode): PlanPressure {
    const actualTime = node.actualTotalTime ?? 0;
    const actualRows = node.actualRows ?? 0;
    const totalCost = node.totalCost ?? 0;

    if (actualTime >= 50 || actualRows >= 50000 || totalCost >= 10000) {
        return 'high';
    }

    if (actualTime >= 5 || actualRows >= 5000 || totalCost >= 1000) {
        return 'medium';
    }

    return 'low';
}

export function getPlanPressureLabel(pressure: PlanPressure): string {
    if (pressure === 'high') return 'High Pressure';

    if (pressure === 'medium') return 'Watch Node';

    return 'Low Pressure';
}

export function getPlanPressureClassName(pressure: PlanPressure): string {
    if (pressure === 'high') return 'border border-red-500/25 bg-red-500/10 text-red-100';

    if (pressure === 'medium') return 'border border-amber-500/25 bg-amber-500/10 text-amber-100';

    return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-100';
}
