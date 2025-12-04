import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import htmlPlugin from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import globals from 'globals';

export default defineConfig(
  prettierConfig,

  // TypeScript rules with type checking - apply recommended type-checked rules only to TS files
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // Override TypeScript rules
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
      // Override/customize rules from recommendedTypeChecked
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],

      // Additional strict rules for maximum type safety
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error', // Disallow ! assertions
      '@typescript-eslint/no-dynamic-delete': 'error', // Disallow delete operator on computed keys
      '@typescript-eslint/no-invalid-void-type': 'error', // Disallow void in union types
      '@typescript-eslint/prefer-literal-enum-member': 'error', // Require literal values for enums
      '@typescript-eslint/no-extraneous-class': 'error', // Disallow classes with only static members

      // Stylistic rules for consistency
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Prefer interfaces over types
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }], // Prefer T[] over Array<T>
      '@typescript-eslint/prefer-for-of': 'error', // Prefer for-of over traditional for loops
      '@typescript-eslint/prefer-function-type': 'error', // Prefer function types over interfaces with call signatures

      // Prettier
      'prettier/prettier': 'error',
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

  // JavaScript files should cause lint errors - only TypeScript allowed
  {
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program',
          message:
            'JavaScript files are not allowed. Please use TypeScript (.ts) files instead.',
        },
      ],
    },
  },

  // Ignore build artifacts but NOT JavaScript files
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
