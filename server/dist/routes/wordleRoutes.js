"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const wordleController_1 = require("../controllers/wordleController");
const router = (0, express_1.Router)();
router.get('/daily', wordleController_1.getDailyWordle);
router.post('/guess', auth_1.optionalAuth, wordleController_1.submitWordleGuess);
exports.default = router;
//# sourceMappingURL=wordleRoutes.js.map