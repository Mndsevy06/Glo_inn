import { Router } from 'express';
import { login, updateSettings } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route: POST /api/auth/login
router.post('/login', login);

// Route: PUT /api/auth/settings
router.put('/settings', verifyToken, updateSettings);

export default router;
