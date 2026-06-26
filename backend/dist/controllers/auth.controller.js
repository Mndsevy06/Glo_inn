"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ message: 'Veuillez remplir tous les champs.' });
            return;
        }
        // Le champ "username" du frontend correspond à "username" (email) ou "nom"
        const user = await db_1.default.utilisateur.findFirst({
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
        const isPasswordMatch = await bcrypt_1.default.compare(password, user.password);
        const isPhoneMatch = (user.telephone === password);
        if (!isPasswordMatch && !isPhoneMatch) {
            res.status(401).json({ message: 'Identifiants incorrects.' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        // Ne pas renvoyer le mot de passe au frontend
        const { password: _, ...userData } = user;
        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: userData
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { nom, telephone, adresse, username, password } = req.body;
        if (!nom || !telephone || !username || !password) {
            res.status(400).json({ message: 'Champs obligatoires manquants (nom, telephone, username, password).' });
            return;
        }
        // Vérifier unicité du username
        const existing = await db_1.default.utilisateur.findUnique({ where: { username } });
        if (existing) {
            res.status(409).json({ message: `Le nom d'utilisateur "${username}" est déjà pris.` });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await db_1.default.utilisateur.create({
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
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        const { password: _, ...userData } = user;
        res.status(201).json({
            message: 'Inscription réussie.',
            token,
            user: userData
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.register = register;
const updateSettings = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Non autorisé' });
            return;
        }
        const { theme, currency } = req.body;
        const updatedUser = await db_1.default.utilisateur.update({
            where: { id: userId },
            data: {
                ...(theme !== undefined && { theme }),
                ...(currency !== undefined && { currency }),
            }
        });
        const { password: _, ...userData } = updatedUser;
        res.status(200).json({ message: 'Paramètres mis à jour', user: userData });
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateSettings = updateSettings;
