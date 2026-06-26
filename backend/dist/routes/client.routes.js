"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
router.use((0, auth_middleware_1.verifyRole)(['client'])); // Only clients can access these routes
// GET /api/client/orders
router.get('/orders', client_controller_1.getMyOrders);
// GET /api/client/notifications
router.get('/notifications', client_controller_1.getMyNotifications);
// PATCH /api/client/notifications/:id/read
router.patch('/notifications/:id/read', client_controller_1.markNotificationRead);
exports.default = router;
