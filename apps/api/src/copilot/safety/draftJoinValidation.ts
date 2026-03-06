import { JoinEqualityReference } from './draftSchemaAst';
import { normalizeIdentifier } from './draftSchemaTopology';

export function validateJoinRelationships(
    joinEqualities: JoinEqualityReference[],
    aliasToTable: Map<string, string>,
    foreignKeyTargets: Map<string, string>,
    primaryKeyByTable: Map<string, string>
): string[] {
    const errors: string[] = [];

    for (const equality of joinEqualities) {
        const leftTableRef = equality.left.table ? normalizeIdentifier(equality.left.table) : '';
        const rightTableRef = equality.right.table ? normalizeIdentifier(equality.right.table) : '';

        if (!leftTableRef || !rightTableRef) continue;

        const leftTable = aliasToTable.get(leftTableRef) || leftTableRef;
        const rightTable = aliasToTable.get(rightTableRef) || rightTableRef;
        const leftColumn = normalizeIdentifier(equality.left.column);
        const rightColumn = normalizeIdentifier(equality.right.column);

        const leftFkTarget = foreignKeyTargets.get(`${leftTable}.${leftColumn}`);
        const rightFkTarget = foreignKeyTargets.get(`${rightTable}.${rightColumn}`);
        const rightPrimary = primaryKeyByTable.get(rightTable) || 'id';
        const leftPrimary = primaryKeyByTable.get(leftTable) || 'id';

        const leftIsValidFkEdge = leftFkTarget === rightTable && rightColumn === rightPrimary;
        const rightIsValidFkEdge = rightFkTarget === leftTable && leftColumn === leftPrimary;

        if (!leftIsValidFkEdge && !rightIsValidFkEdge) {
            errors.push(
                `Invalid join relation: ${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}. Join keys must follow schema FK relationships.`
            );
        }
    }

    return errors;
}
