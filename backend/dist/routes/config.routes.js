"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const config_controller_1 = require("../controllers/config.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', config_controller_1.getConfig);
router.put('/', auth_middleware_1.verifyToken, config_controller_1.updateConfig);
exports.default = router;
