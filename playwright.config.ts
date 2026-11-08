import { defineConfig } from "@playwright/test";


const PORT = 3200;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { DATABASE_URL: "" },
  },
});
