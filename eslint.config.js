// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort'; // ✅

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
      'simple-import-sort': simpleImportSort, // ✅
    },
    rules: {
      // keep imports nicely grouped/sorted
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000'], // side effect imports
            ['^node:', '^react', '^@?\\w'], // node builtins + packages
            ['^@/'], // your alias
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'], // parent
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'], // siblings/index
            ['^.+\\.s?css$'], // styles last
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
]);
