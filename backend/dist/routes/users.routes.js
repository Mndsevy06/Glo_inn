"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("../controllers/users.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Toutes les routes utilisateurs nécessitent un token valide + rôle gérant
router.use(auth_middleware_1.verifyToken, (0, auth_middleware_1.verifyRole)(['gerant']));
// GET /api/users/stats
router.get('/stats', users_controller_1.getUserStats);
// GET /api/users?role=client&search=john&page=1&limit=10
router.get('/', users_controller_1.getAllUsers);
// GET /api/users/:id
router.get('/:id', users_controller_1.getUserById);
// POST /api/users
router.post('/', users_controller_1.createUser);
// PUT /api/users/:id
router.put('/:id', users_controller_1.updateUser);
// DELETE /api/users/:id
router.delete('/:id', users_controller_1.deleteUser);
// PATCH /api/users/:id/toggle-active
router.patch('/:id/toggle-active', users_controller_1.toggleUserActive);
// PATCH /api/users/:id/reset-password
router.patch('/:id/reset-password', users_controller_1.resetPassword);
exports.default = router;
