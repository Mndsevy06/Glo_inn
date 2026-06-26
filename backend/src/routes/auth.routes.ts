import { Router } from 'express';
import { login, register, updateSettings } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route: POST /api/auth/login
router.post('/login', login);

// Route: POST /api/auth/register
router.post('/register', register);

// Route: PUT /api/auth/settings
router.put('/settings', verifyToken, updateSettings);

export default router;
