import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../config/db';

const SALT_ROUNDS = 10;

// ─── GET ALL USERS ─────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    const page = (req.query.page as string | undefined) || '1';
    const limit = (req.query.limit as string | undefined) || '10';

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search as string, mode: 'insensitive' } },
        { username: { contains: search as string, mode: 'insensitive' } },
        { telephone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.utilisateur.findMany({
        where,
        skip,
        take: limitNum,
        select: {
          id: true,
          nom: true,
          telephone: true,
          adresse: true,
          role: true,
          username: true,
          actif: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.utilisateur.count({ where }),
    ]);

    res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── GET USER STATS ────────────────────────────────────────────────────────
export const getUserStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [total, clients, gerants, receptionnistes, actifs] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.utilisateur.count({ where: { role: 'client' } }),
      prisma.utilisateur.count({ where: { role: 'gerant' } }),
      prisma.utilisateur.count({ where: { role: 'receptionniste' } }),
      prisma.utilisateur.count({ where: { actif: true } }),
    ]);

    res.status(200).json({ total, clients, gerants, receptionnistes, actifs, inactifs: total - actifs });
  } catch (error) {
    console.error('Erreur getUserStats:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── GET USER BY ID ────────────────────────────────────────────────────────
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const user = await prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        telephone: true,
        adresse: true,
        role: true,
        username: true,
        actif: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── CREATE USER ───────────────────────────────────────────────────────────
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nom, telephone, adresse, role, username, password } = req.body;

    if (!nom || !telephone || !role || !username || !password) {
      res.status(400).json({ message: 'Champs obligatoires manquants (nom, telephone, role, username, password).' });
      return;
    }

    // Vérifier unicité du username
    const existing = await prisma.utilisateur.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        telephone,
        adresse: adresse || '',
        role,
        username,
        password: hashedPassword,
        actif: true,
      },
      select: {
        id: true,
        nom: true,
        telephone: true,
        adresse: true,
        role: true,
        username: true,
        actif: true,
        createdAt: true,
      },
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès.', user });
  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── UPDATE USER ───────────────────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { nom, telephone, adresse, role, username } = req.body;

    const existing = await prisma.utilisateur.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    // Vérifier unicité username si modifié
    if (username && username !== existing.username) {
      const taken = await prisma.utilisateur.findUnique({ where: { username } });
      if (taken) {
        res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
        return;
      }
    }

    const updated = await prisma.utilisateur.update({
      where: { id },
      data: {
        ...(nom && { nom }),
        ...(telephone && { telephone }),
        ...(adresse !== undefined && { adresse }),
        ...(role && { role }),
        ...(username && { username }),
      },
      select: {
        id: true,
        nom: true,
        telephone: true,
        adresse: true,
        role: true,
        username: true,
        actif: true,
        createdAt: true,
      },
    });

    res.status(200).json({ message: 'Utilisateur mis à jour.', user: updated });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── DELETE USER ───────────────────────────────────────────────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.utilisateur.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    await prisma.utilisateur.delete({ where: { id } });

    res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────
export const toggleUserActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.utilisateur.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    const updated = await prisma.utilisateur.update({
      where: { id },
      data: { actif: !existing.actif },
      select: { id: true, actif: true, nom: true },
    });

    const status = updated.actif ? 'activé' : 'désactivé';
    res.status(200).json({ message: `Utilisateur ${status}.`, user: updated });
  } catch (error) {
    console.error('Erreur toggleUserActive:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    const existing = await prisma.utilisateur.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Utilisateur introuvable.' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.utilisateur.update({ where: { id }, data: { password: hashed } });

    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Erreur resetPassword:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
