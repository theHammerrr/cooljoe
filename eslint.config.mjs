import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseConfig = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'max-lines': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression',
          message: 'Do not use `as` type assertions. Use runtime validation and type narrowing instead.'
        },
        {
          selector: 'TSTypeAssertion',
          message: 'Do not use angle-bracket type assertions. Use runtime validation and type narrowing instead.'
        }
      ]
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines': 'off'
    }
  }
);
