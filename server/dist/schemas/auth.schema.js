"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100),
    email: zod_1.z.string().email('Địa chỉ email không hợp lệ'),
    password: zod_1.z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    role: zod_1.z.enum(['member', 'admin']).optional().default('member'),
    adminCode: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Địa chỉ email không hợp lệ'),
    password: zod_1.z.string().min(1, 'Mật khẩu không được để trống'),
});
