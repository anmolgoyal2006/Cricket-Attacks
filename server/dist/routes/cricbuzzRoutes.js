"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cricbuzz_service_1 = __importDefault(require("../services/cricbuzz.service"));
const router = (0, express_1.Router)();
/**
 * GET /api/cricbuzz/test
 * Health check for Cricbuzz routes
 */
router.get('/test', (_req, res) => {
    res.json({ success: true, message: 'Cricbuzz routes working' });
});
/**
 * GET /api/cricbuzz/players/search
 * Search players by name using Cricbuzz API
 */
router.get('/players/search', async (req, res) => {
    try {
        const name = (req.query.name || '').trim();
        if (name.length < 2) {
            res.status(400).json({ error: 'Query too short' });
            return;
        }
        const players = await cricbuzz_service_1.default.searchPlayers(name);
        res.json({ success: true, data: players });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in player search route:', message);
        res.status(500).json({ error: message });
    }
});
exports.default = router;
//# sourceMappingURL=cricbuzzRoutes.js.map