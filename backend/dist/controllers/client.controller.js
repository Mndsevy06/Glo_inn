"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getMyNotifications = exports.getMyOrders = void 0;
const db_1 = __importDefault(require("../config/db"));
const getMyOrders = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }
        const orders = await db_1.default.commande.findMany({
            where: { id_client: id },
            include: {
                lignes: { include: { service: true } },
                facture: true
            },
            orderBy: { date_reception: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Erreur getMyOrders:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getMyOrders = getMyOrders;
const getMyNotifications = async (req, res) => {
    try {
        const id = req.user?.id;
        if (!id) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }
        const notifications = await db_1.default.notification.findMany({
            where: { id_utilisateur: id },
            orderBy: { date_envoi: 'desc' }
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Erreur getMyNotifications:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getMyNotifications = getMyNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }
        // Ensure the notification belongs to the user
        const notification = await db_1.default.notification.findUnique({ where: { id } });
        if (!notification || notification.id_utilisateur !== userId) {
            res.status(404).json({ message: 'Notification introuvable' });
            return;
        }
        const updated = await db_1.default.notification.update({
            where: { id },
            data: { lue: true }
        });
        res.json({ message: 'Notification lue', notification: updated });
    }
    catch (error) {
        console.error('Erreur markNotificationRead:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.markNotificationRead = markNotificationRead;
