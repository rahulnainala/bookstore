import { pool } from "../db/client";
import { seed } from "../db/seed";

const counts = await seed();
console.log(`Seeded ${counts.books} books, ${counts.authors} authors, ${counts.genres} genres`);
await pool.end();
