import { describe, expect, it } from 'vitest';
import { buildIntentSketch, requiresClarification } from './intentSketch';

const tableCatalog = [
    { table: 'public.customer', columns: ['id', 'name'], foreignKeys: [] },
    { table: 'public.order', columns: ['id', 'customer_id', 'amount', 'created_at'], foreignKeys: ['customer_id -> public.customer'] }
];

describe('buildIntentSketch', () => {
    it('requires clarification when entity is missing', () => {
        const sketch = buildIntentSketch('show performance', tableCatalog);

        expect(requiresClarification(sketch)).toBe(true);
        expect(sketch.missing).toContain('entity');
    });

    it('requires clarification when top-n metric is missing', () => {
        const sketch = buildIntentSketch('top 10 customers', tableCatalog);

        expect(requiresClarification(sketch)).toBe(true);
        expect(sketch.missing).toContain('measure');
    });

    it('allows drafting when top-n metric is explicit', () => {
        const sketch = buildIntentSketch('top 10 customers by revenue', tableCatalog);

        expect(requiresClarification(sketch)).toBe(false);
        expect(sketch.explicitMeasure).toBe('revenue');
    });
});
