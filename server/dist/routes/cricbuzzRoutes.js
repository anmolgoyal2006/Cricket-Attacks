"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Player_1 = __importDefault(require("../models/Player"));
const router = (0, express_1.Router)();
/**
 * GET /api/cricbuzz/test
 */
router.get('/test', (_req, res) => {
    res.json({ success: true, message: 'Cricbuzz routes working' });
});
/**
 * GET /api/cricbuzz/players/search?name=query
 * Search players by name from our own Player collection.
 */
router.get('/players/search', async (req, res) => {
    try {
        const name = (req.query.name || '').trim();
        if (name.length < 2) {
            res.status(400).json({ error: 'Query too short' });
            return;
        }
        const players = await Player_1.default.find({ name: { $regex: name, $options: 'i' } }, { _id: 1, name: 1, image: 1, country: 1, role: 1 })
            .sort({ overall: -1 })
            .limit(20)
            .lean();
        const data = players.map((p) => ({
            id: p._id.toString(),
            name: p.name,
            slug: p.name.toLowerCase().replace(/\s+/g, '-'),
            image: p.image || '',
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in player search route:', message);
        res.status(500).json({ error: message });
    }
});
exports.default = router;
//# sourceMappingURL=cricbuzzRoutes.js.map