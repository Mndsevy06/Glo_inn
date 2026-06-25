import { Router } from 'express';
import {
  getAllUsers,
  getUserStats,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  resetPassword,
} from '../controllers/users.controller';
import { verifyToken, verifyRole } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes utilisateurs nécessitent un token valide
router.use(verifyToken);

// GET /api/users/stats
router.get('/stats', verifyRole(['gerant']), getUserStats);

// GET /api/users?role=client&search=john&page=1&limit=10
router.get('/', verifyRole(['gerant', 'receptionniste']), getAllUsers);

// GET /api/users/:id
router.get('/:id', verifyRole(['gerant', 'receptionniste']), getUserById);

// POST /api/users
router.post('/', verifyRole(['gerant', 'receptionniste']), createUser);

// PUT /api/users/:id
router.put('/:id', verifyRole(['gerant']), updateUser);

// DELETE /api/users/:id
router.delete('/:id', verifyRole(['gerant']), deleteUser);

// PATCH /api/users/:id/toggle-active
router.patch('/:id/toggle-active', verifyRole(['gerant']), toggleUserActive);

// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', verifyRole(['gerant']), resetPassword);

export default router;
