"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("../controllers/payments.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Middleware to capture raw body for webhook signature verification.
 * Must be applied BEFORE express.json() parses the body.
 * Applied only to the /webhook route.
 */
const captureRawBody = (req, res, next) => {
    let rawData = '';
    req.on('data', (chunk) => {
        rawData += chunk.toString();
    });
    req.on('end', () => {
        req.rawBody = rawData;
        try {
            req.body = JSON.parse(rawData || '{}');
        }
        catch {
            req.body = {};
        }
        next();
    });
};
// ─── Webhook (no auth — called by PawaPay servers) ────────────────────────────
// This route MUST use captureRawBody to verify PawaPay's signature
router.post('/webhook', captureRawBody, payments_controller_1.handleWebhook);
// ─── Authenticated routes ─────────────────────────────────────────────────────
router.use(auth_middleware_1.verifyToken);
// POST /api/payments/initiate  — Client initiates a mobile money payment
router.post('/initiate', payments_controller_1.initiatePayment);
// GET /api/payments/status/:depositId — Check status of a deposit
router.get('/status/:depositId', payments_controller_1.checkPaymentStatus);
// ─── Netikash routes ──────────────────────────────────────────────────────────
// Webhook (no auth — called by Netikash servers)
router.post('/netikash/webhook', captureRawBody, payments_controller_1.handleNetikashWebhook);
// POST /api/payments/netikash/initiate — Client initiates a Netikash payment
router.post('/netikash/initiate', payments_controller_1.initiateNetikashPayment);
// GET /api/payments/netikash/status/:requestId — Check status of a Netikash payment
router.get('/netikash/status/:requestId', payments_controller_1.checkNetikashPaymentStatus);
exports.default = router;
