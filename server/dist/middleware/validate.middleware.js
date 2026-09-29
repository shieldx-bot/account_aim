"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const app_error_js_1 = require("../utils/app-error.js");
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return next(new app_error_js_1.BadRequestError(result.error.issues[0].message));
        }
        req.body = result.data;
        next();
    };
};
exports.validate = validate;
