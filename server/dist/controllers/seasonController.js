"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolloverExpiredSeason = rolloverExpiredSeason;
exports.getCurrentSeason = getCurrentSeason;
exports.getSeasonHistory = getSeasonHistory;
const Season_1 = __importDefault(require("../models/Season"));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Returns a date that is `months` calendar months after `from`. */
function addMonths(from, months) {
    const d = new Date(from);
    d.setMonth(d.getMonth() + months);
    return d;
}
/**
 * Bootstrap: create Season 1 starting today for 6 months.
 * Only called when the DB has no active season at all.
 */
async function createFirstSeason() {
    const now = new Date();
    return Season_1.default.create({
        seasonNumber: 1,
        name: 'Season 1',
        startDate: now,
        endDate: addMonths(now, 6),
        isActive: true,
    });
}
// ---------------------------------------------------------------------------
// Season rollover (called on a schedule — see server.ts)
// ---------------------------------------------------------------------------
/**
 * Checks whether the current active season has expired and, if so:
 *  1. Marks it inactive.
 *  2. Creates the next season starting immediately for 6 months.
 *
 * Safe to call as often as needed (idempotent when nothing is expired).
 */
async function rolloverExpiredSeason() {
    const now = new Date();
    // Find the active season that has already passed its end date.
    const expired = await Season_1.default.findOne({ isActive: true, endDate: { $lt: now } });
    if (!expired)
        return; // nothing to do
    console.log(`[Season] Season ${expired.seasonNumber} expired — rolling over.`);
    // Deactivate expired season.
    expired.isActive = false;
    await expired.save();
    // Create the next season.
    const nextNumber = expired.seasonNumber + 1;
    await Season_1.default.create({
        seasonNumber: nextNumber,
        name: `Season ${nextNumber}`,
        startDate: now,
        endDate: addMonths(now, 6),
        isActive: true,
    });
    console.log(`[Season] Season ${nextNumber} is now active.`);
}
// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------
async function getCurrentSeason(_req, res, next) {
    try {
        // Run a rollover check on every request so expiry is caught promptly even
        // without a background scheduler in constrained environments.
        await rolloverExpiredSeason();
        const season = await Season_1.default.findOne({ isActive: true })
            .sort({ seasonNumber: -1 })
            .lean();
        if (!season) {
            // No season exists at all — bootstrap.
            const firstSeason = await createFirstSeason();
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