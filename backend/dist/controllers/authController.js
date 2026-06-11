"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const leaderboardService_1 = require("../services/leaderboardService");
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, config_1.config.jwtSecret, {
        expiresIn: config_1.config.jwtExpiresIn,
    });
}
function sanitizeUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.username,
        trophies: user.trophies,
        level: user.level,
        coins: user.coins,
        stats: {
            battlesPlayed: user.battlesPlayed,
            battlesWon: user.wins,
            totalPacksOpened: user.packsOpened,
            totalCardsCollected: user.ownedCards?.length || 0,
        },
        dailyPackOpenedAt: user.dailyPackOpenedAt,
        createdAt: user.createdAt,
    };
}
async function register(req, res, next) {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            throw new errors_1.ConflictError(existingUser.email === email
                ? 'Email already registered'
                : 'Username already taken');
        }
        const user = await User_1.default.create({ username, email, password });
        await (0, leaderboardService_1.updateLeaderboardForUser)(user._id.toString());
        const token = generateToken(user._id.toString());
        res.status(201).json({
            token,
            user: sanitizeUser(user),
        });
    }
    catch (error) {
        next(error);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email }).select('+password');
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new errors_1.UnauthorizedError('Invalid email or password');
        }
        const token = generateToken(user._id.toString());
        res.json({
            token,
            user: sanitizeUser(user),
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        res.json({
            user: sanitizeUser(user),
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=authController.js.map