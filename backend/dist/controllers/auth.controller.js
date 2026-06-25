"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
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
