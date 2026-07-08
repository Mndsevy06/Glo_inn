import { Request, Response } from 'express';
import prisma from '../config/db';

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = (req as any).user?.id;
    if (!id) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }
    const orders = await prisma.commande.findMany({
      where: { id_client: id, client_deleted: false },
      include: {
        lignes: { include: { service: true } },
        facture: true,
        avis: true,
      },
      orderBy: { date_reception: 'desc' }
    });

    const now = Date.now();
    const limit48h = 48 * 60 * 60 * 1000;
    
    for (const o of orders) {
      if (o.etat === 'en_attente' && (now - new Date(o.date_reception).getTime()) > limit48h) {
        await prisma.commande.update({
          where: { id: o.id },
          data: { etat: 'annule' as any }
        });
        o.etat = 'annule' as any;
      }
    }

    res.json(orders);
  } catch (error) {
    console.error('Erreur getMyOrders:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const deleteMyOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const id_commande = req.params.id as string;
    const userId = (req as any).user?.id;
    if (!userId) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }
    const order = await prisma.commande.findUnique({ where: { id: id_commande } });
    if (!order || order.id_client !== userId) {
      res.status(404).json({ message: 'Commande introuvable' });
      return;
    }
    if (order.etat !== 'retire') {
      res.status(403).json({ message: 'Seules les commandes retirées peuvent être supprimées' });
      return;
    }
    
    await prisma.commande.update({
      where: { id: id_commande },
      data: { client_deleted: true }
    });
    
    res.json({ message: 'Commande supprimée' });
  } catch (error) {
    console.error('Erreur deleteMyOrder:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = (req as any).user?.id;
    if (!id) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }
    const notifications = await prisma.notification.findMany({
      where: { id_utilisateur: id },
      orderBy: { date_envoi: 'desc' }
    });
    res.json(notifications);
  } catch (error) {
    console.error('Erreur getMyNotifications:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.id;
    if (!userId) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }
    
    // Ensure the notification belongs to the user
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.id_utilisateur !== userId) {
      res.status(404).json({ message: 'Notification introuvable' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { lue: true }
    });
    res.json({ message: 'Notification lue', notification: updated });
  } catch (error) {
    console.error('Erreur markNotificationRead:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
