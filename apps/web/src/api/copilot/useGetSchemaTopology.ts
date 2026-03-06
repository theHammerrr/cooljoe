import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from './apiClient';

export interface TopologyColumn {
    column: string;
    type: string;
    isPrimary?: boolean;
    foreignKeyTarget?: string | null;
}

function isTopologyColumn(value: unknown): value is TopologyColumn {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const column = Reflect.get(value, 'column');
    const type = Reflect.get(value, 'type');

    return typeof column === 'string' && typeof type === 'string';
}

function parseTopologyPayload(payload: unknown): Record<string, TopologyColumn[]> | null {
    if (typeof payload !== 'object' || payload === null) {
        return null;
    }
    const schema = Reflect.get(payload, 'schema');

    if (typeof schema !== 'object' || schema === null) {
        return null;
    }
    const topology = Reflect.get(schema, 'topology');

    if (typeof topology !== 'object' || topology === null) {
        return null;
    }

    const parsed: Record<string, TopologyColumn[]> = {};

    for (const [key, value] of Object.entries(topology)) {
        if (!Array.isArray(value)) {
            continue;
        }
        parsed[key] = value.filter(isTopologyColumn);
    }

    return parsed;
}

export const SCHEMA_TOPOLOGY_QUERY_KEY: readonly string[] = ['schema-topology'];

export const useGetSchemaTopology = () => {
    return useQuery({
        queryKey: SCHEMA_TOPOLOGY_QUERY_KEY,
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/copilot/schema`);

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to fetch schema topology');
            }
            const data: unknown = await response.json();

            return parseTopologyPayload(data);
        },
        staleTime: 1000 * 60 * 60,
        retry: false
    });
};
