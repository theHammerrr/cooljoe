import { DraftDiagnostic } from '../../controllers/draftQuery/diagnostics';
import { collectJoinEqualities } from '../draftJoinAst';
import { validateJoinRelationships } from '../draftJoinValidation';
import { getForeignKeyTargets, getPrimaryKeyByTable } from '../draftSchemaTopology';
import { AstSelectStatement } from '../sqlAstTypes';
import { pushDiagnostic } from './draftSchemaValidatorDiagnostics';

export function validateQueryJoins(
    statement: AstSelectStatement,
    aliasToTable: Map<string, string>,
    foreignKeyTargets: ReturnType<typeof getForeignKeyTargets>,
    primaryKeyByTable: ReturnType<typeof getPrimaryKeyByTable>,
    diagnostics: DraftDiagnostic[]
): void {
    const joinEqualities: { left: { table?: string; column: string }; right: { table?: string; column: string } }[] = [];
    collectJoinEqualities(statement.from, joinEqualities);

    for (const joinError of validateJoinRelationships(joinEqualities, aliasToTable, foreignKeyTargets, primaryKeyByTable)) {
        pushDiagnostic(diagnostics, { code: 'INVALID_JOIN_RELATION', message: joinError });
    }
}
