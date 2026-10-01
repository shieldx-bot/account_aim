/**
 * One-off migration: encrypt plaintext rows in inventory_accounts.password
 * and subscriptions.account_password_encrypted with AES-256-GCM.
 *
 * Run once after setting ENCRYPTION_KEY:
 *   node scripts/encrypt-existing-passwords.mjs
 *
 * Idempotent: rows already carrying the "v1:" ciphertext prefix are skipped.
 * Reads DB connection from the same env vars the server uses (dotenv .env).
 */
import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';

const KEY = process.env.ENCRYPTION_KEY;
if (!KEY || KEY.length !== 64) {
  console.error('ENCRYPTION_KEY must be set to 64 hex chars (32 bytes) before running this migration.');
  process.exit(1);
}
const key = Buffer.from(KEY, 'hex');

const encrypt = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${ct.toString('hex')}`;
};

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const migrate = async (table, column) => {
  const res = await pool.query(
    `SELECT id, ${column} AS secret FROM ${table}
     WHERE ${column} IS NOT NULL AND ${column} NOT LIKE 'v1:%'`
  );
  let count = 0;
  for (const row of res.rows) {
    await pool.query(`UPDATE ${table} SET ${column} = $1 WHERE id = $2`, [encrypt(row.secret), row.id]);
    count++;
  }
  console.log(`[${table}.${column}] encrypted ${count} plaintext row(s).`);
};

try {
  await migrate('inventory_accounts', 'password');
  await migrate('subscriptions', 'account_password_encrypted');
  console.log('Done.');
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
