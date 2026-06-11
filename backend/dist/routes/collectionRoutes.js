"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const collectionController_1 = require("../controllers/collectionController");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, collectionController_1.getCollection);
router.get('/stats', auth_1.authenticate, collectionController_1.getCollectionStats);
router.post('/add', auth_1.authenticate, collectionController_1.addToCollection);
exports.default = router;
//# sourceMappingURL=collectionRoutes.js.map