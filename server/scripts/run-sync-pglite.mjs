import { PGlite } from '@electric-sql/pglite';
import { syncContent } from './sync-seed-content.mjs';
const db = new PGlite(process.argv[2] || './data/pglite');
console.log('pglite: synced', await syncContent(async (sql, p) => await db.query(sql, p)), 'rows');
await db.close();
