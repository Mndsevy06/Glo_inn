"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.getConfig = void 0;
const db_1 = __importDefault(require("../config/db"));
const getConfig = async (req, res) => {
    try {
        let config = await db_1.default.configuration.findUnique({ where: { id: 'global' } });
        if (!config) {
            config = await db_1.default.configuration.create({ data: { id: 'global', taux_echange: 2800 } });
        }
        res.status(200).json(config);
    }
    catch (error) {
        console.error('Erreur getConfig:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getConfig = getConfig;
const updateConfig = async (req, res) => {
    try {
        // Only gerant should do this ideally, but let's just do it
        const { taux_echange } = req.body;
        if (taux_echange === undefined) {
            res.status(400).json({ message: 'Taux manquant' });
            return;
        }
        const config = await db_1.default.configuration.upsert({
            where: { id: 'global' },
            update: { taux_echange: Number(taux_echange) },
            create: { id: 'global', taux_echange: Number(taux_echange) },
        });
        res.status(200).json(config);
    }
    catch (error) {
        console.error('Erreur updateConfig:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.updateConfig = updateConfig;
