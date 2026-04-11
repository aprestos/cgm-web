import { defineConfigWithVueTs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import prettierPlugin from 'eslint-plugin-prettier'
import eslintConfigPrettier from '@vue/eslint-config-prettier'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '**/eslint.config.ts',
      '**/*.config.ts',
    ],
  },

  // Vue baseline
  ...pluginVue.configs['flat/recommended'],

  // Strict TypeScript rules
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        project: [
          './tsconfig.app.json',
          './tsconfig.node.json',
          './tsconfig.vitest.json',
          './e2e/tsconfig.json',
        ],
        tsconfigRootDir: process.cwd(),
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs['recommended-requiring-type-checking'].rules,
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
    },
  },

  // Strict Vue overrides
  {
    files: ['**/*.vue'],
    plugins: {
      vue: pluginVue,
    },
    rules: {
      'vue/require-typed-ref': 'error',
      'vue/require-prop-types': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-emit-validator': 'error',
      'vue/no-unused-properties': [
        'error',
        {
          groups: ['props', 'data', 'computed', 'methods', 'setup'],
          ignorePublicMembers: false,
        },
      ],
      'vue/no-unused-components': 'error',
      'vue/no-unused-vars': 'error',
      'vue/require-explicit-emits': 'error',
      'vue/require-expose': 'error',
      'vue/require-valid-default-prop': 'error',
      'vue/no-deprecated-slot-attribute': 'error',
    },
  },

  // Vitest config
  {
    ...pluginVitest.configs.recommended,
    files: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
    plugins: {
      vitest: pluginVitest,
    },
  },

  // Playwright config
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    plugins: {
      playwright: pluginPlaywright,
    },
  },

  // Prettier
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // THIS MUST BE LAST to override other formatting rules
  eslintConfigPrettier,
)
