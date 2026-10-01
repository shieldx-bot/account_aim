import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: z.string().min(1),
    DB_PORT: z.string().transform((val) => parseInt(val, 10)),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().min(1),
    ADMIN_ROOT_KEY: z.string().min(1),
    CORS_ORIGIN: z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
export const env = {
    ...parsed.data,
    /** Parsed allow-list for CORS; falls back to local Vite dev server. */
    corsOrigins: (parsed.data.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
};
