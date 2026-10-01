import path from 'path';
import { Pool } from 'pg';
import { env } from './env.js';
export const usePglite = env.DB_DRIVER === 'pglite' || (!env.DB_DRIVER && !env.DB_HOST);
export const dbEngine = usePglite ? 'pglite' : 'postgres';
const createPostgresPool = () => {
    const pool = new Pool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
    });
    pool.on('connect', () => {
        console.log('[PostgreSQL] Connected to database pool successfully.');
    });
    pool.on('error', (err) => {
        console.error('[PostgreSQL] Unexpected error on idle client:', err);
        process.exit(-1);
    });
    return pool;
};
const createPgliteDatabase = async () => {
    // Dynamic import keeps the Postgres-only path free of WASM startup cost.
    const { PGlite } = await import('@electric-sql/pglite');
    const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
    const dataDir = path.isAbsolute(env.PGDATA_DIR)
        ? env.PGDATA_DIR
        : path.resolve(process.cwd(), env.PGDATA_DIR);
    const db = new PGlite(dataDir, { extensions: { uuid_ossp } });
    const execQuery = async (text, params) => {
        if (params && params.length > 0) {
            // Parameterized single statement — PGLite speaks the Postgres extended
            // protocol, so $1..$n placeholders work verbatim.
            const res = await db.query(text, params);
            return { rows: res.rows, rowCount: res.rows.length };
        }
        // No params: may be a multi-statement script (migrations / DDL) — exec().
        const results = await db.exec(text);
        const last = results.at(-1);
        return {
            rows: (last?.rows ?? []),
            rowCount: last?.rows?.length ?? 0,
        };
    };
    console.log(`[PGlite] Embedded Postgres initialized at ${dataDir}`);
    return {
        query: execQuery,
        on: () => { },
        // Single-connection engine: BEGIN/COMMIT on the shared instance is safe
        // because PGLite serializes queries internally.
        connect: async () => ({ query: execQuery, release: () => { } }),
    };
};
console.log(`[DB] Engine: ${dbEngine}`);
// Top-level await: embedded engine must be ready before any controller runs.
export const pool = usePglite ? await createPgliteDatabase() : createPostgresPool();
