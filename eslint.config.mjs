// @ts-check

import eslint from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['**/node_modules/*', 'dist/*', 'lib/*']
  },
  {
    files: ['src/**/*.ts', '__tests__/**/*.ts'],
    ...eslint.configs.recommended
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['src/**/*.ts', '__tests__/**/*.ts']
  })),
  {
    files: ['src/**/*.ts', '__tests__/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json']
      }
    }
  }
]);

