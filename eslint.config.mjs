import { defineConfig } from 'eslint/config';
import eslintRecommended from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import htmlPlugin from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import globals from 'globals';

export default defineConfig(
  eslintRecommended.configs.recommended,
  prettierConfig,

  // TypeScript rules for all TS files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/unified-signatures': 'off',
      'prettier/prettier': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },

  // HTML linting
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

  // Ignore build artifacts
  {
    ignores: [
      '**/dist/',
      '**/build/',
      '**/out/',
      '**/node_modules/',
      '**/generated/**',
    ],
  }
);
