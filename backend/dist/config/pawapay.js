"use strict";
/**
 * PawaPay Service
 * Handles all communication with the PawaPay API.
 * Docs: https://docs.pawapay.io
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.getDepositStatus = exports.initiateDeposit = exports.formatPhoneNumber = exports.detectOperateur = void 0;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const getBaseUrl = () => {
    const env = process.env.PAWAPAY_ENV || 'sandbox';
    return env === 'production'
        ? 'https://api.pawapay.io'
        : 'https://api.sandbox.pawapay.io';
};
const getToken = () => {
    const token = process.env.PAWAPAY_API_TOKEN;
    if (!token || token === 'VOTRE_TOKEN_SANDBOX_ICI') {
        throw new Error('PAWAPAY_API_TOKEN non configuré dans .env');
    }
    return token;
};
const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
});
/**
 * Déterminer l'opérateur MNO depuis le préfixe du numéro de téléphone (RDC)
 * Airtel: 097, 098, 099, 090, 091, 092, 093
 * Orange: 084, 085, 086, 089
 * Vodacom (M-Pesa): 081, 082, 083
 * MTN: 089 (certains)
 */
const detectOperateur = (telephone) => {
    // Normalize: remove spaces, dashes, leading +243 or 00243
    const normalized = telephone.replace(/[\s\-]/g, '').replace(/^(\+243|00243)/, '0');
    const prefix = normalized.substring(0, 3);
    const airtelPrefixes = ['097', '098', '099', '090', '091', '092', '093', '094', '095'];
    const orangePrefixes = ['084', '085', '086', '089'];
    const vodacomPrefixes = ['081', '082', '083', '080'];
    if (airtelPrefixes.includes(prefix))
        return 'AIRTEL';
    if (orangePrefixes.includes(prefix))
        return 'ORANGE';
    if (vodacomPrefixes.includes(prefix))
        return 'MPESA';
    // Default fallback
    return 'AIRTEL';
};
exports.detectOperateur = detectOperateur;
/**
 * Format phone number for PawaPay (international format without '+')
 * Example: 0975123456 → 243975123456
 */
const formatPhoneNumber = (telephone) => {
    const normalized = telephone.replace(/[\s\-]/g, '').replace(/^(\+243|00243)/, '0');
    if (normalized.startsWith('0')) {
        return '243' + normalized.substring(1);
    }
    return normalized;
};
exports.formatPhoneNumber = formatPhoneNumber;
/**
 * Initiate a mobile money deposit (client pays)
 */
const initiateDeposit = async (params) => {
    const depositId = (0, uuid_1.v4)();
    const operateur = (0, exports.detectOperateur)(params.telephone);
    const phoneFormatted = (0, exports.formatPhoneNumber)(params.telephone);
    const callbackUrl = `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000'}/api/payments/webhook`;
    const body = {
        depositId,
        amount: String(Math.round(params.montant)),
        currency: 'CDF',
        correspondent: operateur,
        payer: {
            type: 'MSISDN',
            address: { value: phoneFormatted },
        },
        customerTimestamp: new Date().toISOString(),
        statementDescription: params.description.substring(0, 22), // PawaPay max 22 chars
        callbackUrl,
        metadata: [
            { fieldName: 'commandeId', fieldValue: params.commandeId, isPII: false },
        ],
    };
    const response = await fetch(`${getBaseUrl()}/deposits`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `PawaPay error: ${response.status}`);
    }
    return { depositId, operateur, phoneFormatted, data };
};
exports.initiateDeposit = initiateDeposit;
/**
 * Get the status of a deposit
 */
const getDepositStatus = async (depositId) => {
    const response = await fetch(`${getBaseUrl()}/deposits/${depositId}`, {
        headers: headers(),
    });
    return response.json();
};
exports.getDepositStatus = getDepositStatus;
/**
 * Verify webhook signature to ensure the request comes from PawaPay
 */
const verifyWebhookSignature = (rawBody, signatureHeader) => {
    const secret = process.env.PAWAPAY_WEBHOOK_SECRET;
    if (!secret || secret === 'VOTRE_WEBHOOK_SECRET_ICI') {
        console.warn('⚠️ PAWAPAY_WEBHOOK_SECRET non configuré — vérification ignorée');
        return true; // Allow during development
    }
    if (!signatureHeader)
        return false;
    const expectedSig = crypto_1.default
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSig));
};
exports.verifyWebhookSignature = verifyWebhookSignature;
