"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const playerController_1 = require("../controllers/playerController");
const router = (0, express_1.Router)();
router.get('/', playerController_1.getAllPlayers);
router.get('/:id', playerController_1.getPlayerById);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map