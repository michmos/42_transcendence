// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import htmlPlugin from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

export default defineConfig(
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  // Use a dedicated tsconfig for apps/web to include config files like postcss.config.js
  {
    files: ['apps/web/**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './apps/web/tsconfig.eslint.json',
      },
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser,
    },
    plugins: {
      '@html-eslint': htmlPlugin,
    },
    rules: {
      '@html-eslint/require-doctype': 'error',
      '@html-eslint/require-lang': 'error',
      '@html-eslint/require-meta-charset': 'error',
      '@html-eslint/require-meta-viewport': 'error',
      '@html-eslint/no-duplicate-attrs': 'error',
      '@html-eslint/no-inline-styles': 'warn',
      '@html-eslint/no-multiple-h1': 'error',
      '@html-eslint/require-title': 'error',
    },
  },
  {
    ignores: [
      '**/dist/',
      '**/node_modules/',
      '**/build/',
      '**/out',
      '**/generated/**',
    ],
  }
);
