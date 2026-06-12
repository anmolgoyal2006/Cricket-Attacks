"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const quizController_1 = require("../controllers/quizController");
const router = (0, express_1.Router)();
router.get('/questions', quizController_1.getQuizQuestions);
router.post('/answer', auth_1.optionalAuth, quizController_1.submitQuizAnswer);
exports.default = router;
//# sourceMappingURL=quizRoutes.js.map