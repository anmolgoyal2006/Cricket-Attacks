"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cricbuzz_service_1 = __importDefault(require("../services/cricbuzz.service"));
console.log('Cricbuzz routes loaded');
const router = (0, express_1.Router)();
/**
 * GET /api/cricbuzz/test
 * Health check for Cricbuzz routes
 */
router.get('/test', (_req, res) => {
    res.json({ success: true, message: 'Cricbuzz routes working' });
});
/**
 * GET /api/cricbuzz/live
 * Fetch live cricket matches from Cricbuzz API
 * Returns cached data if available (60 second cache)
 */
router.get('/live', async (req, res) => {
    try {
        const result = await cricbuzz_service_1.default.fetchLiveMatches();
        res.status(200).json({
            success: true,
            data: result.matches,
            cached: result.cached,
            timestamp: result.timestamp,
        });
    }
    catch (error) {
        console.error('Error in live matches route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch live matches',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
/**
 * GET /api/cricbuzz/upcoming
 * Fetch upcoming cricket matches from Cricbuzz API
 * Returns cached data if available (60 second cache)
 */
router.get('/upcoming', async (req, res) => {
    try {
        const result = await cricbuzz_service_1.default.fetchUpcomingMatches();
        res.status(200).json({
            success: true,
            data: result.matches,
            cached: result.cached,
            timestamp: result.timestamp,
        });
    }
    catch (error) {
        console.error('Error in upcoming matches route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming matches',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=cricbuzzRoutes.js.map