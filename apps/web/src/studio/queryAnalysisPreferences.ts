const AI_SUMMARY_KEY = 'cooljoe.studio.queryAnalysis.includeAiSummary';

export function loadAiSummaryPreference(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem(AI_SUMMARY_KEY) === 'true';
}

export function saveAiSummaryPreference(enabled: boolean): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(AI_SUMMARY_KEY, String(enabled));
}
