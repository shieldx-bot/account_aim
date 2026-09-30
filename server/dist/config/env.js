"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DB_HOST: zod_1.z.string().min(1),
    DB_PORT: zod_1.z.string().transform((val) => parseInt(val, 10)),
    DB_USER: zod_1.z.string().min(1),
    DB_PASSWORD: zod_1.z.string().min(1),
    DB_NAME: zod_1.z.string().min(1),
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    JWT_SECRET: zod_1.z.string().min(1),
    JWT_EXPIRES_IN: zod_1.z.string().min(1),
    ADMIN_ROOT_KEY: zod_1.z.string().min(1),
    CORS_ORIGIN: zod_1.z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    /** Parsed allow-list for CORS; falls back to local Vite dev server. */
    corsOrigins: (parsed.data.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
};
