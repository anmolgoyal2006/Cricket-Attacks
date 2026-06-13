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
        // Fetch all unique players first
        const uniquePlayers = await Player_1.default.find({ _id: { $in: user.ownedCards } }).lean();
        const playerMap = new Map(uniquePlayers.map(p => [p._id.toString(), p]));
        // Build full list including duplicates, and add a unique cardId for each instance
        let allCards = user.ownedCards.map((playerId, index) => {
            const player = playerMap.get(playerId.toString());
            if (!player)
                return null;
            return {
                ...player,
                cardId: `${playerId}_${index}`, // unique ID for each copy
                level: 1, // default values for now
                xp: 0,
                battlesPlayed: 0,
                battlesWon: 0,
            };
        }).filter(Boolean);
        // Apply filters
        if (req.query.role) {
            const roleRegex = new RegExp(req.query.role, 'i');
            allCards = allCards.filter(card => roleRegex.test(card.role));
        }
        if (req.query.rarity) {
            const rarityRegex = new RegExp(`^${req.query.rarity}$`, 'i');
            allCards = allCards.filter(card => rarityRegex.test(card.rarity));
        }
        // Apply sorting
        allCards.sort((a, b) => {
            if (sort.startsWith('-')) {
                const field = sort.slice(1);
                return (b[field] || 0) - (a[field] || 0);
            }
            if (sort === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            }
            return (a[sort] || 0) - (b[sort] || 0);
        });
        const total = allCards.length;
        const paginatedCards = allCards.slice(skip, skip + limit);
        res.json({
            cards: paginatedCards,
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
        // Get unique player data for each owned card (including duplicates)
        const uniquePlayers = await Player_1.default.find({ _id: { $in: user.ownedCards } }).lean();
        const playerMap = new Map(uniquePlayers.map(p => [p._id.toString(), p]));
        // Build an array of rarities for all owned cards
        const allRarities = user.ownedCards.map(id => {
            const player = playerMap.get(id.toString());
            return player?.rarity;
        }).filter(Boolean);
        // Calculate rarity breakdown
        const rarityCounts = {};
        allRarities.forEach(rarity => {
            rarityCounts[rarity] = (rarityCounts[rarity] || 0) + 1;
        });
        const rarityBreakdown = Object.entries(rarityCounts).map(([rarity, count]) => ({
            rarity,
            count,
        }));
        res.json({
            stats: {
                totalCards: user.ownedCards.length,
                totalRarity: rarityBreakdown.length,
                uniquePlayers: new Set(user.ownedCards.map(id => id.toString())).size,
            },
            rarityBreakdown,
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