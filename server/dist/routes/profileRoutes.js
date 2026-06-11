"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const profileController_1 = require("../controllers/profileController");
const router = (0, express_1.Router)();
router.get('/me', auth_1.authenticate, profileController_1.getMyProfile);
router.get('/:id', auth_1.authenticate, profileController_1.getProfile);
exports.default = router;
//# sourceMappingURL=profileRoutes.js.map