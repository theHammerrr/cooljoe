import { DraftQueryResult, TopologyColumn } from './models';
import { getPrimaryKeyColumn, quoteIdentifier, quoteTableReference } from './common';
import { buildTableRefs, findColumnForName, tableMentioned, TableRef } from './deterministicTables';
import { scoreBossResolution, scoreSingleTableResolution } from './deterministicConfidence';

export interface DeterministicResolution {
    draft: DraftQueryResult;
    confidence: number;
    reasons: string[];
}

function buildPkColumns(table: TableRef): TopologyColumn[] {
    return table.columns.map((column) => ({ column }));
}

function buildSingleTableDraft(question: string, table: TableRef): DraftQueryResult | null {
    if (!/\b(all|everything|every|list|show|get|retrieve)\b/i.test(question)) return null;
    return {
        intent: `Retrieve records from ${table.fullName}`,
        assumptions: [`User requested rows from table "${table.fullName}".`],
        sql: `SELECT ${quoteIdentifier(table.tableName)}.* FROM ${quoteTableReference(table.fullName)}`,
        prisma: `prisma.${table.tableName}.findMany()`,
        expectedColumns: [],
        riskFlags: []
    };
}

function buildBossDraft(question: string, tables: TableRef[]): DraftQueryResult | null {
    if (!/\bboss(es)?\b/i.test(question)) return null;
    const employee = tables.find((table) => table.tableName === 'employee');
    const person = employee ? tables.find((table) => table.tableName === 'person' && table.schemaName === employee.schemaName) : undefined;
    if (!employee || !person) return null;
    if (employee.fkByColumn.get('boss_id') !== employee.fullName || employee.fkByColumn.get('person_id') !== person.fullName) return null;
    const personNameColumns = findColumnForName(person.columnsSet);
    if (!personNameColumns.length) return null;

    const selectCols = personNameColumns.map((column) => `ep.${quoteIdentifier(column)} ${quoteIdentifier(`employee_${column}`)}`)
        .concat(personNameColumns.map((column) => `bp.${quoteIdentifier(column)} ${quoteIdentifier(`boss_${column}`)}`));
    const employeePk = getPrimaryKeyColumn(buildPkColumns(employee));
    const personPk = getPrimaryKeyColumn(buildPkColumns(person));
    const employeeSql = quoteTableReference(employee.fullName);
    const personSql = quoteTableReference(person.fullName);
    const sql = [
        `SELECT ${selectCols.join(', ')}`,
        `FROM ${employeeSql} e`,
        `JOIN ${personSql} ep ON e.${quoteIdentifier('person_id')} = ep.${quoteIdentifier(personPk)}`,
        `JOIN ${employeeSql} b ON e.${quoteIdentifier('boss_id')} = b.${quoteIdentifier(employeePk)}`,
        `JOIN ${personSql} bp ON b.${quoteIdentifier('person_id')} = bp.${quoteIdentifier(personPk)}`
    ].join('\n');

    return {
        intent: `Retrieve employees and their bosses from ${employee.schemaName}`,
        assumptions: [
            `Employee to boss relation uses "${employee.fullName}.boss_id -> ${employee.fullName}".`,
            `Employee person relation uses "${employee.fullName}.person_id -> ${person.fullName}".`
        ],
        sql,
        prisma: 'prisma.employee.findMany({ include: { boss: { include: { person: true } }, person: true } })',
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
        const score = scoreBossResolution(question, mentionedTables.some((table) => table.tableName === 'employee'), /\bboss(es)?\b/i.test(question));
        return { draft: bossDraft, confidence: score.confidence, reasons: score.reasons };
    }

    if (mentionedTables.length !== 1) return null;
    const singleTableDraft = buildSingleTableDraft(question, mentionedTables[0]);
    if (!singleTableDraft) return null;
    const score = scoreSingleTableResolution(question, mentionedTables.length, mentionedTables[0]);
    return { draft: singleTableDraft, confidence: score.confidence, reasons: score.reasons };
}
