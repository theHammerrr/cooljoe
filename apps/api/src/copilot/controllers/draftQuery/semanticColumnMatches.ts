import { normalizeIdentifier } from './common';
import { TableCatalogRow } from './models';

const COLUMN_CONCEPT_ALIASES: Record<string, string[]> = {
    name: ['name', 'first_name', 'last_name', 'full_name', 'display_name', 'given_name', 'family_name'],
    names: ['name', 'first_name', 'last_name', 'full_name', 'display_name', 'given_name', 'family_name'],
    description: ['description', 'details', 'summary', 'notes', 'bio'],
    descriptions: ['description', 'details', 'summary', 'notes', 'bio'],
    email: ['email', 'email_address'],
    phone: ['phone', 'phone_number', 'mobile'],
    created: ['created_at', 'created_on', 'created_date'],
    updated: ['updated_at', 'updated_on', 'updated_date']
};

export function detectSemanticColumnMatches(normalizedQuestion: string, row: TableCatalogRow) {
    const normalizedColumns = row.columns.map(normalizeIdentifier);
    const semanticMatches = new Set<string>();

    for (const [concept, aliases] of Object.entries(COLUMN_CONCEPT_ALIASES)) {
        if (!new RegExp(`\\b${concept}\\b`, 'i').test(normalizedQuestion)) {
            continue;
        }

        for (const column of normalizedColumns) {
            if (aliases.includes(column)) {
                semanticMatches.add(column);
            }
        }

        addCompositeNameColumns(semanticMatches, normalizedColumns, aliases);
    }

    return Array.from(semanticMatches);
}

function addCompositeNameColumns(semanticMatches: Set<string>, normalizedColumns: string[], aliases: string[]) {
    const isNameConcept = aliases.includes('first_name') || aliases.includes('full_name');

    if (!isNameConcept) {
        return;
    }

    for (const column of ['first_name', 'last_name', 'given_name', 'family_name']) {
        if (normalizedColumns.includes(column)) {
            semanticMatches.add(column);
        }
    }
}
