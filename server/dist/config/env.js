import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Database engine: 'pglite' = embedded Postgres (local file, zero infra),
    // 'postgres' = external PostgreSQL via DB_HOST/DB_PORT/etc.
    // Defaults to 'postgres' when DB_HOST is set, else 'pglite'.
    DB_DRIVER: z.enum(['pglite', 'postgres']).optional(),
    DB_HOST: z.string().optional().default(''),
    DB_PORT: z
        .string()
        .optional()
        .default('5432')
        .transform((val) => parseInt(val, 10)),
    DB_USER: z.string().optional().default('postgres'),
    DB_PASSWORD: z.string().optional().default(''),
    DB_NAME: z.string().optional().default('aipro'),
    // Data directory for the embedded PGlite engine (mount as a container volume)
    PGDATA_DIR: z.string().optional().default('./data/pglite'),
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1),
    ADMIN_ROOT_KEY: z.string().min(1),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    MEMBER_PASSWORD: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    GROK_MODEL: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
    PAYPAL_CLIENT_ID: z.string().optional(),
    PAYPAL_CLIENT_SECRET: z.string().optional(),
    PAYPAL_ENV: z.enum(['sandbox', 'live']).optional().default('sandbox'),
    APP_URL: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    ENCRYPTION_KEY: z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, 'ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
        .optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
if (parsed.data.NODE_ENV === 'production') {
    const prodRequired = [
        'RESEND_API_KEY',
        'MAIL_FROM',
        'ENCRYPTION_KEY',
        'APP_URL',
    ];
    const missing = prodRequired.filter((k) => !parsed.data[k]);
    if (missing.length > 0) {
        console.error(`❌ Missing required production environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}
export const env = {
    ...parsed.data,
    isProd: parsed.data.NODE_ENV === 'production',
    /** Parsed allow-list for CORS; falls back to local Vite dev server. */
    corsOrigins: (parsed.data.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
};
