"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const services_controller_1 = require("../controllers/services.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_1 = require("../config/upload");
const router = (0, express_1.Router)();
// GET /api/services — services actifs (publique et commande)
router.get('/', services_controller_1.getServices);
router.use(auth_middleware_1.verifyToken);
// GET /api/services/admin — tous les services (pour la gestion du menu)
router.get('/admin', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), services_controller_1.getAllServicesAdmin);
// POST /api/services
router.post('/', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), upload_1.upload.single('image'), services_controller_1.createService);
// PUT /api/services/:id
router.put('/:id', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), upload_1.upload.single('image'), services_controller_1.updateService);
// DELETE /api/services/:id
router.delete('/:id', (0, auth_middleware_1.verifyRole)(['gerant', 'receptionniste']), services_controller_1.deleteService);
exports.default = router;
