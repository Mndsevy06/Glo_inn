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
exports.checkNetikashPaymentStatus = exports.handleNetikashWebhook = exports.initiateNetikashPayment = exports.checkPaymentStatus = exports.handleWebhook = exports.initiatePayment = void 0;
const db_1 = __importDefault(require("../config/db"));
const pawapay_1 = require("../config/pawapay");
const netikash_1 = require("../config/netikash");
/**
 * POST /api/payments/initiate
 * Initiates a PawaPay mobile money deposit for an order.
 * Called by the authenticated client from the frontend.
 */
const initiatePayment = async (req, res) => {
    try {
        const { id_facture, telephone } = req.body;
        const userId = req.user?.id;
        if (!id_facture || !telephone) {
            res.status(400).json({ message: 'id_facture et telephone sont requis.' });
            return;
        }
        // Fetch invoice with related order
        const facture = await db_1.default.facture.findUnique({
            where: { id: id_facture },
            include: { commande: true },
        });
        if (!facture) {
            res.status(404).json({ message: 'Facture introuvable.' });
            return;
        }
        // Security: Ensure the client owns this order
        if (userId && facture.commande.id_client !== userId) {
            res.status(403).json({ message: 'Accès non autorisé à cette facture.' });
            return;
        }
        if (facture.statut_paiement === 'Payee') {
            res.status(400).json({ message: 'Cette facture est déjà payée.' });
            return;
        }
        // Initiate deposit with PawaPay
        const { depositId, operateur } = await (0, pawapay_1.initiateDeposit)({
            montant: Number(facture.montant_total),
            telephone,
            description: `Gloria #${facture.numero}`,
            commandeId: facture.id_commande,
        });
        // Record the pending payment in DB
        const paiement = await db_1.default.paiement.create({
            data: {
                id_facture: facture.id,
                montant: facture.montant_total,
                mode_paiement: 'PawaPay',
                pawapay_deposit_id: depositId,
                pawapay_status: 'INITIATED',
                telephone_client: (0, pawapay_1.formatPhoneNumber)(telephone),
                operateur,
            },
        });
        res.status(201).json({
            message: 'Paiement initié. Veuillez confirmer sur votre téléphone.',
            depositId,
            operateur,
            paiement,
        });
    }
    catch (error) {
        const err = error;
        console.error('Erreur initiatePayment:', err.message);
        // Provide a clear message if PawaPay is not yet configured
        if (err.message.includes('non configuré')) {
            res.status(503).json({ message: 'Service de paiement non configuré. Contactez l\'administrateur.' });
            return;
        }
        res.status(500).json({ message: err.message || 'Erreur serveur.' });
    }
};
exports.initiatePayment = initiatePayment;
/**
 * POST /api/payments/webhook
 * Receives payment status updates from PawaPay (called server-to-server).
 * Must be accessible from the internet (use ngrok in dev).
 */
const handleWebhook = async (req, res) => {
    try {
        // Verify the webhook signature
        const headerSig = req.headers['x-pawapay-signature'];
        const signature = Array.isArray(headerSig) ? headerSig[0] : headerSig;
        const rawBody = req.rawBody;
        if (!(0, pawapay_1.verifyWebhookSignature)(rawBody, signature)) {
            console.warn('⚠️ Webhook PawaPay: signature invalide');
            res.status(401).json({ message: 'Signature invalide.' });
            return;
        }
        const event = req.body;
        const depositId = event.depositId;
        const status = event.status; // COMPLETED | FAILED | REVERSED
        console.log(`📲 PawaPay Webhook — depositId: ${depositId}, status: ${status}`);
        if (!depositId || !status) {
            res.status(400).json({ message: 'Payload webhook invalide.' });
            return;
        }
        // Find the corresponding payment in DB
        const paiement = await db_1.default.paiement.findUnique({
            where: { pawapay_deposit_id: depositId },
            include: { facture: true },
        });
        if (!paiement) {
            console.warn(`Webhook: paiement avec depositId ${depositId} introuvable.`);
            res.status(200).json({ received: true }); // Always respond 200 to PawaPay
            return;
        }
        // Update payment status
        await db_1.default.paiement.update({
            where: { id: paiement.id },
            data: { pawapay_status: status },
        });
        if (status === 'COMPLETED') {
            // Mark invoice and order as paid
            await db_1.default.facture.update({
                where: { id: paiement.id_facture },
                data: { statut_paiement: 'Payee' },
            });
            await db_1.default.commande.update({
                where: { id: paiement.facture.id_commande },
                data: { statut_paiement: 'Payee' },
            });
            // Send a confirmation notification to the client
            const commande = await db_1.default.commande.findUnique({ where: { id: paiement.facture.id_commande } });
            if (commande) {
                const notification = await db_1.default.notification.create({
                    data: {
                        id_utilisateur: commande.id_client,
                        id_commande: commande.id,
                        message: `✅ Paiement de ${paiement.montant} CDF confirmé pour votre commande ${commande.id.split('-')[0].toUpperCase()} via Mobile Money.`,
                    },
                });
                // Push real-time notification via WebSocket
                try {
                    const { getIO } = await Promise.resolve().then(() => __importStar(require('../config/socket')));
                    getIO().to(commande.id_client).emit('new_notification', notification);
                    getIO().to(commande.id_client).emit('payment_confirmed', { commandeId: commande.id });
                }
                catch (socketErr) {
                    console.warn('Socket non disponible pour notification paiement.');
                }
            }
            console.log(`✅ Paiement COMPLETED pour facture ${paiement.id_facture}`);
        }
        else if (status === 'FAILED' || status === 'REVERSED') {
            console.warn(`❌ Paiement ${status} pour depositId ${depositId}`);
            // Optionally notify the client of failure
        }
        // Always respond 200 to acknowledge receipt to PawaPay
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Erreur handleWebhook:', error);
        // Always respond 200 to prevent PawaPay from retrying excessively
        res.status(200).json({ received: true, error: 'Internal processing error' });
    }
};
exports.handleWebhook = handleWebhook;
/**
 * GET /api/payments/status/:depositId
 * Check the status of a specific deposit.
 */
const checkPaymentStatus = async (req, res) => {
    try {
        const depositId = req.params.depositId;
        const paiement = await db_1.default.paiement.findUnique({
            where: { pawapay_deposit_id: depositId },
            include: { facture: { include: { commande: true } } },
        });
        if (!paiement) {
            res.status(404).json({ message: 'Paiement introuvable.' });
            return;
        }
        // Also check live status from PawaPay
        let pawapayLiveStatus = null;
        try {
            pawapayLiveStatus = await (0, pawapay_1.getDepositStatus)(depositId);
        }
        catch (e) {
            // If PawaPay is not configured, just return DB status
        }
        res.json({
            paiement,
            pawapay_live: pawapayLiveStatus,
        });
    }
    catch (error) {
        console.error('Erreur checkPaymentStatus:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.checkPaymentStatus = checkPaymentStatus;
// ─── NETIKASH ────────────────────────────────────────────────────────────────
const initiateNetikashPayment = async (req, res) => {
    try {
        const { id_facture } = req.body;
        const userId = req.user?.id;
        if (!id_facture) {
            res.status(400).json({ message: 'id_facture est requis.' });
            return;
        }
        const facture = await db_1.default.facture.findUnique({
            where: { id: id_facture },
            include: { commande: true },
        });
        if (!facture) {
            res.status(404).json({ message: 'Facture introuvable.' });
            return;
        }
        if (userId && facture.commande.id_client !== userId) {
            res.status(403).json({ message: 'Accès non autorisé.' });
            return;
        }
        if (facture.statut_paiement === 'Payee') {
            res.status(400).json({ message: 'Cette facture est déjà payée.' });
            return;
        }
        const referer_url = req.headers.origin || 'http://localhost:5173';
        // Create payment request with Netikash
        const response = await (0, netikash_1.createPaymentRequest)({
            amount: Number(facture.montant_total),
            currency: 'CDF',
            ref: `CMD-${facture.commande.id.split('-')[0].toUpperCase()}`,
            referer_url: `${referer_url}/client/orders`,
            label: `Paiement commande #${facture.numero}`,
        });
        const requestId = (0, netikash_1.extractRequestId)(response.link);
        // Record the pending payment
        const paiement = await db_1.default.paiement.create({
            data: {
                id_facture: facture.id,
                montant: facture.montant_total,
                mode_paiement: 'Netikash',
                netikash_trans: response.trans,
                netikash_request_id: requestId,
                netikash_status: response.status,
                netikash_link: response.link,
            },
        });
        res.status(201).json({
            message: 'Redirection vers la page de paiement...',
            link: response.link,
            requestId,
            paiement,
        });
    }
    catch (error) {
        const err = error;
        console.error('Erreur initiateNetikashPayment:', err.message);
        res.status(500).json({ message: err.message || 'Erreur serveur.' });
    }
};
exports.initiateNetikashPayment = initiateNetikashPayment;
const handleNetikashWebhook = async (req, res) => {
    try {
        const headerSig = req.headers['x-signature'];
        const signature = Array.isArray(headerSig) ? headerSig[0] : headerSig;
        const rawBody = req.rawBody;
        if (!(0, netikash_1.verifyWebhookSignature)(rawBody, signature)) {
            console.warn('⚠️ Webhook Netikash: signature invalide');
            res.status(401).json({ message: 'Signature invalide.' });
            return;
        }
        const event = req.body || {};
        const eventType = (event.event || '').toLowerCase();
        const status = (event.status || '').toLowerCase();
        const trx = event.trx;
        console.log(`📲 Netikash Webhook — trx: ${trx}, event: ${eventType}, status: ${status}`);
        if (!trx || !status) {
            res.status(400).json({ message: 'Payload webhook invalide.' });
            return;
        }
        const paiement = await db_1.default.paiement.findFirst({
            where: { netikash_trans: trx },
            include: { facture: true },
        });
        if (!paiement) {
            console.warn(`Webhook: paiement avec trx ${trx} introuvable.`);
            res.status(200).json({ received: true });
            return;
        }
        await db_1.default.paiement.update({
            where: { id: paiement.id },
            data: { netikash_status: status },
        });
        if (eventType === 'payment.success' || ['approved', 'completed', 'success', 'successful'].includes(status)) {
            await db_1.default.facture.update({
                where: { id: paiement.id_facture },
                data: { statut_paiement: 'Payee' },
            });
            await db_1.default.commande.update({
                where: { id: paiement.facture.id_commande },
                data: { statut_paiement: 'Payee' },
            });
            const commande = await db_1.default.commande.findUnique({ where: { id: paiement.facture.id_commande } });
            if (commande) {
                const notification = await db_1.default.notification.create({
                    data: {
                        id_utilisateur: commande.id_client,
                        id_commande: commande.id,
                        message: `✅ Paiement de ${paiement.montant} CDF confirmé pour votre commande ${commande.id.split('-')[0].toUpperCase()} via Netikash.`,
                    },
                });
                try {
                    const { getIO } = await Promise.resolve().then(() => __importStar(require('../config/socket')));
                    getIO().to(commande.id_client).emit('new_notification', notification);
                    getIO().to(commande.id_client).emit('payment_confirmed', { commandeId: commande.id });
                }
                catch (socketErr) {
                    console.warn('Socket non disponible pour notification paiement.');
                }
            }
            console.log(`✅ Paiement Netikash complété pour facture ${paiement.id_facture}`);
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Erreur handleNetikashWebhook:', error);
        res.status(200).json({ received: true, error: 'Internal processing error' });
    }
};
exports.handleNetikashWebhook = handleNetikashWebhook;
const checkNetikashPaymentStatus = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const paiement = await db_1.default.paiement.findUnique({
            where: { netikash_request_id: requestId },
            include: { facture: { include: { commande: true } } },
        });
        if (!paiement) {
            res.status(404).json({ message: 'Paiement introuvable.' });
            return;
        }
        let liveStatus = null;
        try {
            liveStatus = await (0, netikash_1.getPaymentStatus)(requestId);
            // Update DB if status changed
            const normalizedStatus = liveStatus.status?.toLowerCase();
            if (normalizedStatus && normalizedStatus !== paiement.netikash_status?.toLowerCase()) {
                await db_1.default.paiement.update({
                    where: { id: paiement.id },
                    data: { netikash_status: normalizedStatus }
                });
                if (['approved', 'completed', 'success', 'successful'].includes(normalizedStatus)) {
                    await db_1.default.facture.update({
                        where: { id: paiement.id_facture },
                        data: { statut_paiement: 'Payee' },
                    });
                    const idCommande = paiement.facture?.id_commande;
                    if (idCommande) {
                        await db_1.default.commande.update({
                            where: { id: idCommande },
                            data: { statut_paiement: 'Payee' },
                        });
                    }
                }
            }
        }
        catch (e) {
            // Ignorer l'erreur, renvoyer ce qu'on a en DB
        }
        res.json({
            paiement,
            netikash_live: liveStatus,
        });
    }
    catch (error) {
        console.error('Erreur checkNetikashPaymentStatus:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.checkNetikashPaymentStatus = checkNetikashPaymentStatus;
