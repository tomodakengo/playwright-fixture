import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const isNightly = process.env.PLAYWRIGHT_NIGHTLY === '1';
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

// When running inside docker-compose, the `app` service starts the SUT and
// our healthcheck handles readiness — so Playwright must NOT start its own
// webServer (it would conflict on port 3000 and try to spawn `npm run start:app`
// which isn't valid in the test image's working dir).
const disableWebServer = process.env.PLAYWRIGHT_DISABLE_WEBSERVER === '1';

export default defineConfig({
  // Look in both `tests/` (where YOUR tests will live) and `examples/tests/`
  // (the bundled demo). Delete `examples/` and the demo is gone; your `tests/`
  // keep working.
  testDir: '.',
  testMatch: ['tests/**/*.spec.ts', 'examples/tests/**/*.spec.ts'],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['html'], ['github']] : [['html'], ['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: disableWebServer
    ? undefined
    : {
        command: 'npm run start:app',
        url: `${baseURL}/health`,
        reuseExistingServer: !isCI,
        timeout: 30_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },

  projects: [
    {
      name: 'setup',
      testMatch: /.*auth\.setup\.ts$/,
      // The setup project is the only thing that runs *.setup.ts files; the
      // global `testMatch` excludes them from spec runs.
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    ...(isNightly
      ? [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            dependencies: ['setup'],
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            dependencies: ['setup'],
          },
        ]
      : []),
  ],
});
