"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("../controllers/reports.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Accessible au gérant ET au réceptionniste
router.use(auth_middleware_1.verifyToken, (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']));
router.get('/kpis', reports_controller_1.getKpis);
router.get('/daily', reports_controller_1.getDailyRevenue);
router.get('/monthly', reports_controller_1.getMonthlyRevenue);
router.get('/payments', reports_controller_1.getPaymentModes);
router.get('/services', reports_controller_1.getTopServices);
router.get('/hourly', reports_controller_1.getHourlyOrders);
router.get('/performance', reports_controller_1.getPerformanceScore);
exports.default = router;
