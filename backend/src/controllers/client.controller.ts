import { Request, Response } from 'express';
import prisma from '../config/db';

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
    if (!id) {
       res.status(401).json({ message: 'Non autorisé' });
       return;
    }
    const orders = await prisma.commande.findMany({
      where: { id_client: id },
      include: {
        lignes: { include: { service: true } },
        facture: true
      },
      orderBy: { date_reception: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Erreur getMyOrders:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user?.id;
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
    const id = req.params.id;
    const userId = req.user?.id;
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
