import { Router } from 'express';
import {
  submitAvis,
  getAllAvis,
  getUnreadCount,
  markAvisRead,
  markAllAvisRead,
} from '../controllers/avis.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

// POST /api/avis — Client soumet un avis (commande payée)
router.post('/', verifyRole(['client']), submitAvis);

// GET /api/avis — Gérant voit tous les avis
router.get('/', verifyRole(['gerant']), getAllAvis);

// GET /api/avis/unread-count — Gérant : badge non-lu temps réel
router.get('/unread-count', verifyRole(['gerant']), getUnreadCount);

// PATCH /api/avis/read-all — Gérant : tout marquer lu
router.patch('/read-all', verifyRole(['gerant']), markAllAvisRead);

// PATCH /api/avis/:id/read — Gérant : marquer un avis lu
router.patch('/:id/read', verifyRole(['gerant']), markAvisRead);

export default router;
