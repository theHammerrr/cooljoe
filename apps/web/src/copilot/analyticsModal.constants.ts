import type { AnalyticsResponse } from '../api/copilot/useGetAnalytics';

type StatKey = keyof Pick<AnalyticsResponse, 'totalQueries' | 'avgRuntimeMs' | 'maxRuntimeMs' | 'avgRowCount'>;

interface StatCard {
    key: StatKey;
    label: string;
    suffix?: string;
    color: string;
    bg: string;
}

export const STAT_CARDS: StatCard[] = [
    { key: 'totalQueries', label: 'Total Queries', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { key: 'avgRuntimeMs', label: 'Avg Runtime', suffix: 'ms', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { key: 'maxRuntimeMs', label: 'Max Runtime', suffix: 'ms', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { key: 'avgRowCount', label: 'Avg Rows', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
];

export const tooltipStyle = {
    backgroundColor: '#1c2128',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e6edf3',
    fontSize: '12px',
};
