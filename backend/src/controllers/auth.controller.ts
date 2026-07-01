import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
      return;
    }

    // Le champ "email" du frontend correspond au "username", "nom" ou "telephone" (où l'email est souvent stocké)
    const user = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { username: email },
          { nom: email },
          { telephone: email }
        ]
      }
    });

    if (!user) {
      res.status(401).json({ message: 'Identifiants incorrects.' });
      return;
    }

    // Le champ "password" du frontend correspond au "password" haché, au "telephone", ou au "username" (email)
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    const isPhoneMatch = (user.telephone === password);
    const isEmailMatch = (user.username === password);

    if (!isPasswordMatch && !isPhoneMatch && !isEmailMatch) {
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

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, telephone, adresse, username, password } = req.body;

    if (!nom || !telephone || !username || !password) {
      res.status(400).json({ message: 'Champs obligatoires manquants (nom, telephone, username, password).' });
      return;
    }

    // Vérifier unicité du username
    const existing = await prisma.utilisateur.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        telephone,
        adresse: adresse || '',
        role: 'client',
        username,
        password: hashedPassword,
        actif: true,
      }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...userData } = user;

    res.status(201).json({ 
      message: 'Inscription réussie.',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
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
