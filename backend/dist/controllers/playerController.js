"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPlayers = getAllPlayers;
exports.getPlayerById = getPlayerById;
const Player_1 = __importDefault(require("../models/Player"));
const errors_1 = require("../utils/errors");
const helpers_1 = require("../utils/helpers");
async function getAllPlayers(req, res, next) {
    try {
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const sort = (0, helpers_1.parseSort)(req.query, '-overall');
        const filter = {};
        if (req.query.role) {
            filter.role = { $regex: req.query.role, $options: 'i' };
        }
        if (req.query.rarity) {
            filter.rarity = { $regex: `^${req.query.rarity}$`, $options: 'i' };
        }
        if (req.query.country) {
            filter.country = { $regex: req.query.country, $options: 'i' };
        }
        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }
        if (req.query.minOverall) {
            filter.overall = { $gte: parseInt(req.query.minOverall) };
        }
        const [cards, total] = await Promise.all([
            Player_1.default.find(filter).sort(sort).skip(skip).limit(limit).lean(),
            Player_1.default.countDocuments(filter),
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
async function getPlayerById(req, res, next) {
    try {
        const player = await Player_1.default.findById(req.params.id).lean();
        if (!player) {
            throw new errors_1.NotFoundError('Player');
        }
        res.json({ card: player });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=playerController.js.map