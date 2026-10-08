import { pool } from "../db/client";
import { runMigrations } from "../db/migrate";

await runMigrations();
console.log("Migrations applied");
await pool.end();
