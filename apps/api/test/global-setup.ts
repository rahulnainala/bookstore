export default async function setup() {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/bookstore_test";
  const { runMigrations } = await import("../src/db/migrate");
  const { seed } = await import("../src/db/seed");
  const { pool } = await import("../src/db/client");
  await runMigrations();
  await seed();
  await pool.end();
}
