"use strict";
/**
 * Cricket Scoring Feature — Phase 2
 * Routes for ball-by-ball scoring.
 * Mounted at /api/scoring/matches (via matchRoutes or routes/index.ts)
 * Full paths: POST /api/scoring/matches/:matchId/balls
 *             DELETE /api/scoring/matches/:matchId/balls/last
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const isScorerOrCreator_1 = require("../../middleware/isScorerOrCreator");
const ballController_1 = require("../../controllers/cricket-scoring/ballController");
const router = (0, express_1.Router)({ mergeParams: true }); // mergeParams = inherit :matchId from parent
router.post('/', auth_1.authenticate, isScorerOrCreator_1.isScorerOrCreator, ballController_1.recordBall);
router.delete('/last', auth_1.authenticate, isScorerOrCreator_1.isScorerOrCreator, ballController_1.undoLastBall);
exports.default = router;
//# sourceMappingURL=ballRoutes.js.map