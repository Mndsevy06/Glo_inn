import { Router } from 'express';
import {
  getServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';
import { upload } from '../config/upload';

const router = Router();

// GET /api/services — services actifs (publique et commande)
router.get('/', getServices);

router.use(verifyToken);

// GET /api/services/admin — tous les services (pour la gestion du menu)
router.get('/admin', verifyRole(['gerant', 'receptionniste']), getAllServicesAdmin);

// POST /api/services
router.post('/', verifyRole(['gerant', 'receptionniste']), upload.single('image'), createService);

// PUT /api/services/:id
router.put('/:id', verifyRole(['gerant', 'receptionniste']), upload.single('image'), updateService);

// DELETE /api/services/:id
router.delete('/:id', verifyRole(['gerant', 'receptionniste']), deleteService);

export default router;
