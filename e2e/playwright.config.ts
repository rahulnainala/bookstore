import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against their own database, reset before the servers start.
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/bookstore_e2e";
const API_PORT = 8100;
const WEB_PORT = 5180;

export default defineConfig({
  testDir: ".",
  outputDir: "./test-results",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "npm run db:reset -w @bookstore/api && npm run dev -w @bookstore/api",
      cwd: "..",
      url: `http://localhost:${API_PORT}/api/health`,
      env: { DATABASE_URL, PORT: String(API_PORT), NODE_ENV: "development", LOG_LEVEL: "warn" },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -w @bookstore/web -- --port ${WEB_PORT} --strictPort`,
      cwd: "..",
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
