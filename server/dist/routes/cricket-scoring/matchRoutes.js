"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Routes for match management.
 * Mounted at /api/scoring/matches (via routes/index.ts)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const isScorerOrCreator_1 = require("../../middleware/isScorerOrCreator");
const matchController_1 = require("../../controllers/cricket-scoring/matchController");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, matchController_1.createMatch);
router.get('/', auth_1.authenticate, matchController_1.listMatches);
router.get('/:id', auth_1.authenticate, matchController_1.getMatch);
router.patch('/:id/scorers', auth_1.authenticate, matchController_1.updateScorers); // only creator — checked inside controller
router.patch('/:id/start', auth_1.authenticate, isScorerOrCreator_1.isScorerOrCreator, matchController_1.startMatch);
// Phase 5: read-only spectator endpoints (no isScorerOrCreator check — all authenticated users can read)
router.get('/:matchId/balls', auth_1.authenticate, matchController_1.getBalls);
router.get('/:matchId/stats', auth_1.authenticate, matchController_1.getMatchStats);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map