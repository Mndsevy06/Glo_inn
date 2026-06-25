/**
 * PawaPay Service
 * Handles all communication with the PawaPay API.
 * Docs: https://docs.pawapay.io
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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
export const detectOperateur = (telephone: string): string => {
  // Normalize: remove spaces, dashes, leading +243 or 00243
  const normalized = telephone.replace(/[\s\-]/g, '').replace(/^(\+243|00243)/, '0');
  const prefix = normalized.substring(0, 3);

  const airtelPrefixes = ['097', '098', '099', '090', '091', '092', '093', '094', '095'];
  const orangePrefixes = ['084', '085', '086', '089'];
  const vodacomPrefixes = ['081', '082', '083', '080'];

  if (airtelPrefixes.includes(prefix)) return 'AIRTEL';
  if (orangePrefixes.includes(prefix)) return 'ORANGE';
  if (vodacomPrefixes.includes(prefix)) return 'MPESA';

  // Default fallback
  return 'AIRTEL';
};

/**
 * Format phone number for PawaPay (international format without '+')
 * Example: 0975123456 → 243975123456
 */
export const formatPhoneNumber = (telephone: string): string => {
  const normalized = telephone.replace(/[\s\-]/g, '').replace(/^(\+243|00243)/, '0');
  if (normalized.startsWith('0')) {
    return '243' + normalized.substring(1);
  }
  return normalized;
};

/**
 * Initiate a mobile money deposit (client pays)
 */
export const initiateDeposit = async (params: {
  montant: number;
  telephone: string;
  description: string;
  commandeId: string;
}) => {
  const depositId = uuidv4();
  const operateur = detectOperateur(params.telephone);
  const phoneFormatted = formatPhoneNumber(params.telephone);
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

/**
 * Get the status of a deposit
 */
export const getDepositStatus = async (depositId: string) => {
  const response = await fetch(`${getBaseUrl()}/deposits/${depositId}`, {
    headers: headers(),
  });
  return response.json();
};

/**
 * Verify webhook signature to ensure the request comes from PawaPay
 */
export const verifyWebhookSignature = (
  rawBody: string,
  signatureHeader: string | undefined
): boolean => {
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET;
  if (!secret || secret === 'VOTRE_WEBHOOK_SECRET_ICI') {
    console.warn('⚠️ PAWAPAY_WEBHOOK_SECRET non configuré — vérification ignorée');
    return true; // Allow during development
  }
  if (!signatureHeader) return false;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSig)
  );
};
