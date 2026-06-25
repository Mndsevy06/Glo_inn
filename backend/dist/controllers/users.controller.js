"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.toggleUserActive = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUserStats = exports.getAllUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const SALT_ROUNDS = 10;
// ─── GET ALL USERS ─────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const role = req.query.role;
        const search = req.query.search;
        const page = req.query.page || '1';
        const limit = req.query.limit || '10';
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (role && role !== 'all') {
            where.role = role;
        }
        if (search) {
            where.OR = [
                { nom: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { telephone: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            db_1.default.utilisateur.findMany({
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
            db_1.default.utilisateur.count({ where }),
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
    }
    catch (error) {
        console.error('Erreur getAllUsers:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getAllUsers = getAllUsers;
// ─── GET USER STATS ────────────────────────────────────────────────────────
const getUserStats = async (_req, res) => {
    try {
        const [total, clients, gerants, receptionnistes, actifs] = await Promise.all([
            db_1.default.utilisateur.count(),
            db_1.default.utilisateur.count({ where: { role: 'client' } }),
            db_1.default.utilisateur.count({ where: { role: 'gerant' } }),
            db_1.default.utilisateur.count({ where: { role: 'receptionniste' } }),
            db_1.default.utilisateur.count({ where: { actif: true } }),
        ]);
        res.status(200).json({ total, clients, gerants, receptionnistes, actifs, inactifs: total - actifs });
    }
    catch (error) {
        console.error('Erreur getUserStats:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getUserStats = getUserStats;
// ─── GET USER BY ID ────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await db_1.default.utilisateur.findUnique({
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
    }
    catch (error) {
        console.error('Erreur getUserById:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getUserById = getUserById;
// ─── CREATE USER ───────────────────────────────────────────────────────────
const createUser = async (req, res) => {
    try {
        const { nom, telephone, adresse, role, username, password } = req.body;
        if (!nom || !telephone || !role || !username || !password) {
            res.status(400).json({ message: 'Champs obligatoires manquants (nom, telephone, role, username, password).' });
            return;
        }
        // Vérifier unicité du username
        const existing = await db_1.default.utilisateur.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const user = await db_1.default.utilisateur.create({
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
    }
    catch (error) {
        console.error('Erreur createUser:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.createUser = createUser;
// ─── UPDATE USER ───────────────────────────────────────────────────────────
const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const { nom, telephone, adresse, role, username } = req.body;
        const existing = await db_1.default.utilisateur.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }
        // Vérifier unicité username si modifié
        if (username && username !== existing.username) {
            const taken = await db_1.default.utilisateur.findUnique({ where: { username } });
            if (taken) {
                res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
                return;
            }
        }
        const updated = await db_1.default.utilisateur.update({
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
    }
    catch (error) {
        console.error('Erreur updateUser:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateUser = updateUser;
// ─── DELETE USER ───────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db_1.default.utilisateur.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }
        await db_1.default.utilisateur.delete({ where: { id } });
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    }
    catch (error) {
        console.error('Erreur deleteUser:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.deleteUser = deleteUser;
// ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────
const toggleUserActive = async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await db_1.default.utilisateur.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }
        const updated = await db_1.default.utilisateur.update({
            where: { id },
            data: { actif: !existing.actif },
            select: { id: true, actif: true, nom: true },
        });
        const status = updated.actif ? 'activé' : 'désactivé';
        res.status(200).json({ message: `Utilisateur ${status}.`, user: updated });
    }
    catch (error) {
        console.error('Erreur toggleUserActive:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.toggleUserActive = toggleUserActive;
// ─── RESET PASSWORD ────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
    try {
        const id = req.params.id;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
            return;
        }
        const existing = await db_1.default.utilisateur.findUnique({ where: { id } });
        if (!existing) {
            res.status(404).json({ message: 'Utilisateur introuvable.' });
            return;
        }
        const hashed = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        await db_1.default.utilisateur.update({ where: { id }, data: { password: hashed } });
        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès.' });
    }
    catch (error) {
        console.error('Erreur resetPassword:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.resetPassword = resetPassword;
