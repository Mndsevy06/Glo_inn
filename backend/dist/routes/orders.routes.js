"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orders_controller_1 = require("../controllers/orders.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
// POST /api/orders
router.post('/', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste', 'client']), orders_controller_1.createOrder);
// GET /api/orders
router.get('/', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), orders_controller_1.getOrders);
// PATCH /api/orders/:id/status
router.patch('/:id/status', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), orders_controller_1.updateOrderStatus);
// PATCH /api/orders/:id/payment
router.patch('/:id/payment', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), orders_controller_1.updateOrderPayment);
// POST /api/orders/:id/remind
router.post('/:id/remind', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), orders_controller_1.sendReminder);
exports.default = router;
