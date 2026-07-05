"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
exports.claimCoins = claimCoins;
exports.searchUsers = searchUsers;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const Player_1 = __importDefault(require("../models/Player"));
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
        // 5 random starter cards
        const starterCards = await Player_1.default.aggregate([{ $sample: { size: 5 } }]);
        const starterCardIds = starterCards.map((c) => c._id);
        // Welcome bonus: 1 Rare + 1 Legend card
        const [rareBonus] = await Player_1.default.aggregate([
            { $match: { rarity: 'Rare' } },
            { $sample: { size: 1 } },
        ]);
        const [legendBonus] = await Player_1.default.aggregate([
            { $match: { rarity: 'Legend' } },
            { $sample: { size: 1 } },
        ]);
        const bonusCards = [rareBonus, legendBonus].filter(Boolean);
        const bonusCardIds = bonusCards.map((c) => c._id);
        const user = await User_1.default.create({
            username,
            email,
            password,
            ownedCards: [...starterCardIds, ...bonusCardIds],
        });
        await (0, leaderboardService_1.updateLeaderboardForUser)(user._id.toString());
        const token = generateToken(user._id.toString());
        res.status(201).json({
            token,
            user: sanitizeUser(user),
            welcomeBonus: bonusCards.map((c) => ({
                _id: c._id,
                name: c.name,
                rarity: c.rarity,
                overall: c.overall,
                country: c.country,
                role: c.role,
                image: c.image,
            })),
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
        // First-ever login bonus — awarded once, on first login after registration
        let firstLoginBonus = null;
        if (!user.firstLoginBonusClaimed) {
            const FIRST_LOGIN_COINS = 1500;
            user.coins += FIRST_LOGIN_COINS;
            user.firstLoginBonusClaimed = true;
            await user.save();
            firstLoginBonus = {
                coins: FIRST_LOGIN_COINS,
                message: `🎉 Welcome bonus! You received ${FIRST_LOGIN_COINS} coins to get started!`,
            };
        }
        const token = generateToken(user._id.toString());
        res.json({
            token,
            user: sanitizeUser(user),
            ...(firstLoginBonus && { firstLoginBonus }),
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
async function claimCoins(req, res, next) {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        user.coins += 500;
        await user.save();
        res.json({
            coins: user.coins,
            user: sanitizeUser(user),
            message: 'Claimed 500 coins successfully!',
        });
    }
    catch (error) {
        next(error);
    }
}
// Cricket Scoring Feature — Phase 4
// Search users by username prefix — used by the match creation player-select UI.
// GET /api/auth/users/search?q=<term>  (requires auth, returns max 10 results)
async function searchUsers(req, res, next) {
    try {
        const q = (req.query.q ?? '').trim();
        if (q.length < 2) {
            return res.json({ users: [] });
        }
        const users = await User_1.default.find({
            username: { $regex: q, $options: 'i' },
        })
            .select('_id username')
            .limit(10)
            .lean();
        res.json({ users: users.map((u) => ({ _id: u._id, username: u.username })) });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=authController.js.map