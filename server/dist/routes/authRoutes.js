"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const validation_2 = require("../utils/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
router.post('/register', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_2.registerSchema), authController_1.register);
router.post('/login', rateLimiter_1.authLimiter, (0, validation_1.validate)(validation_2.loginSchema), authController_1.login);
router.get('/me', auth_1.authenticate, authController_1.getMe);
router.post('/claim-coins', auth_1.authenticate, authController_1.claimCoins);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map