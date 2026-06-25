import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus, updateOrderPayment, sendReminder } from '../controllers/orders.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// POST /api/orders
router.post('/', verifyRole(['gerant', 'receptionniste']), createOrder);

// GET /api/orders
router.get('/', verifyRole(['gerant', 'receptionniste']), getOrders);

// PATCH /api/orders/:id/status
router.patch('/:id/status', verifyRole(['gerant', 'receptionniste']), updateOrderStatus);

// PATCH /api/orders/:id/payment
router.patch('/:id/payment', verifyRole(['gerant', 'receptionniste']), updateOrderPayment);

// POST /api/orders/:id/remind
router.post('/:id/remind', verifyRole(['gerant', 'receptionniste']), sendReminder);

export default router;
