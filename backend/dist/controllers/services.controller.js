"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getAllServicesAdmin = exports.getServices = void 0;
const db_1 = __importDefault(require("../config/db"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Get active services (public menu & order form)
const getServices = async (req, res) => {
    try {
        const services = await db_1.default.service.findMany({
            where: { actif: true },
            orderBy: { categorie: 'asc' },
        });
        res.status(200).json(services);
    }
    catch (error) {
        console.error('Erreur getServices:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getServices = getServices;
// Get ALL services including inactive (admin management page)
const getAllServicesAdmin = async (req, res) => {
    try {
        const services = await db_1.default.service.findMany({
            orderBy: { categorie: 'asc' },
        });
        res.status(200).json(services);
    }
    catch (error) {
        console.error('Erreur getAllServicesAdmin:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getAllServicesAdmin = getAllServicesAdmin;
// Create a service (with optional image upload)
const createService = async (req, res) => {
    try {
        const { libelle, description, tarif_unitaire, categorie, express_disponible, tarif_express, actif } = req.body;
        if (!libelle || !tarif_unitaire || !categorie) {
            res.status(400).json({ message: 'Champs obligatoires manquants (libelle, tarif_unitaire, categorie).' });
            return;
        }
        // Build image URL if file was uploaded
        let imageUrl = null;
        if (req.file) {
            imageUrl = `/uploads/services/${req.file.filename}`;
        }
        const service = await db_1.default.service.create({
            data: {
                libelle,
                description: description || '',
                tarif_unitaire: Number(tarif_unitaire),
                categorie,
                image: imageUrl,
                express_disponible: express_disponible === 'true' || express_disponible === true,
                tarif_express: tarif_express && tarif_express !== '' ? Number(tarif_express) : null,
                actif: actif !== undefined ? (actif === 'true' || actif === true) : true,
            }
        });
        res.status(201).json({ message: 'Service créé avec succès.', service });
    }
    catch (error) {
        console.error('Erreur createService:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.createService = createService;
// Update a service (with optional image replacement)
const updateService = async (req, res) => {
    try {
        const id = req.params.id;
        const { libelle, description, tarif_unitaire, categorie, express_disponible, tarif_express, actif } = req.body;
        const existing = await db_1.default.service.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Service introuvable.' });
            return;
        }
        // Handle new image
        let imageUrl = undefined;
        if (req.file) {
            // Delete old image file if it exists
            if (existing.image) {
                const oldPath = path_1.default.join(process.cwd(), existing.image);
                if (fs_1.default.existsSync(oldPath))
                    fs_1.default.unlinkSync(oldPath);
            }
            imageUrl = `/uploads/services/${req.file.filename}`;
        }
        const service = await db_1.default.service.update({
            where: { id },
            data: {
                ...(libelle && { libelle }),
                ...(description !== undefined && { description }),
                ...(tarif_unitaire !== undefined && { tarif_unitaire: Number(tarif_unitaire) }),
                ...(categorie && { categorie }),
                ...(express_disponible !== undefined && { express_disponible: express_disponible === 'true' || express_disponible === true }),
                ...(tarif_express !== undefined && { tarif_express: tarif_express && tarif_express !== '' ? Number(tarif_express) : null }),
                ...(actif !== undefined && { actif: actif === 'true' || actif === true }),
                ...(imageUrl !== undefined && { image: imageUrl }),
            }
        });
        res.status(200).json({ message: 'Service mis à jour avec succès.', service });
    }
    catch (error) {
        console.error('Erreur updateService:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateService = updateService;
// Delete a service
const deleteService = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db_1.default.service.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Service introuvable.' });
            return;
        }
        // Delete associated image file
        if (existing.image) {
            const imgPath = path_1.default.join(process.cwd(), existing.image);
            if (fs_1.default.existsSync(imgPath))
                fs_1.default.unlinkSync(imgPath);
        }
        await db_1.default.service.delete({ where: { id } });
        res.status(200).json({ message: 'Service supprimé avec succès.' });
    }
    catch (error) {
        console.error('Erreur deleteService:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.deleteService = deleteService;
