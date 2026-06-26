"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendReminder = exports.updateOrderPayment = exports.updateOrderStatus = exports.getOrders = exports.createOrder = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const createOrder = async (req, res) => {
    try {
        const { clientId, newClient, cart, expectedDate } = req.body;
        const userRole = req.user.role;
        const isClient = userRole === 'client';
        const id_receptionniste = isClient ? null : req.user.id;
        if (!cart || cart.length === 0) {
            res.status(400).json({ message: 'Le panier est vide.' });
            return;
        }
        let finalClientId = clientId;
        // Création d'un nouveau client si nécessaire
        if (newClient && !clientId) {
            let username = newClient.username;
            if (!username) {
                const baseUsername = newClient.nom.toLowerCase().replace(/[^a-z0-9]/g, '_');
                username = baseUsername;
            }
            let counter = 1;
            let finalUsername = username;
            while (await db_1.default.utilisateur.findUnique({ where: { username: finalUsername } })) {
                finalUsername = `${username}_${counter}`;
                counter++;
            }
            const passwordToUse = newClient.password || '123456';
            const hashedPassword = await bcrypt_1.default.hash(passwordToUse, 10);
            const client = await db_1.default.utilisateur.create({
                data: {
                    nom: newClient.nom,
                    telephone: newClient.telephone,
                    adresse: newClient.adresse || '',
                    role: 'client',
                    username: finalUsername,
                    password: hashedPassword,
                }
            });
            finalClientId = client.id;
        }
        if (!finalClientId) {
            res.status(400).json({ message: 'Client introuvable.' });
            return;
        }
        // Calculer les montants
        let montantTotal = 0;
        const lignesData = [];
        for (const item of cart) {
            const service = await db_1.default.service.findUnique({ where: { id: item.serviceId } });
            if (!service)
                continue;
            const isExpress = item.type === 'Express' && service.express_disponible;
            const price = isExpress && service.tarif_express ? Number(service.tarif_express) : Number(service.tarif_unitaire);
            const sousTotal = price * item.quantite;
            montantTotal += sousTotal;
            lignesData.push({
                id_service: service.id,
                quantite: item.quantite,
                type_service: item.type === 'Express' ? 'Express' : 'Normal',
                note_etat: item.note || '',
                sous_total: sousTotal,
            });
        }
        // Créer la commande
        const dateRetrait = expectedDate ? new Date(expectedDate) : new Date(Date.now() + 48 * 60 * 60 * 1000); // +48h by default
        const commande = await db_1.default.commande.create({
            data: {
                client: { connect: { id: finalClientId } },
                ...(id_receptionniste && { receptionniste: { connect: { id: id_receptionniste } } }),
                date_retrait_prevue: dateRetrait,
                etat: isClient ? 'en_attente' : 'depose',
                montant_total: montantTotal,
                statut_paiement: 'Non_payee',
                lignes: {
                    create: lignesData.map(l => ({
                        quantite: l.quantite,
                        type_service: l.type_service,
                        note_etat: l.note_etat,
                        sous_total: l.sous_total,
                        service: { connect: { id: l.id_service } }
                    }))
                }
            },
            include: {
                client: true,
                lignes: { include: { service: true } }
            }
        });
        // Générer la facture
        const annee = new Date().getFullYear();
        const countFactures = await db_1.default.facture.count();
        const numeroFacture = `INV-${annee}-${(countFactures + 1).toString().padStart(4, '0')}`;
        const facture = await db_1.default.facture.create({
            data: {
                commande: { connect: { id: commande.id } },
                numero: numeroFacture,
                montant_total: montantTotal,
                statut_paiement: 'Non_payee',
            }
        });
        res.status(201).json({ message: 'Commande créée avec succès', commande, facture });
    }
    catch (error) {
        console.error('Erreur createOrder:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.createOrder = createOrder;
const getOrders = async (req, res) => {
    try {
        const orders = await db_1.default.commande.findMany({
            include: {
                client: { select: { nom: true, telephone: true } },
                lignes: { include: { service: true } },
                notifications: { orderBy: { date_envoi: 'asc' } }
            },
            orderBy: { date_reception: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Erreur getOrders:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getOrders = getOrders;
const updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const validStatuses = ['depose', 'en_cours', 'pret', 'retire'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ message: 'Statut invalide.' });
            return;
        }
        // 🔒 Security: Once an order is marked as 'retire', it cannot be modified
        const existing = await db_1.default.commande.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Commande non trouvée.' });
            return;
        }
        if (existing.etat === 'retire') {
            res.status(403).json({ message: 'Cette commande a déjà été retirée. Son statut ne peut plus être modifié.' });
            return;
        }
        const order = await db_1.default.commande.update({
            where: { id },
            data: { etat: status }
        });
        res.json({ message: 'Statut mis à jour', order });
    }
    catch (error) {
        console.error('Erreur updateOrderStatus:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateOrderStatus = updateOrderStatus;
const updateOrderPayment = async (req, res) => {
    try {
        const id = req.params.id;
        const order = await db_1.default.commande.findUnique({ where: { id }, include: { facture: true } });
        if (!order) {
            res.status(404).json({ message: 'Commande non trouvée.' });
            return;
        }
        const updatedOrder = await db_1.default.commande.update({
            where: { id },
            data: { statut_paiement: 'Payee' }
        });
        if (order.facture) {
            await db_1.default.facture.update({
                where: { id: order.facture.id },
                data: { statut_paiement: 'Payee' }
            });
            await db_1.default.paiement.create({
                data: {
                    id_facture: order.facture.id,
                    montant: order.montant_total,
                    mode_paiement: 'Cash'
                }
            });
        }
        res.json({ message: 'Paiement validé', order: updatedOrder });
    }
    catch (error) {
        console.error('Erreur updateOrderPayment:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateOrderPayment = updateOrderPayment;
const sendReminder = async (req, res) => {
    try {
        const id = req.params.id;
        const order = await db_1.default.commande.findUnique({
            where: { id },
            include: { client: true }
        });
        if (!order) {
            res.status(404).json({ message: 'Commande non trouvée.' });
            return;
        }
        const notification = await db_1.default.notification.create({
            data: {
                id_utilisateur: order.id_client,
                id_commande: order.id,
                message: `Votre commande ${order.id.split('-')[0].toUpperCase()} est prête pour récupération !`,
            }
        });
        // Emit real-time notification to the client via WebSocket
        try {
            const { getIO } = await Promise.resolve().then(() => __importStar(require('../config/socket')));
            getIO().to(order.id_client).emit('new_notification', notification);
        }
        catch (socketErr) {
            console.warn('Socket non disponible:', socketErr);
        }
        res.json({ message: 'Rappel envoyé avec succès', notification });
    }
    catch (error) {
        console.error('Erreur sendReminder:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.sendReminder = sendReminder;
