"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Routes for player stats and scoring leaderboard.
 * Mounted at /api/scoring/stats (via routes/index.ts)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const statsController_1 = require("../../controllers/cricket-scoring/statsController");
const router = (0, express_1.Router)();
router.get('/leaderboard', auth_1.authenticate, statsController_1.getScoringLeaderboard); // GET /api/scoring/stats/leaderboard?type=runs
router.get('/player/:playerId/career', auth_1.authenticate, statsController_1.getPlayerCareerStats); // GET /api/scoring/stats/player/:id/career
router.get('/player/:playerId/matches', auth_1.authenticate, statsController_1.getPlayerMatchHistory); // GET /api/scoring/stats/player/:id/matches
exports.default = router;
//# sourceMappingURL=statsRoutes.js.map