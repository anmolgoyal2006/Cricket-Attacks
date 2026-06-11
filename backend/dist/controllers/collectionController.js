"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollection = getCollection;
exports.getCollectionStats = getCollectionStats;
exports.addToCollection = addToCollection;
const User_1 = __importDefault(require("../models/User"));
const Player_1 = __importDefault(require("../models/Player"));
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
async function getCollection(req, res, next) {
    try {
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const sort = (0, helpers_1.parseSort)(req.query, '-overall');
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        const playerFilter = {
            _id: { $in: user.ownedCards },
        };
        if (req.query.role) {
            playerFilter.role = { $regex: req.query.role, $options: 'i' };
        }
        if (req.query.rarity) {
            playerFilter.rarity = { $regex: `^${req.query.rarity}$`, $options: 'i' };
        }
        const [cards, total] = await Promise.all([
            Player_1.default.find(playerFilter).sort(sort).skip(skip).limit(limit).lean(),
            Player_1.default.countDocuments(playerFilter),
        ]);
        res.json({
            cards,
            pagination: (0, helpers_1.paginationResponse)(total, page, limit),
        });
    }
    catch (error) {
        next(error);
    }
}
async function getCollectionStats(req, res, next) {
    try {
        const user = await User_1.default.findById(req.userId);
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        const rarityBreakdown = await Player_1.default.aggregate([
            { $match: { _id: { $in: user.ownedCards } } },
            { $group: { _id: '$rarity', count: { $sum: 1 } } },
        ]);
        res.json({
            stats: {
                totalCards: user.ownedCards.length,
                totalRarity: rarityBreakdown.length,
                uniquePlayers: user.ownedCards.length,
            },
            rarityBreakdown: rarityBreakdown.map((r) => ({
                rarity: r._id,
                count: r.count,
            })),
        });
    }
    catch (error) {
        next(error);
    }
}
async function addToCollection(req, res, next) {
    try {
        const { playerId } = req.body;
        if (!playerId) {
            throw new errors_1.BadRequestError('Player ID is required');
        }
        const player = await Player_1.default.findById(playerId);
        if (!player) {
            throw new errors_1.NotFoundError('Player');
        }
        const user = await User_1.default.findByIdAndUpdate(req.userId, { $addToSet: { ownedCards: playerId } }, { new: true });
        if (!user) {
            throw new errors_1.NotFoundError('User');
        }
        res.json({
            message: 'Card added to collection',
            totalCards: user.ownedCards.length,
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=collectionController.js.map