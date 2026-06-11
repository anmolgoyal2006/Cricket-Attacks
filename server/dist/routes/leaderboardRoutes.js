"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const leaderboardController_1 = require("../controllers/leaderboardController");
const router = (0, express_1.Router)();
router.get('/', leaderboardController_1.getLeaderboardHandler);
router.get('/my-rank', auth_1.authenticate, leaderboardController_1.getMyRankHandler);
exports.default = router;
//# sourceMappingURL=leaderboardRoutes.js.map