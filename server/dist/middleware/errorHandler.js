"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message,
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format',
        });
    }
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate key error',
        });
    }
    console.error('Unhandled error:', err);
    return res.status(500).json({
        error: config_1.config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    });
}
//# sourceMappingURL=errorHandler.js.map