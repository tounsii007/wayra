import { defineConfig, devices } from '@playwright/test';

/**
 * Wayra web E2E test configuration.
 *
 * Run locally:
 *   pnpm --filter @wayra/web e2e
 *
 * Run against a pre-built / running instance:
 *   PLAYWRIGHT_BASE_URL=http://staging.wayra.app pnpm --filter @wayra/web e2e
 *
 * CI: the separate `e2e` workflow builds the app and starts it before running.
 * Unit / component tests (Vitest) are separate and run without a server.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,

  // Fail fast on CI if a test is accidentally left with `.only`.
  forbidOnly: !!process.env.CI,

  // Retry failed tests twice on CI to dampen flakiness.
  retries: process.env.CI ? 2 : 0,

  // Single worker on CI to avoid port conflicts; auto-detect locally.
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start the Next.js dev server automatically when running locally.
  // On CI the server is started by the workflow before Playwright runs.
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
