"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentSeason = getCurrentSeason;
exports.getSeasonHistory = getSeasonHistory;
const Season_1 = __importDefault(require("../models/Season"));
async function getCurrentSeason(_req, res, next) {
    try {
        const season = await Season_1.default.findOne({ isActive: true }).sort({ seasonNumber: -1 }).lean();
        if (!season) {
            const firstSeason = await Season_1.default.create({
                seasonNumber: 1,
                name: 'Season 1',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-06-30'),
                isActive: true,
            });
            res.json({ season: firstSeason });
            return;
        }
        res.json({ season });
    }
    catch (error) {
        next(error);
    }
}
async function getSeasonHistory(_req, res, next) {
    try {
        const seasons = await Season_1.default.find().sort({ seasonNumber: -1 }).limit(20).lean();
        res.json({ seasons });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=seasonController.js.map