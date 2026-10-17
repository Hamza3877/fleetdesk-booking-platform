import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests: a real browser clicks through the real, built app.
 *
 *   npm run build
 *   npm run test:e2e
 *
 * The tests start the production server themselves (on port 3200) and use the built-in demo data.
 * If Chromium isn't installed yet, run `npx playwright install chromium` once.
 */
const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  // One at a time: the tests share one server with in-memory data.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Lets a machine with its own Chromium (no download) run the tests: PW_CHROMIUM_PATH=/path/to/chrome
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Always the in-memory demo data, even if DATABASE_URL is set on this machine.
    env: { DATABASE_URL: "" },
  },
});
