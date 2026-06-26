import { Router } from 'express';
import { getConfig, updateConfig } from '../controllers/config.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getConfig);
router.put('/', verifyToken, updateConfig);

export default router;
