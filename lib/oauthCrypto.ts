/**
 * OAuth Crypto Utilities
 *
 * Shared encryption/decryption for OAuth authorization codes.
 * Uses AES-256-GCM for secure, authenticated encryption.
 */

import crypto from 'crypto';

// Auth code secret - MUST be set in environment for production
const AUTH_CODE_SECRET = process.env.AUTH_CODE_SECRET;

if (!AUTH_CODE_SECRET) {
  console.error(
    '[OAuth] CRITICAL: AUTH_CODE_SECRET environment variable is not set! ' +
    'OAuth authorization codes will fail to decrypt across serverless invocations. ' +
    'Generate a secret with: openssl rand -hex 32'
  );
}

// Fallback only for development - will log warning
const SECRET = AUTH_CODE_SECRET || (() => {
  console.warn('[OAuth] Using random fallback secret - OAuth WILL FAIL in production!');
  return crypto.randomBytes(32).toString('hex');
})();

/**
 * Auth code data structure
 */
export interface AuthCodeData {
  user_id: string;
  access_token: string;
  refresh_token: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  scope: string;
  expires_at: number;
}

/**
 * Derive encryption key from secret
 */
function deriveKey(): Buffer {
  return crypto.scryptSync(SECRET, 'teed-oauth-salt', 32);
}

/**
 * Encrypt data into an authorization code
 */
export function encryptAuthCode(data: AuthCodeData): string {
  const iv = crypto.randomBytes(16);
  const key = deriveKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')]);
  return combined.toString('base64url');
}

/**
 * Decrypt authorization code to get data
 */
export function decryptAuthCode(authCode: string): AuthCodeData | null {
  try {
    const combined = Buffer.from(authCode, 'base64url');

    if (combined.length < 33) {
      console.error('[OAuth] Auth code too short to contain valid data');
      return null;
    }

    const iv = combined.subarray(0, 16);
    const authTag = combined.subarray(16, 32);
    const encrypted = combined.subarray(32);

    const key = deriveKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as AuthCodeData;
  } catch (err: any) {
    console.error('[OAuth] Failed to decrypt auth code:', err.message);
    // Log more details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[OAuth] Full error:', err);
    }
    return null;
  }
}

/**
 * Verify PKCE code_verifier against code_challenge
 */
export function verifyCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string | null
): boolean {
  if (!method || method === 'plain') {
    return codeVerifier === codeChallenge;
  } else if (method === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hash === codeChallenge;
  }
  return false;
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Check if AUTH_CODE_SECRET is properly configured
 */
export function isSecretConfigured(): boolean {
  return !!AUTH_CODE_SECRET;
}
