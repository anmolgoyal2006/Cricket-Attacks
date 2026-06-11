"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const battleController_1 = require("../controllers/battleController");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
router.post('/pve', auth_1.authenticate, (0, validation_1.validate)(validation_2.startBattleSchema), battleController_1.startPvE);
router.post('/:battleId/round', auth_1.authenticate, (0, validation_1.validate)(validation_2.playRoundSchema), battleController_1.playRoundHandler);
router.get('/', auth_1.authenticate, battleController_1.getBattleHistory);
router.get('/:id', auth_1.authenticate, battleController_1.getBattleById);
exports.default = router;
//# sourceMappingURL=battleRoutes.js.map