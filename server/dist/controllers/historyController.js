"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchHistory = getMatchHistory;
exports.getMatchHistoryByUser = getMatchHistoryByUser;
const MatchHistory_1 = __importDefault(require("../models/MatchHistory"));
const helpers_1 = require("../utils/helpers");
async function getMatchHistory(req, res, next) {
    try {
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const filter = { user: req.userId };
        if (req.query.type)
            filter.type = req.query.type;
        if (req.query.result)
            filter.result = req.query.result;
        const [matches, total] = await Promise.all([
            MatchHistory_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            MatchHistory_1.default.countDocuments(filter),
        ]);
        res.json({
            matches,
            pagination: (0, helpers_1.paginationResponse)(total, page, limit),
        });
    }
    catch (error) {
        next(error);
    }
}
async function getMatchHistoryByUser(req, res, next) {
    try {
        const { userId } = req.params;
        const { page, limit, skip } = (0, helpers_1.parsePagination)(req.query);
        const [matches, total] = await Promise.all([
            MatchHistory_1.default.find({ user: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            MatchHistory_1.default.countDocuments({ user: userId }),
        ]);
        res.json({
            matches,
            pagination: (0, helpers_1.paginationResponse)(total, page, limit),
        });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=historyController.js.map