import { buildTableCatalog, detectRequestedSchema } from '../../controllers/draftQuery/schemaContext';
import { normalizeIdentifier } from '../../controllers/draftQuery/common';
import { KnowledgeRetrievalOptions, RetrievedKnowledgeDoc, RetrievedRecipe } from './types';

export function inferKnowledgeScope(question: string, schema: unknown): KnowledgeRetrievalOptions {
    const requestedSchema = detectRequestedSchema(question, schema);
    const tableCatalog = buildTableCatalog(schema, requestedSchema);
    const normalizedQuestion = normalizeIdentifier(question);
    const tables = tableCatalog
        .map((row) => row.table)
        .filter((table) => matchesEntity(normalizedQuestion, table))
        .slice(0, 6);
    const columns = tableCatalog
        .flatMap((row) => row.columns)
        .filter((column, index, all) => all.indexOf(column) === index && matchesEntity(normalizedQuestion, column))
        .slice(0, 8);

    return { schema: requestedSchema, tables, columns };
}

export function rerankKnowledgeDocs(question: string, docs: RetrievedKnowledgeDoc[], options: KnowledgeRetrievalOptions): RetrievedKnowledgeDoc[] {
    const normalizedQuestion = normalizeIdentifier(question);

    return docs
        .map((doc) => ({ ...doc, score: doc.score - knowledgeBoost(doc, normalizedQuestion, options) }))
        .sort((left, right) => left.score - right.score);
}

export function rerankRecipes(question: string, recipes: RetrievedRecipe[], options: KnowledgeRetrievalOptions): RetrievedRecipe[] {
    const normalizedQuestion = normalizeIdentifier(question);

    return recipes
        .map((recipe) => ({ ...recipe, score: recipe.score - recipeBoost(recipe, normalizedQuestion, options) }))
        .sort((left, right) => left.score - right.score);
}

export function groupKnowledgeDocs(docs: RetrievedKnowledgeDoc[]) {
    return {
        schemaFacts: docs.filter((doc) => /table_description|column_description/i.test(doc.type)),
        businessMeanings: docs.filter((doc) => /glossary|business_rule|column_rule/i.test(doc.type)),
        valueConventions: docs.filter((doc) => /value|sentinel|enum/i.test(doc.type) || hasPossibleValues(doc.metadata))
    };
}

function knowledgeBoost(doc: RetrievedKnowledgeDoc, question: string, options: KnowledgeRetrievalOptions): number {
    const metadata = doc.metadata || {};
    let boost = matchesEntity(question, doc.term) ? 0.35 : 0;

    if (scopeIncludes(options.schema, metadata.schema)) boost += 0.25;

    if (scopeMatches(options.tables, metadata.table, metadata.schema)) boost += 0.3;

    if (scopeIncludesAny(options.columns, [metadata.column, ...readStringArray(metadata.aliases)])) boost += 0.35;

    return boost;
}

function recipeBoost(recipe: RetrievedRecipe, question: string, options: KnowledgeRetrievalOptions): number {
    const metadata = recipe.metadata || {};
    const usedTables = readStringArray(metadata.usedTables);
    let boost = matchesEntity(question, recipe.intent) ? 0.2 : 0;

    if (scopeIncludesAny(options.tables, usedTables)) boost += 0.25;

    return boost;
}

function matchesEntity(question: string, value: unknown): boolean {
    if (typeof value !== 'string' || !value) return false;
    const normalized = normalizeIdentifier(value);
    const bare = normalized.split('.').slice(-1)[0];

    return new RegExp(`\\b${bare.replace('.', '\\.')}\\b`, 'i').test(question)
        || new RegExp(`\\b${normalized.replace('.', '\\.')}\\b`, 'i').test(question);
}

function scopeMatches(scopeValues: string[] | undefined, table: unknown, schema: unknown): boolean {
    if (typeof table !== 'string') return false;

    return scopeIncludesAny(scopeValues, [typeof schema === 'string' ? `${schema}.${table}` : table, table]);
}

function scopeIncludes(scopeValue: string | undefined, candidate: unknown): boolean {
    return typeof scopeValue === 'string' && typeof candidate === 'string' && normalizeIdentifier(scopeValue) === normalizeIdentifier(candidate);
}

function scopeIncludesAny(scopeValues: string[] | undefined, candidates: unknown[]): boolean {
    if (!scopeValues?.length) return false;
    const normalizedScope = new Set(scopeValues.map(normalizeIdentifier));

    return candidates.some((candidate) => typeof candidate === 'string' && normalizedScope.has(normalizeIdentifier(candidate)));
}

function readStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function hasPossibleValues(metadata: Record<string, unknown> | null): boolean {
    return !!metadata && readStringArray(metadata.possibleValues).length > 0;
}
