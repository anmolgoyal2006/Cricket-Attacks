"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const rankedController_1 = require("../controllers/rankedController");
const router = (0, express_1.Router)();
router.post('/complete', auth_1.authenticate, rankedController_1.completeRankedBattle);
exports.default = router;
//# sourceMappingURL=rankedRoutes.js.map