import { defineConfig } from "vitest/config";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/bookstore_test";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./test/global-setup.ts"],
    env: { NODE_ENV: "test", DATABASE_URL: TEST_DATABASE_URL },
    // Test files share one database, so run them one at a time.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
