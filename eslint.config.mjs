// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'playwright/.cache/**',
      'tests/.auth/**',
      'dist/**',
    ],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Playwright spec files
  {
    files: ['tests/**/*.ts'],
    plugins: { playwright },
    rules: {
      ...playwright.configs.recommended.rules,
    },
  },

  // Test framework rules — apply to test specs and PageObjects
  {
    files: ['tests/**/*.ts', 'pages/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              message:
                "Do not import test/expect from '@playwright/test' here — import them from '@fixtures/fixtures'. Type-only imports (e.g. `import type { Page } from '@playwright/test'`) are allowed.",
              allowTypeImports: true,
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          // Detect: test.beforeAll(async ({ page }) => {...}) and similar
          // Targets ObjectPattern destructuring of test-scoped fixtures inside beforeAll/afterAll arrow callbacks
          selector:
            "CallExpression[callee.object.name='test'][callee.property.name=/^(beforeAll|afterAll)$/] > ArrowFunctionExpression > ObjectPattern > Property[key.name=/^(page|app|context|request)$/]",
          message:
            'page/app/context/request are TEST-SCOPED fixtures and CANNOT be used inside test.beforeAll/afterAll. Use test.beforeEach, the worker-scoped workerApp/workerPage fixtures, or globalSetup. See docs/beforeAll-afterAll-guide.md',
        },
        {
          // Detect: test.beforeAll(async function ({ page }) {...})
          selector:
            "CallExpression[callee.object.name='test'][callee.property.name=/^(beforeAll|afterAll)$/] > FunctionExpression > ObjectPattern > Property[key.name=/^(page|app|context|request)$/]",
          message:
            'page/app/context/request are TEST-SCOPED fixtures and CANNOT be used inside test.beforeAll/afterAll. Use test.beforeEach, the worker-scoped workerApp/workerPage fixtures, or globalSetup. See docs/beforeAll-afterAll-guide.md',
        },
      ],
    },
  },

  // Fixture internals are allowed to import @playwright/test directly
  {
    files: ['fixtures/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': 'off',
    },
  },

  // Setup tests intentionally have no assertions
  {
    files: ['tests/**/*.setup.ts'],
    rules: {
      'playwright/expect-expect': 'off',
    },
  },

  // Allow @playwright/test in tests/auth.setup.ts via fixtures only — but auth.setup.ts uses fixtures too,
  // so no special override needed. The rule above already covers it.

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
);
