"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const User_1 = __importDefault(require("../models/User"));
async function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await User_1.default.findById(decoded.userId).select('-password');
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        req.user = user;
        req.userId = user._id.toString();
        next();
    }
    catch (error) {
        if (error instanceof errors_1.UnauthorizedError) {
            next(error);
        }
        else {
            next(new errors_1.UnauthorizedError('Invalid or expired token'));
        }
    }
}
function optionalAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        User_1.default.findById(decoded.userId).select('-password').then((user) => {
            if (user) {
                req.user = user;
                req.userId = user._id.toString();
            }
            next();
        }).catch(() => next());
    }
    catch {
        next();
    }
}
//# sourceMappingURL=auth.js.map