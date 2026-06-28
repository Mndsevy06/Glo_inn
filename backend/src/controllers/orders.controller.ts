import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, newClient, cart, expectedDate } = req.body;
    const userRole = (req as any).user.role;
    const isClient = userRole === 'client';
    const id_receptionniste = isClient ? null : (req as any).user.id;

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
      while (await prisma.utilisateur.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${username}_${counter}`;
        counter++;
      }

      const passwordToUse = newClient.password || '123456';
      const hashedPassword = await bcrypt.hash(passwordToUse, 10);

      const client = await prisma.utilisateur.create({
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
      const service = await prisma.service.findUnique({ where: { id: item.serviceId } });
      if (!service) continue;

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

    const commande = await prisma.commande.create({
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
            type_service: l.type_service as 'Normal' | 'Express',
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
    const countFactures = await prisma.facture.count();
    const numeroFacture = `INV-${annee}-${(countFactures + 1).toString().padStart(4, '0')}`;

    const facture = await prisma.facture.create({
      data: {
        commande: { connect: { id: commande.id } },
        numero: numeroFacture,
        montant_total: montantTotal,
        statut_paiement: 'Non_payee',
      }
    });

    // Si c'est un client, créer une notification
    if (isClient) {
      const notification = await prisma.notification.create({
        data: {
          id_utilisateur: finalClientId,
          id_commande: commande.id,
          message: "Votre commande a bien été reçue. Vous devez vous rendre au Pressing Gloria Inn dans les 48h pour déposer vos vêtements.",
        }
      });
      // Emit via socket
      try {
        const { getIO } = await import('../config/socket');
        getIO().to(finalClientId).emit('new_notification', notification);
      } catch (socketErr) {
        console.warn('Socket non disponible:', socketErr);
      }
    }

    res.status(201).json({ message: 'Commande créée avec succès', commande, facture });
  } catch (error) {
    console.error('Erreur createOrder:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.commande.findMany({
      include: {
        client: { select: { nom: true, telephone: true } },
        facture: true,
        lignes: { include: { service: true } },
        notifications: { orderBy: { date_envoi: 'asc' } }
      },
      orderBy: { date_reception: 'desc' }
    });
    // Auto-annulation des commandes 'en_attente' vieilles de plus de 48h
    const now = Date.now();
    const limit48h = 48 * 60 * 60 * 1000;
    
    let hasExpired = false;
    for (const o of orders) {
      if (o.etat === 'en_attente' && (now - new Date(o.date_reception).getTime()) > limit48h) {
        await prisma.commande.update({
          where: { id: o.id },
          data: { etat: 'annule' as any }
        });
        o.etat = 'annule' as any;
        hasExpired = true;
      }
    }

    res.json(orders);
  } catch (error) {
    console.error('Erreur getOrders:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const validStatuses = ['depose', 'en_cours', 'pret', 'retire'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: 'Statut invalide.' });
      return;
    }

    // 🔒 Security: Once an order is marked as 'retire', it cannot be modified
    const existing = await prisma.commande.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Commande non trouvée.' });
      return;
    }
    if (existing.etat === 'retire') {
      res.status(403).json({ message: 'Cette commande a déjà été retirée. Son statut ne peut plus être modifié.' });
      return;
    }

    if (existing.etat === 'depose' && status !== 'depose') {
      if (existing.statut_paiement !== 'Payee') {
        res.status(403).json({ message: 'Le paiement doit être effectué avant de pouvoir modifier le statut de la commande.' });
        return;
      }
    }

    // Si le statut passe à "retire" manuellement, on met à jour toutes les quantités retirées
    if (status === 'retire') {
      const lignes = await prisma.ligneCommande.findMany({ where: { id_commande: id } });
      for (const l of lignes) {
        await prisma.ligneCommande.update({
          where: { id: l.id },
          data: { quantite_retiree: l.quantite }
        });
      }
    }

    const order = await prisma.commande.update({
      where: { id },
      data: { etat: status as any }
    });
    
    res.json({ message: 'Statut mis à jour', order });
  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


export const updateOrderPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const order = await prisma.commande.findUnique({ where: { id }, include: { facture: true } });
    if (!order) {
      res.status(404).json({ message: 'Commande non trouvée.' });
      return;
    }

    const updatedOrder = await prisma.commande.update({
      where: { id },
      data: { statut_paiement: 'Payee' }
    });

    if (order.facture) {
      await prisma.facture.update({
        where: { id: order.facture.id },
        data: { statut_paiement: 'Payee' }
      });
      
      await prisma.paiement.create({
        data: {
          id_facture: order.facture.id,
          montant: order.montant_total,
          mode_paiement: 'Cash'
        }
      });
    }

    res.json({ message: 'Paiement validé', order: updatedOrder });
  } catch (error) {
    console.error('Erreur updateOrderPayment:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const sendReminder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const order = await prisma.commande.findUnique({ 
      where: { id },
      include: { client: true }
    });
    
    if (!order) {
      res.status(404).json({ message: 'Commande non trouvée.' });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        id_utilisateur: order.id_client,
        id_commande: order.id,
        message: `Votre commande ${order.id.split('-')[0].toUpperCase()} est prête pour récupération !`,
      }
    });

    // Emit real-time notification to the client via WebSocket
    try {
      const { getIO } = await import('../config/socket');
      getIO().to(order.id_client).emit('new_notification', notification);
    } catch (socketErr) {
      console.warn('Socket non disponible:', socketErr);
    }

    res.json({ message: 'Rappel envoyé avec succès', notification });
  } catch (error) {
    console.error('Erreur sendReminder:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateOrderCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { cart } = req.body;

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ message: 'Panier invalide ou vide.' });
      return;
    }

    const order = await prisma.commande.findUnique({
      where: { id },
      include: { facture: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Commande non trouvée.' });
      return;
    }

    if (order.etat === 'retire' || order.etat === 'annule' as any || order.statut_paiement === 'Payee') {
      res.status(403).json({ message: 'Cette commande ne peut plus être modifiée (payée, annulée ou retirée).' });
      return;
    }

    // Récupérer les prix des services
    const serviceIds = cart.map((c: any) => c.serviceId);
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } }
    });

    let montantTotal = 0;
    const lignesData = [];

    for (const item of cart) {
      const service = services.find(s => s.id === item.serviceId);
      if (!service) {
        res.status(400).json({ message: `Service non trouvé: ${item.serviceId}` });
        return;
      }
      
      const prixUnitaire = Number(service.tarif_unitaire);
      const prixExpress = service.tarif_express ? Number(service.tarif_express) : prixUnitaire;
      const prix = item.type === 'Express' ? prixExpress : prixUnitaire;
      const sousTotal = prix * item.quantite;
      montantTotal += sousTotal;

      lignesData.push({
        id_service: service.id,
        quantite: item.quantite,
        type_service: item.type === 'Express' ? 'Express' : 'Normal',
        note_etat: item.note || '',
        sous_total: sousTotal,
      });
    }

    // 1. Delete old lignes
    await prisma.ligneCommande.deleteMany({
      where: { id_commande: id }
    });

    // 2. Create new lignes & update montant
    const updatedOrder = await prisma.commande.update({
      where: { id },
      data: {
        montant_total: montantTotal,
        lignes: {
          create: lignesData.map(l => ({
            quantite: l.quantite,
            type_service: l.type_service as 'Normal' | 'Express',
            note_etat: l.note_etat,
            sous_total: l.sous_total,
            service: { connect: { id: l.id_service } }
          }))
        }
      },
      include: {
        lignes: { include: { service: true } },
        client: true
      }
    });

    // 3. Update Facture
    if (order.facture) {
      await prisma.facture.update({
        where: { id: order.facture.id },
        data: { montant_total: montantTotal }
      });
    }

    res.json({ message: 'Panier mis à jour avec succès', order: updatedOrder });
  } catch (error) {
    console.error('Erreur updateOrderCart:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const partialWithdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { lines } = req.body; // { ligneId: string, qty: number }[]

    if (!lines || !Array.isArray(lines)) {
      res.status(400).json({ message: 'Données de retrait invalides.' });
      return;
    }

    const order = await prisma.commande.findUnique({
      where: { id },
      include: { lignes: true }
    });

    if (!order) {
      res.status(404).json({ message: 'Commande non trouvée.' });
      return;
    }

    if (order.etat === 'retire' || order.etat === 'annule' as any) {
      res.status(403).json({ message: 'Commande déjà retirée ou annulée.' });
      return;
    }

    let allRetrieved = true;

    for (const l of order.lignes) {
      const withdrawRequest = lines.find((reqLine: any) => reqLine.ligneId === l.id);
      let qtyToWithdraw = withdrawRequest ? withdrawRequest.qty : 0;
      
      const newRetrieved = l.quantite_retiree + qtyToWithdraw;
      
      if (newRetrieved > l.quantite) {
        res.status(400).json({ message: 'La quantité retirée dépasse la quantité commandée.' });
        return;
      }

      await prisma.ligneCommande.update({
        where: { id: l.id },
        data: { quantite_retiree: newRetrieved }
      });

      if (newRetrieved < l.quantite) {
        allRetrieved = false;
      }
    }

    const newStatus = allRetrieved ? 'retire' : 'retrait_partiel';

    const updatedOrder = await prisma.commande.update({
      where: { id },
      data: { etat: newStatus as any },
      include: { client: true, lignes: { include: { service: true } } }
    });

    res.json({ message: 'Retrait partiel enregistré avec succès', order: updatedOrder });
  } catch (error) {
    console.error('Erreur partialWithdraw:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

