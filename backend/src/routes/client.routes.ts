import { Router } from 'express';
import { getMyOrders, getMyNotifications, markNotificationRead } from '../controllers/client.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);
router.use(verifyRole(['client'])); // Only clients can access these routes

// GET /api/client/orders
router.get('/orders', getMyOrders);

// GET /api/client/notifications
router.get('/notifications', getMyNotifications);

// PATCH /api/client/notifications/:id/read
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
