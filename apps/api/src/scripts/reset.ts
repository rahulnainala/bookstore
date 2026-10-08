import { pool } from "../db/client";
import { runMigrations } from "../db/migrate";
import { seed } from "../db/seed";

await runMigrations();
const counts = await seed();
console.log(`Demo data reset: ${counts.books} books, ${counts.authors} authors`);
await pool.end();
