import { defaultExclude, defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    {
        test: {
            include: ['apps/*/src/**/*.spec.ts'],
            exclude: [...defaultExclude, '**/dist/**']
        }
    }
]);
