import { DraftQueryResult } from './models';
import { getPrimaryKeyColumn, normalizeIdentifier, quoteIdentifier, quoteTableReference } from './common';
import { buildTableRefs, findColumnForName, tableMentioned, TableRef } from './deterministicTables';
import { scoreBossResolution, scoreSingleTableResolution } from './deterministicConfidence';
import { selectDeterministicColumns } from './deterministicProjection';

export interface DeterministicResolution {
    draft: DraftQueryResult;
    confidence: number;
    reasons: string[];
}

const DETERMINISTIC_PREVIEW_LIMIT = 50;

function buildSingleTableDraft(question: string, table: TableRef): DraftQueryResult | null {
    if (!/\b(all|everything|every|list|show|get|retrieve)\b/i.test(question)) return null;

    const selectedColumns = selectDeterministicColumns(table);
    const sqlProjection = selectedColumns.map((column) => `t.${quoteIdentifier(column)}`).join(', ');
    const prismaSelect = selectedColumns.map((column) => `${column}: true`).join(', ');

    return {
        intent: `Retrieve records from ${table.fullName}`,
        assumptions: [
            `User requested rows from table "${table.fullName}".`,
            `Results are limited to ${DETERMINISTIC_PREVIEW_LIMIT} rows for safety.`
        ],
        sql: `SELECT ${sqlProjection} FROM ${quoteTableReference(table.fullName)} t LIMIT ${DETERMINISTIC_PREVIEW_LIMIT}`,
        prisma: `prisma.${table.tableName}.findMany({ select: { ${prismaSelect} }, take: ${DETERMINISTIC_PREVIEW_LIMIT} })`,
        expectedColumns: selectedColumns,
        riskFlags: []
    };
}

function buildBossDraft(question: string, tables: TableRef[]): DraftQueryResult | null {
    if (!/\bboss(es)?\b/i.test(question)) return null;
    const employee = tables.find((table) => table.normalizedTableName === 'employee');
    const person = employee
        ? tables.find((table) => table.normalizedTableName === 'person' && table.normalizedSchemaName === employee.normalizedSchemaName)
        : undefined;

    if (!employee || !person) return null;

    const employeeForeignKeys = new Map(
        Array.from(employee.fkByColumn.entries()).map(([column, target]) => [normalizeIdentifier(column), target])
    );

    if (employeeForeignKeys.get('boss_id') !== employee.fullName || employeeForeignKeys.get('person_id') !== person.fullName) return null;
    const personNameColumns = findColumnForName(person.columnsSet);

    if (!personNameColumns.length) return null;

    const selectCols = personNameColumns.map((column) => `ep.${quoteIdentifier(column)} ${quoteIdentifier(`employee_${column}`)}`)
        .concat(personNameColumns.map((column) => `bp.${quoteIdentifier(column)} ${quoteIdentifier(`boss_${column}`)}`));
    const employeePk = getPrimaryKeyColumn(employee.columns.map((column) => ({ column })));
    const personPk = getPrimaryKeyColumn(person.columns.map((column) => ({ column })));
    const employeeSql = quoteTableReference(employee.fullName);
    const personSql = quoteTableReference(person.fullName);
    const sql = [
        `SELECT ${selectCols.join(', ')}`,
        `FROM ${employeeSql} e`,
        `JOIN ${personSql} ep ON e.${quoteIdentifier('person_id')} = ep.${quoteIdentifier(personPk)}`,
        `JOIN ${employeeSql} b ON e.${quoteIdentifier('boss_id')} = b.${quoteIdentifier(employeePk)}`,
        `JOIN ${personSql} bp ON b.${quoteIdentifier('person_id')} = bp.${quoteIdentifier(personPk)}`,
        `LIMIT ${DETERMINISTIC_PREVIEW_LIMIT}`
    ].join('\n');

    return {
        intent: `Retrieve employees and their bosses from ${employee.schemaName}`,
        assumptions: [
            `Employee to boss relation uses "${employee.fullName}.boss_id -> ${employee.fullName}".`,
            `Employee person relation uses "${employee.fullName}.person_id -> ${person.fullName}".`,
            `Results are limited to ${DETERMINISTIC_PREVIEW_LIMIT} rows for safety.`
        ],
        sql,
        prisma: `prisma.employee.findMany({ include: { boss: { include: { person: true } }, person: true }, take: ${DETERMINISTIC_PREVIEW_LIMIT} })`,
        expectedColumns: selectCols.map((column) => column.split(' ').slice(-1)[0].replace(/"/g, '')),
        riskFlags: []
    };
}

export function resolveDeterministicDraft(question: string, schema: unknown, requiredSchema?: string): DeterministicResolution | null {
    const tables = buildTableRefs(schema, requiredSchema);

    if (!tables.length) return null;
    const mentionedTables = tables.filter((table) => tableMentioned(question, table.tableName, table.schemaName));
    const scope = mentionedTables.length ? mentionedTables : tables;

    const bossDraft = buildBossDraft(question, scope);

    if (bossDraft) {
        const score = scoreBossResolution(question, mentionedTables.some((table) => table.normalizedTableName === 'employee'), /\bboss(es)?\b/i.test(question));

        return { draft: bossDraft, confidence: score.confidence, reasons: score.reasons };
    }

    if (mentionedTables.length !== 1) return null;
    const singleTableDraft = buildSingleTableDraft(question, mentionedTables[0]);

    if (!singleTableDraft) return null;
    const score = scoreSingleTableResolution(question, mentionedTables.length, mentionedTables[0]);

    return { draft: singleTableDraft, confidence: score.confidence, reasons: score.reasons };
}
