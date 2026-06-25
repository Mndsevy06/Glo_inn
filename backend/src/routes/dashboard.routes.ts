import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken, verifyRole(['gerant', 'receptionniste']));

router.get('/stats', getDashboardStats);

export default router;
