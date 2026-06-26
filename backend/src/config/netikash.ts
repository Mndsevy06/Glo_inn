/**
 * Netikash Payment Service
 * Handles all communication with the Netikash API.
 * Docs: https://docs.netikash.com
 *
 * Flow:
 * 1. Obtain an access_token via OAuth2 client_credentials
 * 2. Create a payment request (cli-payments) → returns a payment link
 * 3. Redirect the customer to the payment link
 * 4. Receive webhook notifications for payment status updates
 * 5. Optionally poll GET /transactions/requests/{id} for status
 */

import crypto from 'crypto';

// ─── Configuration ────────────────────────────────────────────────────────────

const AUTH_BASE_URL = 'https://accounts.netikash.com';
const API_BASE_URL = 'https://api.netikash.com/api/v1/trs';

const getClientId = (): string => {
  const id = process.env.NETIKASH_CLIENT_ID;
  if (!id) throw new Error('NETIKASH_CLIENT_ID non configuré dans .env');
  return id;
};

const getClientSecret = (): string => {
  const secret = process.env.NETIKASH_CLIENT_SECRET;
  if (!secret) throw new Error('NETIKASH_CLIENT_SECRET non configuré dans .env');
  return secret;
};

// ─── Token Management (cached) ────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Obtain an OAuth2 access token using client_credentials grant.
 * Caches the token until it expires (with a 60-second buffer).
 */
export const getAccessToken = async (): Promise<string> => {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = getClientId();
  const clientSecret = getClientSecret();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Netikash auth error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Netikash: access_token absent de la réponse OAuth2');
  }

  cachedToken = data.access_token;
  // Cache with 60 seconds buffer before expiry
  const expiresIn = data.expires_in || 3600;
  tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

  console.log(`🔑 Netikash token obtenu (expire dans ${expiresIn}s)`);
  return cachedToken!;
};

// ─── API Headers ──────────────────────────────────────────────────────────────

const authHeaders = async () => {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// ─── Payment Request ──────────────────────────────────────────────────────────

export interface NetikashPaymentParams {
  amount: number;
  currency: 'USD' | 'CDF';
  ref: string;
  referer_url: string;
  label?: string;
}

export interface NetikashPaymentResponse {
  error: boolean;
  message?: string;
  expires_at: string;
  trans: string;
  status: string;
  link: string;
}

/**
 * Create a payment request via cli-payments.
 * Returns a payment link to redirect the client to.
 */
export const createPaymentRequest = async (
  params: NetikashPaymentParams
): Promise<NetikashPaymentResponse> => {
  const headers = await authHeaders();

  const body = {
    amount: params.amount,
    currency: params.currency,
    ref: params.ref,
    referer_url: params.referer_url,
    ...(params.label && { label: params.label }),
  };

  console.log(`💳 Netikash: creating payment request — amount=${params.amount} ${params.currency}, ref=${params.ref}`);

  const response = await fetch(
    `${API_BASE_URL}/transactions/requests/cli-payments`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.message || data.target || `HTTP ${response.status}`;
    console.error('❌ Netikash payment error:', data);
    throw new Error(`Netikash: ${errorMsg}`);
  }

  console.log(`✅ Netikash payment request created — trans=${data.trans}, link=${data.link}`);
  return data;
};

// ─── Check Payment Status ─────────────────────────────────────────────────────

/**
 * Extract the request ID from the Netikash payment link.
 * The ID is the last segment of the link URL.
 */
export const extractRequestId = (link: string): string => {
  const segments = link.replace(/\/+$/, '').split('/');
  return segments[segments.length - 1];
};

export interface NetikashStatusResponse {
  error?: boolean;
  message?: string;
  trans?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Check the status of a payment request using the request ID.
 */
export const getPaymentStatus = async (
  requestId: string
): Promise<NetikashStatusResponse> => {
  const headers = await authHeaders();

  const response = await fetch(
    `${API_BASE_URL}/transactions/requests/${requestId}`,
    {
      method: 'GET',
      headers,
    }
  );

  const data = await response.json();
  return data;
};

// ─── Webhook Signature Verification ───────────────────────────────────────────

/**
 * Verify the webhook signature sent by Netikash.
 * Algorithm: HMAC-SHA256 on the raw body (UTF-8), then Base64 encoded.
 * Headers: X-Signature (Base64 signature), X-Timestamp
 */
export const verifyWebhookSignature = (
  rawBody: string,
  signatureFromHeader: string | undefined,
  signingKey?: string
): boolean => {
  const key = signingKey || process.env.NETIKASH_WEBHOOK_SIGNING_KEY;

  if (!key) {
    console.warn('⚠️ NETIKASH_WEBHOOK_SIGNING_KEY non configuré — vérification ignorée');
    return true; // Allow during development
  }

  if (!signatureFromHeader) {
    console.warn('⚠️ Netikash webhook: X-Signature header manquant');
    return false;
  }

  const expected = crypto
    .createHmac('sha256', key)
    .update(rawBody, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signatureFromHeader)
    );
  } catch {
    return false;
  }
};
