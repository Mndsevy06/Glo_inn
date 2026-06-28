import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus, updateOrderPayment, sendReminder, updateOrderCart, partialWithdraw } from '../controllers/orders.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// POST /api/orders
router.post('/', verifyRole(['gerant', 'receptionniste', 'client']), createOrder);

// GET /api/orders
router.get('/', verifyRole(['gerant', 'receptionniste']), getOrders);

// PATCH /api/orders/:id/status
router.patch('/:id/status', verifyRole(['gerant', 'receptionniste']), updateOrderStatus);

// PATCH /api/orders/:id/payment
router.patch('/:id/payment', verifyRole(['gerant', 'receptionniste']), updateOrderPayment);

// POST /api/orders/:id/remind
router.post('/:id/remind', verifyRole(['gerant', 'receptionniste']), sendReminder);

// PUT /api/orders/:id/cart
router.put('/:id/cart', verifyRole(['gerant', 'receptionniste']), updateOrderCart);

// POST /api/orders/:id/partial-withdraw
router.post('/:id/partial-withdraw', verifyRole(['gerant', 'receptionniste']), partialWithdraw);

export default router;
