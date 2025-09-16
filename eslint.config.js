import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// 👇 add this
const isProd = process.env.CI === 'true' || process.env.NODE_ENV === 'production';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // stricter in CI/prod
      'no-console': [isProd ? 'error' : 'warn', { allow: ['warn', 'error'] }],
      'no-debugger': isProd ? 'error' : 'warn',

      'no-empty': ['error', { allowEmptyCatch: true }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'],
            ['^node:', '^react', '^@?\\w'],
            ['^@/'],
            ['^\\.\\.(?!/?$)', '^\\./?\\.?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]);
