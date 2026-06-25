import { Request, Response } from 'express';
import prisma from '../config/db';
import { initiateDeposit, getDepositStatus, verifyWebhookSignature, detectOperateur, formatPhoneNumber } from '../config/pawapay';

/**
 * POST /api/payments/initiate
 * Initiates a PawaPay mobile money deposit for an order.
 * Called by the authenticated client from the frontend.
 */
export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_facture, telephone } = req.body;
    const userId = req.user?.id;

    if (!id_facture || !telephone) {
      res.status(400).json({ message: 'id_facture et telephone sont requis.' });
      return;
    }

    // Fetch invoice with related order
    const facture = await prisma.facture.findUnique({
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
    const { depositId, operateur } = await initiateDeposit({
      montant: Number(facture.montant_total),
      telephone,
      description: `Gloria #${facture.numero}`,
      commandeId: facture.id_commande,
    });

    // Record the pending payment in DB
    const paiement = await prisma.paiement.create({
      data: {
        id_facture: facture.id,
        montant: facture.montant_total,
        mode_paiement: 'PawaPay',
        pawapay_deposit_id: depositId,
        pawapay_status: 'INITIATED',
        telephone_client: formatPhoneNumber(telephone),
        operateur,
      },
    });

    res.status(201).json({
      message: 'Paiement initié. Veuillez confirmer sur votre téléphone.',
      depositId,
      operateur,
      paiement,
    });
  } catch (error) {
    const err = error as Error;
    console.error('Erreur initiatePayment:', err.message);
    // Provide a clear message if PawaPay is not yet configured
    if (err.message.includes('non configuré')) {
      res.status(503).json({ message: 'Service de paiement non configuré. Contactez l\'administrateur.' });
      return;
    }
    res.status(500).json({ message: err.message || 'Erreur serveur.' });
  }
};

/**
 * POST /api/payments/webhook
 * Receives payment status updates from PawaPay (called server-to-server).
 * Must be accessible from the internet (use ngrok in dev).
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify the webhook signature
    const signature = req.headers['x-pawapay-signature'] as string | undefined;
    const rawBody = (req as any).rawBody as string;

    if (!verifyWebhookSignature(rawBody, signature)) {
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
    const paiement = await prisma.paiement.findUnique({
      where: { pawapay_deposit_id: depositId },
      include: { facture: true },
    });

    if (!paiement) {
      console.warn(`Webhook: paiement avec depositId ${depositId} introuvable.`);
      res.status(200).json({ received: true }); // Always respond 200 to PawaPay
      return;
    }

    // Update payment status
    await prisma.paiement.update({
      where: { id: paiement.id },
      data: { pawapay_status: status },
    });

    if (status === 'COMPLETED') {
      // Mark invoice and order as paid
      await prisma.facture.update({
        where: { id: paiement.id_facture },
        data: { statut_paiement: 'Payee' },
      });

      await prisma.commande.update({
        where: { id: paiement.facture.id_commande },
        data: { statut_paiement: 'Payee' },
      });

      // Send a confirmation notification to the client
      const commande = await prisma.commande.findUnique({ where: { id: paiement.facture.id_commande } });
      if (commande) {
        const notification = await prisma.notification.create({
          data: {
            id_utilisateur: commande.id_client,
            id_commande: commande.id,
            message: `✅ Paiement de ${paiement.montant} CDF confirmé pour votre commande ${commande.id.split('-')[0].toUpperCase()} via Mobile Money.`,
          },
        });

        // Push real-time notification via WebSocket
        try {
          const { getIO } = await import('../config/socket');
          getIO().to(commande.id_client).emit('new_notification', notification);
          getIO().to(commande.id_client).emit('payment_confirmed', { commandeId: commande.id });
        } catch (socketErr) {
          console.warn('Socket non disponible pour notification paiement.');
        }
      }

      console.log(`✅ Paiement COMPLETED pour facture ${paiement.id_facture}`);
    } else if (status === 'FAILED' || status === 'REVERSED') {
      console.warn(`❌ Paiement ${status} pour depositId ${depositId}`);
      // Optionally notify the client of failure
    }

    // Always respond 200 to acknowledge receipt to PawaPay
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erreur handleWebhook:', error);
    // Always respond 200 to prevent PawaPay from retrying excessively
    res.status(200).json({ received: true, error: 'Internal processing error' });
  }
};

/**
 * GET /api/payments/status/:depositId
 * Check the status of a specific deposit.
 */
export const checkPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { depositId } = req.params;

    const paiement = await prisma.paiement.findUnique({
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
      pawapayLiveStatus = await getDepositStatus(depositId);
    } catch (e) {
      // If PawaPay is not configured, just return DB status
    }

    res.json({
      paiement,
      pawapay_live: pawapayLiveStatus,
    });
  } catch (error) {
    console.error('Erreur checkPaymentStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
