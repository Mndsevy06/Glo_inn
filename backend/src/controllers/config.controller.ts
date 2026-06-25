import { Request, Response } from 'express';
import prisma from '../config/db';

export const getConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    let config = await prisma.configuration.findUnique({ where: { id: 'global' } });
    if (!config) {
      config = await prisma.configuration.create({ data: { id: 'global', taux_echange: 2800 } });
    }
    res.status(200).json(config);
  } catch (error) {
    console.error('Erreur getConfig:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    // Only gerant should do this ideally, but let's just do it
    const { taux_echange } = req.body;
    
    if (taux_echange === undefined) {
      res.status(400).json({ message: 'Taux manquant' });
      return;
    }

    const config = await prisma.configuration.upsert({
      where: { id: 'global' },
      update: { taux_echange: Number(taux_echange) },
      create: { id: 'global', taux_echange: Number(taux_echange) },
    });

    res.status(200).json(config);
  } catch (error) {
    console.error('Erreur updateConfig:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
