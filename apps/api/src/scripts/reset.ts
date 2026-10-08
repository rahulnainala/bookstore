import { pool } from "../db/client";
import { runMigrations } from "../db/migrate";
import { seed } from "../db/seed";

// Apply pending migrations and reload the demo data. Run nightly against the live database.
await runMigrations();
const counts = await seed();
console.log(`Demo data reset: ${counts.books} books, ${counts.authors} authors`);
await pool.end();
