"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seasonController_1 = require("../controllers/seasonController");
const router = (0, express_1.Router)();
router.get('/current', seasonController_1.getCurrentSeason);
router.get('/history', seasonController_1.getSeasonHistory);
exports.default = router;
//# sourceMappingURL=seasonRoutes.js.map