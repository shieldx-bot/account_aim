import { PGlite } from '@electric-sql/pglite';
import { updateModels } from './update-models-2026.mjs';
const db = new PGlite(process.argv[2] || './data/pglite');
const stale = await updateModels(async (sql, params) => {
  const r = params ? await db.query(sql, params) : await db.exec(sql).then(a => a.at(-1));
  return r;
});
console.log(`pglite: done, ${stale} products still reference old models`);
await db.close();
