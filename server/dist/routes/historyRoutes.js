"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const historyController_1 = require("../controllers/historyController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, historyController_1.getMatchHistory);
router.get('/user/:userId', auth_1.authenticate, historyController_1.getMatchHistoryByUser);
exports.default = router;
//# sourceMappingURL=historyRoutes.js.map