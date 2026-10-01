import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';
export const errorMiddleware = (err, req, res, next) => {
    let statusCode = 500;
    let status = 'error';
    let message = 'Internal Server Error';
    let errors = null;
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        status = err.status;
        message = err.message;
    }
    else if (err instanceof ZodError) {
        statusCode = 400;
        status = 'fail';
        message = 'Validation Error';
        errors = err.issues.map((e) => ({
            path: e.path,
            message: e.message,
        }));
    }
    else {
        logger.error('Unhandled Error:', err);
    }
    res.status(statusCode).json({
        status,
        message,
        ...(errors && { errors }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
