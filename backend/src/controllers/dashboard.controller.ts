import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Commandes du jour
    const commandesAujourdhui = await prisma.commande.findMany({
      where: { date_reception: { gte: today } },
    });

    const revenusJour = commandesAujourdhui.reduce((s, c) => s + parseFloat(c.montant_total.toString()), 0);

    // Commandes d'hier
    const commandesHier = await prisma.commande.findMany({
      where: { date_reception: { gte: yesterday, lt: today } },
    });
    const revenusHier = commandesHier.reduce((s, c) => s + parseFloat(c.montant_total.toString()), 0);

    const revenusEvolution = revenusHier === 0 ? (revenusJour > 0 ? 100 : 0) : Math.round(((revenusJour - revenusHier) / revenusHier) * 100);

    // Commandes actives
    const commandesActives = await prisma.commande.count({
      where: { etat: { in: ['depose', 'en_cours', 'pret'] } },
    });
    const commandesPretes = await prisma.commande.count({
      where: { etat: 'pret' },
    });

    // Clients
    const clientCount = await prisma.utilisateur.count({
      where: { role: 'client' },
    });
    const nouveauxClients = await prisma.utilisateur.count({
      where: { role: 'client', createdAt: { gte: today } },
    });

    // Taux de paiement (toutes les commandes)
    const totalCommandes = await prisma.commande.count();
    const payeesCount = await prisma.commande.count({
      where: { statut_paiement: 'Payee' },
    });
    const tauxPaiement = totalCommandes === 0 ? 0 : Math.round((payeesCount / totalCommandes) * 100);

    // Week Data
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const cmds = await prisma.commande.findMany({
        where: { date_reception: { gte: d, lt: next } },
      });
      const rev = cmds.reduce((s, c) => s + parseFloat(c.montant_total.toString()), 0);
      
      const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      weekData.push({
        day: labels[d.getDay()],
        revenus: rev,
        commandes: cmds.length,
      });
    }

    // Status Pie
    const statusData = [
      { name: 'Prêt', value: await prisma.commande.count({ where: { etat: 'pret' } }), color: '#10b981' },
      { name: 'En cours', value: await prisma.commande.count({ where: { etat: 'en_cours' } }), color: '#6366f1' },
      { name: 'Déposé', value: await prisma.commande.count({ where: { etat: 'depose' } }), color: '#f59e0b' },
      { name: 'Retiré', value: await prisma.commande.count({ where: { etat: 'retire' } }), color: '#8b5cf6' },
    ];

    // Recent orders
    const recentOrders = await prisma.commande.findMany({
      take: 5,
      orderBy: { date_reception: 'desc' },
      include: { client: true, lignes: true },
    });

    const impayeesCount = totalCommandes - payeesCount;

    res.json({
      kpis: {
        revenusJour,
        revenusEvolution: revenusEvolution > 0 ? `+${revenusEvolution}%` : `${revenusEvolution}%`,
        commandesActives,
        commandesPretes,
        clientCount,
        nouveauxClients,
        tauxPaiement,
        payeesCount,
      },
      weekData,
      statusData,
      recentOrders: recentOrders.map(o => ({
        id: o.id.split('-')[0],
        client: { nom: o.client.nom },
        etat: o.etat,
        lignesCount: o.lignes.length,
        montant_total: parseFloat(o.montant_total.toString()),
        statut_paiement: o.statut_paiement,
      })),
      activity: {
        totalCommandes,
        payeesCount,
        delaiMoyen: '2.4',
        impayeesCount,
        satisfaction: 94,
      }
    });

  } catch (err) {
    console.error('getDashboardStats:', err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
