import { Router, Request, Response, NextFunction } from 'express';
import { initiatePayment, handleWebhook, checkPaymentStatus } from '../controllers/payments.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Middleware to capture raw body for webhook signature verification.
 * Must be applied BEFORE express.json() parses the body.
 * Applied only to the /webhook route.
 */
const captureRawBody = (req: Request, res: Response, next: NextFunction) => {
  let rawData = '';
  req.on('data', (chunk: Buffer) => {
    rawData += chunk.toString();
  });
  req.on('end', () => {
    (req as any).rawBody = rawData;
    try {
      req.body = JSON.parse(rawData || '{}');
    } catch {
      req.body = {};
    }
    next();
  });
};

// ─── Webhook (no auth — called by PawaPay servers) ────────────────────────────
// This route MUST use captureRawBody to verify PawaPay's signature
router.post('/webhook', captureRawBody, handleWebhook);

// ─── Authenticated routes ─────────────────────────────────────────────────────
router.use(verifyToken);

// POST /api/payments/initiate  — Client initiates a mobile money payment
router.post('/initiate', initiatePayment);

// GET /api/payments/status/:depositId — Check status of a deposit
router.get('/status/:depositId', checkPaymentStatus);

export default router;
