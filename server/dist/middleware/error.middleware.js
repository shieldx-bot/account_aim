"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const app_error_js_1 = require("../utils/app-error.js");
const logger_js_1 = require("../utils/logger.js");
const errorMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let status = 'error';
    let message = 'Internal Server Error';
    let errors = null;
    if (err instanceof app_error_js_1.AppError) {
        statusCode = err.statusCode;
        status = err.status;
        message = err.message;
    }
    else if (err instanceof zod_1.ZodError) {
        statusCode = 400;
        status = 'fail';
        message = 'Validation Error';
        errors = err.errors.map((e) => ({
            path: e.path,
            message: e.message,
        }));
    }
    else {
        logger_js_1.logger.error('Unhandled Error:', err);
    }
    res.status(statusCode).json({
        status,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorMiddleware = errorMiddleware;
