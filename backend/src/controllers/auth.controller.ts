import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
      return;
    }

    // Le champ "username" du frontend correspond à "username" (email) ou "nom"
    const user = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { username: username },
          { nom: username }
        ]
      }
    });

    if (!user) {
      res.status(401).json({ message: 'Identifiants incorrects.' });
      return;
    }

    // Le champ "password" du frontend correspond au "password" haché ou au "telephone"
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    const isPhoneMatch = (user.telephone === password);

    if (!isPasswordMatch && !isPhoneMatch) {
      res.status(401).json({ message: 'Identifiants incorrects.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Ne pas renvoyer le mot de passe au frontend
    const { password: _, ...userData } = user;

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Non autorisé' });
      return;
    }

    const { theme, currency } = req.body;
    
    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: {
        ...(theme !== undefined && { theme }),
        ...(currency !== undefined && { currency }),
      }
    });

    const { password: _, ...userData } = updatedUser;
    res.status(200).json({ message: 'Paramètres mis à jour', user: userData });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
