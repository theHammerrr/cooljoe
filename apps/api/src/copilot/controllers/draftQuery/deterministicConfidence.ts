import { TableRef } from './deterministicTables';

export interface DeterministicResolutionScore {
    confidence: number;
    reasons: string[];
}

function clampScore(score: number): number {
    if (score < 0) return 0;

    if (score > 1) return 1;

    return Number(score.toFixed(2));
}

function hasFilterIntent(question: string): boolean {
    return /\b(where|with|having|filter|active|inactive|status|state|type)\b/i.test(question);
}

function hasNameIntent(question: string): boolean {
    return /\bname|names|first name|last name\b/i.test(question);
}

function tableHasFilterColumns(table: TableRef): boolean {
    return table.columnsSet.has('status') || table.columnsSet.has('state') || table.columnsSet.has('type');
}

export function scoreSingleTableResolution(question: string, mentionedCount: number, table: TableRef): DeterministicResolutionScore {
    const reasons: string[] = ['single-table deterministic candidate'];
    let score = 0.45;

    if (/\b(all|everything|every|list|show|get|retrieve)\b/i.test(question)) {
        score += 0.2;
        reasons.push('explicit retrieval verb');
    }

    if (mentionedCount === 1) {
        score += 0.2;
        reasons.push('exactly one table mention');
    }

    if (hasFilterIntent(question)) {
        if (tableHasFilterColumns(table)) {
            score += 0.1;
            reasons.push('filter intent matches table columns');
        } else {
            score -= 0.15;
            reasons.push('filter intent without matching filter columns');
        }
    }

    if (hasNameIntent(question) && !table.columnsSet.has('name') && !table.columnsSet.has('first_name')) {
        score -= 0.25;
        reasons.push('name intent not directly satisfiable by selected table');
    }

    return { confidence: clampScore(score), reasons };
}

export function scoreBossResolution(question: string, hasEmployeeMention: boolean, hasBossKeyword: boolean): DeterministicResolutionScore {
    const reasons: string[] = ['graph-based boss join path resolved'];
    let score = 0.65;

    if (hasBossKeyword) {
        score += 0.2;
        reasons.push('boss keyword present');
    }

    if (hasEmployeeMention) {
        score += 0.1;
        reasons.push('employee entity mentioned');
    }

    if (hasFilterIntent(question)) {
        score += 0.05;
        reasons.push('filter intent can be delegated to planner/validator');
    }

    return { confidence: clampScore(score), reasons };
}
