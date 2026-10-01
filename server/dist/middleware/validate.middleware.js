import { BadRequestError } from '../utils/app-error.js';
export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(new BadRequestError(result.error.issues[0].message));
        }
        req.body = result.data;
        next();
    };
};
