import { Router } from 'express';
import {
  getKpis,
  getDailyRevenue,
  getMonthlyRevenue,
  getPaymentModes,
  getTopServices,
  getHourlyOrders,
  getPerformanceScore,
} from '../controllers/reports.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

// Accessible au gérant ET au réceptionniste
router.use(verifyToken, verifyRole(['gerant', 'receptionniste']));

router.get('/kpis',           getKpis);
router.get('/daily',          getDailyRevenue);
router.get('/monthly',        getMonthlyRevenue);
router.get('/payments',       getPaymentModes);
router.get('/services',       getTopServices);
router.get('/hourly',         getHourlyOrders);
router.get('/performance',    getPerformanceScore);

export default router;
