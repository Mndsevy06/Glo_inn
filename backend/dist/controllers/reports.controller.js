"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPerformanceScore = exports.getHourlyOrders = exports.getTopServices = exports.getPaymentModes = exports.getMonthlyRevenue = exports.getDailyRevenue = exports.getKpis = void 0;
const db_1 = __importDefault(require("../config/db"));
// ─── KPI GLOBAUX ───────────────────────────────────────────────────────────────
const getKpis = async (req, res) => {
    try {
        const periodDays = parseInt(req.query.period || '30', 10);
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const prevSince = new Date(since);
        prevSince.setDate(prevSince.getDate() - periodDays);
        // Commandes période courante
        const [currentCommandes, prevCommandes] = await Promise.all([
            db_1.default.commande.findMany({
                where: { date_reception: { gte: since } },
                include: { lignes: true },
            }),
            db_1.default.commande.findMany({
                where: { date_reception: { gte: prevSince, lt: since } },
                include: { lignes: true },
            }),
        ]);
        const toNum = (d) => parseFloat(d?.toString() ?? '0');
        const totalRevenu = currentCommandes.reduce((s, c) => s + toNum(c.montant_total), 0);
        const prevRevenu = prevCommandes.reduce((s, c) => s + toNum(c.montant_total), 0);
        const totalPaye = currentCommandes
            .filter(c => c.statut_paiement === 'Payee')
            .reduce((s, c) => s + toNum(c.montant_total), 0);
        const prevPaye = prevCommandes
            .filter(c => c.statut_paiement === 'Payee')
            .reduce((s, c) => s + toNum(c.montant_total), 0);
        const totalImpaye = totalRevenu - totalPaye;
        const prevImpaye = prevRevenu - prevPaye;
        const avgOrder = currentCommandes.length > 0 ? totalRevenu / currentCommandes.length : 0;
        const prevAvg = prevCommandes.length > 0 ? prevRevenu / prevCommandes.length : 0;
        const taux = currentCommandes.length > 0
            ? (currentCommandes.filter(c => c.statut_paiement === 'Payee').length / currentCommandes.length) * 100
            : 0;
        const prevTaux = prevCommandes.length > 0
            ? (prevCommandes.filter(c => c.statut_paiement === 'Payee').length / prevCommandes.length) * 100
            : 0;
        const trend = (curr, prev) => {
            if (prev === 0)
                return curr > 0 ? '+100%' : '0%';
            const pct = ((curr - prev) / prev) * 100;
            return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        };
        res.json({
            totalRevenu,
            totalPaye,
            totalImpaye,
            avgOrder,
            totalCommandes: currentCommandes.length,
            tauxConversion: parseFloat(taux.toFixed(1)),
            trends: {
                revenu: trend(totalRevenu, prevRevenu),
                paye: trend(totalPaye, prevPaye),
                impaye: trend(totalImpaye, prevImpaye),
                avg: trend(avgOrder, prevAvg),
                commandes: trend(currentCommandes.length, prevCommandes.length),
                taux: trend(taux, prevTaux),
            },
            up: {
                revenu: totalRevenu >= prevRevenu,
                paye: totalPaye >= prevPaye,
                impaye: totalImpaye <= prevImpaye,
                avg: avgOrder >= prevAvg,
                commandes: currentCommandes.length >= prevCommandes.length,
                taux: taux >= prevTaux,
            },
        });
    }
    catch (err) {
        console.error('getKpis:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getKpis = getKpis;
// ─── REVENUS JOURNALIERS (7 derniers jours) ────────────────────────────────────
const getDailyRevenue = async (_req, res) => {
    try {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });
        const results = await Promise.all(days.map(async (day) => {
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            const commandes = await db_1.default.commande.findMany({
                where: { date_reception: { gte: day, lt: next } },
                include: { lignes: { include: { service: true } } },
            });
            const toNum = (d) => parseFloat(d?.toString() ?? '0');
            const revenus = commandes.reduce((s, c) => s + toNum(c.montant_total), 0);
            const express = commandes.reduce((s, c) => s + c.lignes.filter(l => l.type_service === 'Express').reduce((ss, l) => ss + toNum(l.sous_total), 0), 0);
            const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            return {
                date: labels[day.getDay()],
                revenus,
                commandes: commandes.length,
                clients: new Set(commandes.map(c => c.id_client)).size,
                express,
            };
        }));
        res.json(results);
    }
    catch (err) {
        console.error('getDailyRevenue:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getDailyRevenue = getDailyRevenue;
// ─── REVENUS MENSUELS (6 derniers mois) ────────────────────────────────────────
const getMonthlyRevenue = async (_req, res) => {
    try {
        const months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() - (5 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });
        const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        const results = await Promise.all(months.map(async (start) => {
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            const commandes = await db_1.default.commande.findMany({
                where: { date_reception: { gte: start, lt: end } },
            });
            const toNum = (d) => parseFloat(d?.toString() ?? '0');
            const revenus = commandes.reduce((s, c) => s + toNum(c.montant_total), 0);
            // objectif fictif (+10% du mois précédent) — peut être remplacé par un modèle Objectif
            const objectif = Math.round(revenus * 1.1);
            return { mois: MONTH_LABELS[start.getMonth()], revenus, objectif };
        }));
        res.json(results);
    }
    catch (err) {
        console.error('getMonthlyRevenue:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getMonthlyRevenue = getMonthlyRevenue;
// ─── RÉPARTITION MODES DE PAIEMENT ────────────────────────────────────────────
const getPaymentModes = async (req, res) => {
    try {
        const periodDays = parseInt(req.query.period || '30', 10);
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const paiements = await db_1.default.paiement.findMany({
            where: { date_paiement: { gte: since } },
        });
        const toNum = (d) => parseFloat(d?.toString() ?? '0');
        const totaux = {};
        paiements.forEach(p => {
            totaux[p.mode_paiement] = (totaux[p.mode_paiement] || 0) + toNum(p.montant);
        });
        const grandTotal = Object.values(totaux).reduce((s, v) => s + v, 0);
        const result = Object.entries(totaux).map(([name, montant]) => ({
            name: name === 'PawaPay' ? 'PawaPay' : 'Cash',
            value: grandTotal > 0 ? parseFloat(((montant / grandTotal) * 100).toFixed(1)) : 0,
            montant,
        }));
        // Ajouter Mobile Money si absent (placeholder réaliste si 0)
        if (!result.find(r => r.name === 'Mobile Money')) {
            result.push({ name: 'Mobile Money', value: 0, montant: 0 });
        }
        res.json(result);
    }
    catch (err) {
        console.error('getPaymentModes:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getPaymentModes = getPaymentModes;
// ─── TOP SERVICES ──────────────────────────────────────────────────────────────
const getTopServices = async (req, res) => {
    try {
        const periodDays = parseInt(req.query.period || '30', 10);
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const lignes = await db_1.default.ligneCommande.findMany({
            where: { commande: { date_reception: { gte: since } } },
            include: { service: true },
        });
        const toNum = (d) => parseFloat(d?.toString() ?? '0');
        const map = {};
        lignes.forEach(l => {
            const key = l.service.libelle;
            if (!map[key])
                map[key] = { service: key, commandes: 0, revenus: 0 };
            map[key].commandes += l.quantite;
            map[key].revenus += toNum(l.sous_total);
        });
        const result = Object.values(map)
            .sort((a, b) => b.revenus - a.revenus)
            .slice(0, 6);
        res.json(result);
    }
    catch (err) {
        console.error('getTopServices:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getTopServices = getTopServices;
// ─── FLUX HORAIRE (aujourd'hui) ────────────────────────────────────────────────
const getHourlyOrders = async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const commandes = await db_1.default.commande.findMany({
            where: { date_reception: { gte: today, lt: tomorrow } },
        });
        const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8h → 18h
        const result = hours.map(h => {
            const count = commandes.filter(c => {
                const hr = new Date(c.date_reception).getHours();
                return hr === h;
            }).length;
            return { heure: `${h}h`, commandes: count };
        });
        res.json(result);
    }
    catch (err) {
        console.error('getHourlyOrders:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getHourlyOrders = getHourlyOrders;
// ─── SCORE DE PERFORMANCE ──────────────────────────────────────────────────────
const getPerformanceScore = async (req, res) => {
    try {
        const periodDays = parseInt(req.query.period || '30', 10);
        const since = new Date();
        since.setDate(since.getDate() - periodDays);
        const commandes = await db_1.default.commande.findMany({
            where: { date_reception: { gte: since } },
        });
        const total = commandes.length;
        if (total === 0) {
            return res.json([
                { subject: 'Revenus', A: 0 }, { subject: 'Clients', A: 0 },
                { subject: 'Délais', A: 0 }, { subject: 'Express', A: 0 },
                { subject: 'Paiements', A: 0 }, { subject: 'Satisfaction', A: 0 },
            ]);
        }
        const payeeCount = commandes.filter(c => c.statut_paiement === 'Payee').length;
        const retireCount = commandes.filter(c => c.etat === 'retire').length;
        const clients = new Set(commandes.map(c => c.id_client)).size;
        const toNum = (d) => parseFloat(d?.toString() ?? '0');
        const totalRevenu = commandes.reduce((s, c) => s + toNum(c.montant_total), 0);
        res.json([
            { subject: 'Revenus', A: Math.min(100, Math.round((totalRevenu / (total * 50000)) * 100)) },
            { subject: 'Clients', A: Math.min(100, Math.round((clients / total) * 100)) },
            { subject: 'Délais', A: Math.min(100, Math.round((retireCount / total) * 100)) },
            { subject: 'Express', A: 68 }, // placeholder — nécessite un modèle Express dédié
            { subject: 'Paiements', A: Math.min(100, Math.round((payeeCount / total) * 100)) },
            { subject: 'Satisfaction', A: 91 }, // placeholder — nécessite un modèle avis
        ]);
    }
    catch (err) {
        console.error('getPerformanceScore:', err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};
exports.getPerformanceScore = getPerformanceScore;
