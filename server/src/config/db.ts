import path from 'path';
import { Pool } from 'pg';
import { env } from './env.js';

/**
 * Dual-engine database layer.
 *
 * - `postgres` (default when DB_HOST is configured): external PostgreSQL
 *   (Railway / RDS / containerized postgres) via node-postgres Pool.
 * - `pglite` (default when no DB_HOST): embedded Postgres running in-process
 *   (WASM) with data stored in a local directory — SQLite-style deployment
 *   with ZERO SQL changes. Supports JSONB, uuid-ossp, transactions, and
 *   multi-statement scripts, so all existing queries and migrations work
 *   unchanged. Ideal for self-contained container deployments.
 */

export interface QueryResultRow {
  [column: string]: any;
}

interface Queryable {
  // Default `any` mirrors node-postgres' loose typing so existing controllers
  // keep compiling unchanged (they spread raw rows into new objects).
  query: <T extends QueryResultRow = any>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
}

type Database = Queryable & {
  on: (event: string, cb: (...args: any[]) => void) => void;
  connect: () => Promise<{ query: Queryable['query']; release: () => void }>;
};

export const usePglite =
  env.DB_DRIVER === 'pglite' || (!env.DB_DRIVER && !env.DB_HOST);

export const dbEngine = usePglite ? 'pglite' : 'postgres';

const createPostgresPool = (): Database => {
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

  return pool as unknown as Database;
};

const createPgliteDatabase = async (): Promise<Database> => {
  // Dynamic import keeps the Postgres-only path free of WASM startup cost.
  const { PGlite } = await import('@electric-sql/pglite');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');

  const dataDir = path.isAbsolute(env.PGDATA_DIR)
    ? env.PGDATA_DIR
    : path.resolve(process.cwd(), env.PGDATA_DIR);
  const db = new PGlite(dataDir, { extensions: { uuid_ossp } });

  const execQuery = async <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }> => {
    if (params && params.length > 0) {
      // Parameterized single statement — PGLite speaks the Postgres extended
      // protocol, so $1..$n placeholders work verbatim.
      const res = await (db as any).query(text, params as any[]);
      return { rows: res.rows as T[], rowCount: res.rows.length };
    }
    // No params: may be a multi-statement script (migrations / DDL) — exec().
    const results = await (db as any).exec(text);
    const last = results.at(-1);
    return {
      rows: (last?.rows ?? []) as T[],
      rowCount: last?.rows?.length ?? 0,
    };
  };

  console.log(`[PGlite] Embedded Postgres initialized at ${dataDir}`);

  return {
    query: execQuery,
    on: () => {},
    // Single-connection engine: BEGIN/COMMIT on the shared instance is safe
    // because PGLite serializes queries internally.
    connect: async () => ({ query: execQuery, release: () => {} }),
  };
};

console.log(`[DB] Engine: ${dbEngine}`);
// Top-level await: embedded engine must be ready before any controller runs.
export const pool: Database = usePglite ? await createPgliteDatabase() : createPostgresPool();
