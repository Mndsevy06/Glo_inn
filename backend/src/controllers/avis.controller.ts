import { Request, Response } from 'express';
import prisma from '../config/db';

// POST /api/avis  — Le client soumet un avis sur une commande payée
export const submitAvis = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = (req as any).user.id;
    const { id_commande, note, commentaire } = req.body;

    if (!id_commande || note === undefined) {
      res.status(400).json({ message: 'id_commande et note sont obligatoires.' });
      return;
    }
    if (note < 1 || note > 5) {
      res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
      return;
    }

    // Vérifier que la commande appartient au client et est payée
    const commande = await prisma.commande.findUnique({
      where: { id: id_commande },
      include: { client: { select: { nom: true } } },
    });

    if (!commande) {
      res.status(404).json({ message: 'Commande introuvable.' });
      return;
    }
    if (commande.id_client !== clientId) {
      res.status(403).json({ message: 'Vous ne pouvez pas laisser un avis sur cette commande.' });
      return;
    }
    if (commande.statut_paiement !== 'Payee') {
      res.status(400).json({ message: 'Vous ne pouvez laisser un avis que sur une commande payée.' });
      return;
    }

    // Upsert : un seul avis par commande
    const avis = await prisma.avis.upsert({
      where: { id_commande },
      create: {
        id_commande,
        id_client: clientId,
        note,
        commentaire: commentaire || null,
      },
      update: {
        note,
        commentaire: commentaire || null,
        lu: false, // reset lu si modifié
      },
      include: { client: { select: { nom: true } } },
    });

    // Trouver le(s) gérant(s) et les notifier en temps réel
    const gerants = await prisma.utilisateur.findMany({
      where: { role: 'gerant', actif: true },
      select: { id: true },
    });

    try {
      const { getIO } = await import('../config/socket');
      const io = getIO();
      gerants.forEach((g) => {
        io.to(g.id).emit('new_avis', {
          avis,
          commandeRef: commande.id.split('-')[0].toUpperCase(),
          clientNom: commande.client.nom,
        });
      });
    } catch (socketErr) {
      console.warn('Socket non disponible:', socketErr);
    }

    res.status(201).json({ message: 'Avis enregistré avec succès.', avis });
  } catch (error) {
    console.error('Erreur submitAvis:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/avis  — Gérant : liste tous les avis
export const getAllAvis = async (req: Request, res: Response): Promise<void> => {
  try {
    const avis = await prisma.avis.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { nom: true, telephone: true } },
        commande: { select: { id: true, montant_total: true, date_reception: true } },
      },
    });
    res.json(avis);
  } catch (error) {
    console.error('Erreur getAllAvis:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/avis/unread-count  — Gérant : nombre d'avis non lus
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await prisma.avis.count({ where: { lu: false } });
    res.json({ count });
  } catch (error) {
    console.error('Erreur getUnreadCount:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/avis/:id/read  — Gérant : marquer un avis comme lu
export const markAvisRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.avis.update({ where: { id }, data: { lu: true } });
    res.json({ message: 'Avis marqué comme lu.' });
  } catch (error) {
    console.error('Erreur markAvisRead:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/avis/read-all  — Gérant : tout marquer comme lu
export const markAllAvisRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.avis.updateMany({ where: { lu: false }, data: { lu: true } });
    res.json({ message: 'Tous les avis marqués comme lus.' });
  } catch (error) {
    console.error('Erreur markAllAvisRead:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
