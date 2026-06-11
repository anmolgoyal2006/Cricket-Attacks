"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const packController_1 = require("../controllers/packController");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.get('/', packController_1.getPackInfo);
router.post('/open', auth_1.authenticate, rateLimiter_1.packLimiter, (0, validation_1.validate)(validation_2.openPackSchema), packController_1.openPackHandler);
router.get('/history', auth_1.authenticate, packController_1.getPackHistory);
exports.default = router;
//# sourceMappingURL=packRoutes.js.map