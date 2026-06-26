"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Route: POST /api/auth/login
router.post('/login', auth_controller_1.login);
// Route: POST /api/auth/register
router.post('/register', auth_controller_1.register);
// Route: PUT /api/auth/settings
router.put('/settings', auth_middleware_1.verifyToken, auth_controller_1.updateSettings);
exports.default = router;
