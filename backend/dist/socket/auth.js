"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = socketAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const User_1 = __importDefault(require("../models/User"));
async function socketAuth(socket, next) {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token || typeof token !== 'string') {
            return next(new Error('Authentication required'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await User_1.default.findById(decoded.userId).select('username');
        if (!user) {
            return next(new Error('User not found'));
        }
        socket.userId = user._id.toString();
        socket.username = user.username;
        next();
    }
    catch {
        next(new Error('Invalid token'));
    }
}
//# sourceMappingURL=auth.js.map